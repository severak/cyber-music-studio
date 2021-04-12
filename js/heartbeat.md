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

## components

these are complex components - synths, effect units and other devices.

- `var component = hb.ComponentName(out)`
- `compoment.param(name, val)`
- `component.noteOn(nn, vv)`
- `component.noteOff(nn)`
- `component.plan(at, nn, vv, dur)`
- `component.panic()`
- `component.input` and/or/nor `component.output`

### MixStrip

TBD

### TapeRecorder

TBD

### Traveller

TBD

#### AnalogNomad

TBD

## cooperation with other libraries

- ub - TBD
- JZZ - TBD
- Tone.js, Pizziato.js and etc  - TBD

## coming from CSound

TBD

