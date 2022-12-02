// hearthbeat.js - simple WebAudio library
// (c) Severák 2021

// My heart starts missing a beat
// Every time...

var hb = {};

// audio context
hb.start = function() {
	// needs to be started from interaction with page
	var AudioContext = window.AudioContext || window.webkitAudioContext;
	hb.ac= new AudioContext();
};

// common functions

hb.now = function() {
    hb.ac.currentTime;
};

hb.clamp = function(min, v, max) {
	if (v < min) return min;
	if (v > max) return max;
	return v;
};

hb.midi2cps = function(midi, A4) {
	A4 = A4 || 440;
	return A4 * Math.pow(2, (midi - 69) / 12);
};

hb.cps2midi = function(cps, A4) {
	A4 = A4 || 440;
	return 69 + 12 * Math.log2(cps / A4);
};

// ADSR & audioParam stuff

hb.adsrStart = function(audioParam, env) {
	env.max = env.max || 1;
	env.attack = env.attack || 0.05;
	env.decay = env.decay || 0.01;
	env.sustain = env.sustain || 0;
	var curr = audioParam.value;
	audioParam.cancelScheduledValues(hb.ac.currentTime);
	audioParam.setValueAtTime(curr, hb.ac.currentTime); // stop ENV at current point
	audioParam.linearRampToValueAtTime(env.max, hb.ac.currentTime + env.attack); // move to max
	audioParam.linearRampToValueAtTime(env.sustain, hb.ac.currentTime + env.attack + env.decay); // move to sustain level
};

hb.adsrStop = function(audioParam, env) {
	env.max = env.max || 1;
	env.sustain = env.sustain || 0;
	env.release = env.release || 0.05;
	var curr = audioParam.value;
	audioParam.cancelScheduledValues(hb.ac.currentTime);
	audioParam.setValueAtTime(curr, hb.ac.currentTime); // stop ENV at current point
	audioParam.linearRampToValueAtTime(0, hb.ac.currentTime + env.release); // move to 0
};

hb.moveTo = function(audioParam, target, time) {
	var curr = audioParam.value;
	audioParam.cancelScheduledValues(hb.ac.currentTime);
	audioParam.setValueAtTime(curr, hb.ac.currentTime); // stop ENV at current point
	audioParam.linearRampToValueAtTime(target, hb.ac.currentTime + time); // move to 0
};

hb.setNow = function(audioParam, target) {
    audioParam.cancelScheduledValues(hb.ac.currentTime);
    audioParam.setValueAtTime(target, hb.ac.currentTime);
};

// primitives

hb.makeOsc = function(wave, freq, startAt) {
    if (!startAt) startAt = hb.ac.currentTime;
    var osc = hb.ac.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, startAt);
    osc.start(startAt);
    return osc;
};

hb.makePwmOsc = function(wave, freq, startAt) {
    // TODO - implement from https://github.com/pendragon-andyh/WebAudio-PulseOscillator
};

hb.makeNoiseOsc = function(startAt) {
    if (!startAt) startAt = hb.ac.currentTime;
    // adapted from https://noisehack.com/generate-noise-web-audio-api/
	// important - noise must be longer than 2s to be perceived as noise
    var bufferSize = 2 * hb.ac.sampleRate,
        noiseBuffer = hb.ac.createBuffer(1, bufferSize, hb.ac.sampleRate),
        output = noiseBuffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    var osc = hb.ac.createBufferSource();
    osc.buffer = noiseBuffer;
    osc.loop = true;
    osc.start(startAt);

    return osc;
};

hb.generateWaveformBuffer = function(generator, params, len) {
	if (!params) params = {};
	if (!len) len = hb.midi2cps(60);
	// console.log('len ' + len);
	var buffer = hb.ac.createBuffer(1, len, hb.ac.sampleRate);
	var chan = buffer.getChannelData(0);
	for (var i = 0; i < len; i++) {
		var n = i / len;
		chan[i] = generator(n, params);
	}
	return buffer;
};

hb.generators = {
	sin: function(n) {
		return Math.sin(n * 2 * Math.PI);
	},
	sqr: function(n) {
		if (n < 0.5) return 1;
		return -1;
	},
	pulse: function(n, params) {
		if (!params.width) params.width = 0.1;
		if (n < params.width) return 1;
		return -1;
	},
	saw: function(n) {
		return (n * 2) - 1;
	},
    // TODO - ramp (opak saw)
	triangle: function(n) {
		// TODO - rework this horrible mess
		if (n < 0.25) return n * 4;
		if (n==0.25) return 1;
		if (n > 0.25 && n < 0.75) return 1- ((n-0.25) * 4);
		if (n==0.75) return -1;
		if (n > 0.75) return ((n - 0.75) * 4) - 1;
	}
};

hb.makeSamplerOsc = function(buffer, freq, baseFreq, startAt) {
	if (!startAt) startAt = hb.ac.currentTime;
	if (!baseFreq) baseFreq = hb.midi2cps(60);

	var osc = hb.ac.createBufferSource();
	osc.buffer = buffer;
	osc.playbackRate.setValueAtTime(freq / baseFreq, startAt);
	osc.start(startAt);

	osc.frequency = {
		setValueAtTime : function(freq, at) {
			osc.playbackRate.setValueAtTime(freq / baseFreq, at);
		}
	};

	return osc;
};

hb.makeSamplerLoopOsc = function(buffer, freq, baseFreq, startAt) {
    var osc = hb.makeSamplerOsc(buffer, freq, baseFreq, startAt);
    osc.loop = true;
    return osc;
};

hb.makeDrumOsc = function(buffer, startAt) {
    if (!startAt) startAt = hb.ac.currentTime;

    var osc = hb.ac.createBufferSource();
    osc.buffer = buffer;
    osc.start(startAt);

    return osc;
};

hb.makeConstantOsc = function(n) {
    var constant = hb.ac.createConstantSource();
    constant.offset.value = n;
    return constant;
};

hb.makeGain = function(vol) {
    if (!vol) vol = 0;
	var gainNode = hb.ac.createGain();
	// for some unknown reason this has to be set this way, unless Chrome starts our ENV at maximum loudness
	gainNode.gain.value = vol;
	return gainNode;
};

hb.makeFilter = function(type, freq) {
    if (!freq) freq = 0;
    if (!type) type = 'lowpass';
    var filter = hb.ac.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, hb.ac.currentTime);
    return filter;
};

// TODO - adder and multiplier

hb.makeAdder = function(a, b) {
	var adder = hb.makeGain(1);
	for (var i = 0; i < arguments.length; i++) {
		var node = arguments[i];
		if (!isNaN(node)) node = hb.makeConstantOsc(node);
		node.connect(adder);
	}
	return adder;
};

hb.makeMultiplier = function(a, b) {
	// TODO - rewrite - this is everything but elegant
	var multiplier;
	if (!isNaN(b)) {
		multiplier = hb.makeGain(b);
	} else {
		multiplier = hb.makeGain(1);
		multiplier.connect(b);
	}
	if (!isNaN(a)) a = makeConstant(a);
	a.connect(multiplier);
	return multiplier;
};

hb.chain = function(a) {
	var prevNode = false;
	for (var i = 0; i < arguments.length; i++) {
		var currNode = arguments[i];
		if (!prevNode instanceof AudioNode) {
		    return false;
        }
		if (prevNode) prevNode.connect(currNode);
		prevNode = currNode;
	}
	return true;
};

hb.unchain = function(a) {
    var prevNode = false;
    for (var i = 0; i < arguments.length; i++) {
        var currNode = arguments[i];
        if (!prevNode instanceof AudioNode) {
            return false;
        }
        if (prevNode) prevNode.disconnect(currNode);
        prevNode = currNode;
    }
    return true;
};

// metronome
hb.makeMetronome = function(click) {
	var me = {};
	me._running = false;
	me._nextStep = -1;

	me.setBpm = function(bpm, div) {
		div = div || 4;
		me._stepTime = 60 / (bpm * div);
	};

	me.setCps = function(cps) {
		me._stepTime = 1 / cps;
	};

	me.start = function () {
		if (me._running) {
			return;
		}
		me._running = true;
		me._nextStep = hb.ac.currentTime;
		me.tick();
	};

	me.stop = function () {
		me._running = false;
	};

	me.tick = function () {
		if (hb.ac.currentTime >= me._nextStep) {
			click();
			me._nextStep = hb.ac.currentTime + me._stepTime;
		}
		if (me._running) {
			setTimeout(me.tick, 1);
		}
	};

	me.setBpm(120);
	return me;
};

// MIDI stuff
hb.midi2call = function(midi_data, synth, only_channel) {
	// heavily inspired by JZZ.js and webmidi.js
	only_channel = only_channel || -1;
	var firstByte = midi_data[0];
	var note = midi_data[1];
	var velocity = midi_data[2];
	if (firstByte < 0 || firstByte > 255) return; // invalid MIDI data
	var channel = firstByte & 15;
	var channelCommand = firstByte >> 4;

	if (only_channel > 0 && channel != only_channel) {
		return; // event on different channel
	}

	if (channelCommand == 8 || (channelCommand == 9 && velocity == 0) ) {
		synth.noteOff(note);
	} else if (channelCommand == 9) {
		synth.noteOn(note, velocity);
	} else if (channelCommand == 11  && synth.CC) {
		synth.CC(note, velocity);
	} else if (channelCommand == 12  && synth.programChange) {
		synth.programChange(note, velocity);
	} else if (channelCommand == 14  && synth.pitchBend) {
		var _14bit = velocity;
		_14bit <<= 7;
		_14bit |= note;
		synth.pitchBend((_14bit - 0x2000) / 0x2000);
	} else if (channelCommand == 0xb) {
		if (note == 0x78 || note == 0x7b) {
			synth.panic();
		} else if (note == 0x40) {
			// damper?
		}
	} else if (firstByte == 0x0f && synth.sysex) {
		synth.sysex(midi_data); // TODO - this was not tested
	} else if (firstByte == 0xfa && synth.start) {
		synth.start();
	} else if (firstByte == 0xfc && synth.stop) {
		synth.stop();
	}
};

// components

/*
// qValues calculation from  https://github.com/Bloomca/equalizer/blob/6e8b49e9868d1f8289766414f4b9f0bcbcc21f37/src/player/index.js#L22
let filterValues = [80, 1000, 12000];
let qValues = [];

filterValues.forEach(function(freq, i, arr) {
	if (!i || i === arr.length - 1) {
		qValues.push(null);
	} else {
		qValues.push(2 * freq / Math.abs(arr[i + 1] - arr[i - 1]));
	}
});

console.log(qValues);
*/


hb.MixStrip = function() {
	var me = {};
	me.hi = 0;
	me.mid = 0;
	me.low = 0;
	me.pan = 0;
	me.reverb = 0;
	me.reverb_len = 3;
	me.vol = 1;

	me.input = hb.makeGain(1);
	me._mute = hb.makeGain(1);
	me._hi = hb.makeFilter('highshelf');
	me._low = hb.makeFilter('lowshelf');
	me._mid = hb.makeFilter('peaking');
	me._hi.frequency.setValueAtTime(12000, hb.ac.currentTime);
	me._mid.frequency.setValueAtTime(1000, hb.ac.currentTime);
	me._mid.Q.value = 0.1677; // TODO - spočítat Q
	me._low.frequency.setValueAtTime(80, hb.ac.currentTime);
	me._panner = hb.ac.createStereoPanner();
	me._toReverb = hb.makeGain(0);

	me._reverb = hb.ac.createConvolver();

	me.output = hb.makeGain(1);

	hb.chain(me.input, me._mute, me._low, me._mid, me._hi, me._panner, me.output);
	me._hi.connect(me._toReverb);
	hb.chain(me._toReverb, me._reverb, me.output);

	me.genReverb = function(sec) {
		me._reverb.buffer = hb.generateWaveformBuffer(function(n) {
			return (Math.random() * 2 -1)  * (1 - n);
		}, {}, hb.ac.sampleRate * sec);
	};

	me.genReverb(me.reverb_len);

	me.param = function(name, val) {
		me[name] = val;
		if (name=='hi') me._hi.gain.setValueAtTime(val, hb.ac.currentTime);
		if (name=='low') me._low.gain.setValueAtTime(val, hb.ac.currentTime);
		if (name=='mid') me._mid.gain.setValueAtTime(val, hb.ac.currentTime);
		if (name=='pan') me._panner.pan.setValueAtTime(val, hb.ac.currentTime);
		if (name=='reverb') me._toReverb.gain.setValueAtTime(val, hb.ac.currentTime);
		if (name=='reverb_len') me.genReverb(val);
		if (name=='vol') me.output.gain.setValueAtTime(val, hb.ac.currentTime);
	};

	return me;
};

hb.TapeRecorder = function() {
	var me = {};
	me.playtrough = false;
	me.status = 'standby';
	me.input = hb.makeGain(0);
	me.output = hb.makeGain(1);
	me._dest = hb.ac.createMediaStreamDestination();
	me._audio = document.createElement('audio');
	me._audio.src = 'data:audio/wav;base64,UklGRnwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVgAAAAAAAAAAAAAAAAAAAD//wIA/v8CAP3/BAD7/wUA/P8CAAAA//8BAAAA//8AAAIA/f8DAP7/AAACAP3/AwD9/wMA/f8DAP7/AQD//wEA//8BAP//AQD//wEA'; // silence
	me._player = hb.ac.createMediaElementSource(me._audio);
	me._wip = [];

	hb.chain(me.input, me.output);
	hb.chain(me.input, me._dest);
	hb.chain(me._player, me.output);

	me.loadLocalFile = function(file) {
	    var reader = new FileReader();
        reader.onload = function(e) {
            me.makeFilename();
            me._audio.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

	me.loadRemoteFile = function(url) {
		me._audio.src = url;
    };

	me.downloadFile = function() {
	    var a = document.createElement('a');
	    a.href = me._audio.src;
	    a.target = '_blank';
	    a.click();
    };

	me.makeFilename = function() {
		return "recording" + (new Date().toISOString().replace(/[:\- ]/g, ''));
	};

	me.record = function () {
		me.status = 'recording';
		hb.setNow(me.input.gain, 1);
		hb.setNow(me.output.gain, me.playtrough ? 1 : 0);
		me._wip = [];

		var mediaRecorder = MediaRecorder.isTypeSupported("audio/wav") ? new MediaRecorder(me._dest.stream, {mimeType: "audio/wav"}) : new WaveAudioRecorder(me._dest.stream, {mimeType: "audio/wav"});

		mediaRecorder.addEventListener('dataavailable', function(evt) {
			me._wip.push(evt.data);
		});

		mediaRecorder.addEventListener('stop', function(evt) {
			me.status = 'standby';
			var blob = new File(me._wip, me.makeFilename(), {type: "audio/wav"});
			me._audio.src = URL.createObjectURL(blob);
			me._wip = [];
		});

		mediaRecorder.start();
		me._mediaRecorder = mediaRecorder;
	};

	me.stop = function () {
		if (me.status=='recording') {
            me._mediaRecorder.stop();
        } else if (me.status=='playing') {
			me._audio.pause();
        }
		me.status = 'standby';
		hb.setNow(me.input.gain, 0);
		hb.setNow(me.output.gain, 0);
    };

	me.autostop = function() {
	    // TODO
    };

	me.play = function (onStop) {
		me.status = 'playing';
		hb.setNow(me.input.gain, 0);
		hb.setNow(me.output.gain, 1);
		me._audio.currentTime = 0;
        me._audio.play();
        me._audio.onended = function () {
			me.status = 'standby';
			if (onStop) onStop();
		};
	};

	return me;
};

// - tape - https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamAudioDestinationNode

window.hb = hb;

// bonus - hb.chnget

if (window.ub && ub.on) {
    // monitors elem element and updates param from it
	hb.chnget= function(synth, param, elem) {
		if (!elem) elem = param;
		if (ub.gebi(elem).tagName=="SELECT") {
			// select -> string
			ub.on(elem, 'change', function(){
				synth.param(param, ub.gebi(param).value);
			});
			synth.param(param, ub.gebi(param).value);
		} else if (ub.gebi(elem).getAttribute("type")=="checkbox") {
			// checkbox -> bool
			ub.on(elem, 'change', function(){
				synth.param(param, ub.gebi(param).checked);
			});
			synth.param(param, ub.gebi(elem).checked);
		} else {
			// numeric
			ub.on(elem, 'change', function(){
				synth.param(param, ub.tonumber(ub.gebi(elem).value));
			});
			synth.param(param, ub.tonumber(ub.gebi(elem).value));
			if (ub.gebi(elem).getAttribute("type")=="range") {
				// slider is adjustable in real time
				ub.on(elem, 'input', function(){
					synth.param(param, ub.tonumber(ub.gebi(elem).value));
				});
				// TODO - možná smazat
				var defaultValue = ub.gebi(elem).value;
				ub.on(elem, 'dblclick', function () {
					ub.gebi(elem).value = defaultValue;
					synth.param(param, ub.tonumber(defaultValue));
				});
			}
		}
	}
}



