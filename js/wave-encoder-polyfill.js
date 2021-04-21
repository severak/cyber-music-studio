(() => {
  // node_modules/audio-recorder-polyfill/wave-encoder/index.js
  var wave_encoder_default = () => {
    let BYTES_PER_SAMPLE = 2;
    let recorded = [];
    function encode(buffer) {
      let length = buffer.length;
      let data = new Uint8Array(length * BYTES_PER_SAMPLE);
      for (let i = 0; i < length; i++) {
        let index = i * BYTES_PER_SAMPLE;
        let sample = buffer[i];
        if (sample > 1) {
          sample = 1;
        } else if (sample < -1) {
          sample = -1;
        }
        sample = sample * 32768;
        data[index] = sample;
        data[index + 1] = sample >> 8;
      }
      recorded.push(data);
    }
    function dump(sampleRate) {
      let bufferLength = recorded.length ? recorded[0].length : 0;
      let length = recorded.length * bufferLength;
      let wav = new Uint8Array(44 + length);
      let view = new DataView(wav.buffer);
      view.setUint32(0, 1380533830, false);
      view.setUint32(4, 36 + length, true);
      view.setUint32(8, 1463899717, false);
      view.setUint32(12, 1718449184, false);
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * BYTES_PER_SAMPLE, true);
      view.setUint16(32, BYTES_PER_SAMPLE, true);
      view.setUint16(34, 8 * BYTES_PER_SAMPLE, true);
      view.setUint32(36, 1684108385, false);
      view.setUint32(40, length, true);
      for (let i = 0; i < recorded.length; i++) {
        wav.set(recorded[i], i * bufferLength + 44);
      }
      recorded = [];
      postMessage(wav.buffer, [wav.buffer]);
    }
    onmessage = (e) => {
      if (e.data[0] === "encode") {
        encode(e.data[1]);
      } else if (e.data[0] === "dump") {
        dump(e.data[1]);
      }
    };
  };

  // node_modules/audio-recorder-polyfill/index.js
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var createWorker = (fn) => {
    let js = fn.toString().replace(/^(\(\)\s*=>|function\s*\(\))\s*{/, "").replace(/}$/, "");
    let blob = new Blob([js]);
    return new Worker(URL.createObjectURL(blob));
  };
  var error = (method) => {
    let event = new Event("error");
    event.data = new Error("Wrong state for " + method);
    return event;
  };
  var context;
  var MediaRecorder = class {
    constructor(stream, config = null) {
      this.stream = stream;
      this.config = config;
      this.state = "inactive";
      this.em = document.createDocumentFragment();
      this.encoder = createWorker(MediaRecorder.encoder);
      let recorder = this;
      this.encoder.addEventListener("message", (e) => {
        let event = new Event("dataavailable");
        event.data = new Blob([e.data], {type: recorder.mimeType});
        recorder.em.dispatchEvent(event);
        if (recorder.state === "inactive") {
          recorder.em.dispatchEvent(new Event("stop"));
        }
      });
    }
    start(timeslice) {
      if (this.state !== "inactive") {
        return this.em.dispatchEvent(error("start"));
      }
      this.state = "recording";
      if (!context) {
        context = new AudioContext(this.config);
      }
      this.clone = this.stream.clone();
      this.input = context.createMediaStreamSource(this.clone);
      this.processor = context.createScriptProcessor(2048, 1, 1);
      this.encoder.postMessage(["init", context.sampleRate]);
      this.processor.onaudioprocess = (e) => {
        if (this.state === "recording") {
          this.encoder.postMessage(["encode", e.inputBuffer.getChannelData(0)]);
        }
      };
      this.input.connect(this.processor);
      this.processor.connect(context.destination);
      this.em.dispatchEvent(new Event("start"));
      if (timeslice) {
        this.slicing = setInterval(() => {
          if (this.state === "recording")
            this.requestData();
        }, timeslice);
      }
      return void 0;
    }
    stop() {
      if (this.state === "inactive") {
        return this.em.dispatchEvent(error("stop"));
      }
      this.requestData();
      this.state = "inactive";
      this.clone.getTracks().forEach((track) => {
        track.stop();
      });
      this.processor.disconnect();
      this.input.disconnect();
      return clearInterval(this.slicing);
    }
    pause() {
      if (this.state !== "recording") {
        return this.em.dispatchEvent(error("pause"));
      }
      this.state = "paused";
      return this.em.dispatchEvent(new Event("pause"));
    }
    resume() {
      if (this.state !== "paused") {
        return this.em.dispatchEvent(error("resume"));
      }
      this.state = "recording";
      return this.em.dispatchEvent(new Event("resume"));
    }
    requestData() {
      if (this.state === "inactive") {
        return this.em.dispatchEvent(error("requestData"));
      }
      return this.encoder.postMessage(["dump", context.sampleRate]);
    }
    addEventListener(...args) {
      this.em.addEventListener(...args);
    }
    removeEventListener(...args) {
      this.em.removeEventListener(...args);
    }
    dispatchEvent(...args) {
      this.em.dispatchEvent(...args);
    }
  };
  MediaRecorder.prototype.mimeType = "audio/wav";
  MediaRecorder.isTypeSupported = (mimeType) => {
    return MediaRecorder.prototype.mimeType === mimeType;
  };
  MediaRecorder.notSupported = !navigator.mediaDevices || !AudioContext;
  MediaRecorder.encoder = wave_encoder_default;
  var audio_recorder_polyfill_default = MediaRecorder;

  // polyfill.js
  window.WaveAudioRecorder = audio_recorder_polyfill_default;
})();
