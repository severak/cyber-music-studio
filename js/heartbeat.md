# heartbeat.js

library which wraps webaudio interface and makes it easier to use.

Currently in development phase, so may works little differently than described. Sorry for that, I am making it in my free time.

## primitives

these function creates various audio nodes and connects them.  

- `hb.start()` - starts webaudio. **Important** - you have to call this before using anything from this library!
- `hb.now()` - returns current time
- `hb.clamp(min, v, max)` - enforces limits `min` and `max` for value `v`
- `hb.midi2cps(nn, A4=440)` - converts `nn` MIDI note number to frequency (based on `A4` tuning value)
- `hb.cps2midi(freq, A4=440)` - converts `freq`ency to MIDI note number (based on `A4` tuning value)
- `hb.makeOsc(wave, freq, startAt=hb.now())` - makes `OscillatorNode` with waveform `wave` and frequency `freq`
- `hb.makeNoiseOsc(startAt=hb.now())` - makes noise source (2s of generated white noise sample)
- `hb.generateWaveformBuffer(generator, params={}, len=/*one cycle of C3 note*/)` - generates `len` samples of audio buffer by calling `generator` function with `params`
- `hb.generators` - generators for `hb.generateWaveformBuffer` function - `sin`, `sqr`, `pulse({width:0.1})`, `saw`, `triangle`
- `hb.makeSamplerOsc(buffer, freq, baseFreq=C3 note, startAt=hb.now())` - makes tunable `AudioBufferSourceNode` which is (partially) pretending to be `OscillatorNode` with frequency `freq`, tuned to `baseFreq` 
- `hb.makeSamplerLoopOsc` - same `hb.makeSamplerOsc`, but with looping
- `hb.makeDrumOsc(buffer, startAt=hb.now())` - makes `AudioBufferSourceNode` which is not tunable
- `hb.makeConstantOsc(n)` - makes `ConstantSourceNode` with offset `n`
- `hb.makeGain(vol=0)` - makes `GainNode` with volume `vol` 
- `hb.makeFilter(type=lowpass, freq=0)` - makes `BiquadFilterNode` of `type` type and frequency `freq`
- `hb.makeAdder` - TBD
- `hb.makeMultiplier` - TBD
- `hb.chain(a, b [, c ...])` - connects `a` and `b` or more nodes, stops on first thing which is not `AudioNode`
- `hb.unchain(a, b [, c ...])` - disconnects `a` and `b` or more nodes, stops on first thing which is not `AudioNode`

### audioParam stuff

these functions are for realtime manipulation of `AudioParam` interface.

- `hb.moveTo(audioParam, target, time)` - moves `audioParam` in `time` time to `target` value
- `hb.setNow(audioParam, target)` - sets value of `audioParam` to `target` value
- `hb.adsrStart(audioParam, env)` - starts ADSR envelope `env` for `audioParam`
- `hb.adsrStart(audioParam, env)` - stops ADSR envelope `env` for `audioParam`

Default `env` definition is `{attack: 0.05, decay: 0.01, sustain: 0, release: 0.05, max: 1}`. You can supply only 
partial definition, but you need to supply at least empty object (`{}`).

### MIDI stuff

- `hb.midi2call(midi_data, synth, only_channel)` - translates `midi_data` to method calls on `synth` instance, if `only_channel` is set then it uses only this channel and ignore others.

Suported calls are:

- `synth.noteOn(note, velocity)`
- `synth.noteOff(note)`
- `synth.panic()`
- `synth.programChange(program)`
- `synth.pitchBend(bend)` - note that raw values are recalculated to scale -1 to +1
- `synth.CC(controller, value)` - control change
- `synth.start()` - starts playback
- `synth.stop()` - stops playback

### metronome

As `setTimeout` and `setInterval` notoriously bad at timing, there is metronome in this library. It can be used as base for your sequencers, arpegiators and stuff. It has following interface:

- `metronome = hb.makeMetronome(callback)` - creates metronome instance with `callback` to be called at each tick
- `metronome.setBpm(bpm, div=4)` - set tempo to `bpm` and `division` of whole note, default is 120 BPM (quarter notes)
- `metronome.setCps(cps)` - set tempo in cycles per second
- `metronome.start()` - starts metronome
- `metronome.stop()` - stops it

## components

these are complex components - synths, effect units and other devices.

Each component has `input` and/or/nor `output`, zero or more params and this interface:

- `var component = hb.ComponentName(out)`
- `compoment.param(name, val)`
- `component.noteOn(nn, vv)`
- `component.noteOff(nn)`
- `component.plan(at, nn, vv, dur)`
- `component.panic()`
- `component.input` and/or/nor `component.output`

### MixStrip

mixing board strip-like component - it has EQ, reverb, panning and volume.

Parameters are:

- `hi` - gain of high frequencies (above 12 kHz)
- `mid` - gain of mid frequencies (around 1000 Hz)
- `low` - gain of low frequencies (below 80 Hz)
- `pan` - panning (-1 hardleft, 0 center, +1 hardright)
- `reverb` - how much of sound will be send to reverb (0-1)
- `reverb_len` - length of reverb in seconds
- `vol` - volume (0-1) 

Gain is in dB (safe values are from -20 to +20). 

### TapeRecorder

simple component for recording and playing back WAV files. It has following API:

- `tape.record()` - starts recording
- `tape.stop()` - stops recording/playback
- `tape.play()` - plays back recorded audio
- `tape.loadLocalFile(file)` - loads local `file` for playback
- `tape.loadRemoteFile(url)` - loads remote file for playback
- `tape.downloadFile()` - download currently loaded file to user's browser
- `tape.makeFilename()` - used to generate filename used for recording

**Note** - this currently requires `wave-encoder-polyfill.js` as no browser currently implements WAV encoder (in `MediaRecorder`).

## cooperation with other libraries

- ub - I use custom library called uboot for DOM-related stuff. There is `ub.chnget` function provided which uses this to watch inputs and use these as params for synth components.
- JZZ.js, webmidi.js and WebMIDI - use `hb.midi2call` to translate to synth calls
- Tone.js, Pizziato.js and others  - as these libraries uses `audioNode` interface it's possible to connect these using `hb.chain`

## coming from CSound

TBD

