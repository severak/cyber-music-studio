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

// ADSR
 
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
	if (curr==0 || env.sustain==0) return; // not moving ENV
	audioParam.cancelScheduledValues(hb.ac.currentTime);
	audioParam.setValueAtTime(curr, hb.ac.currentTime); // stop ENV at current point
	audioParam.linearRampToValueAtTime(0, hb.ac.currentTime + env.release); // move to 0
};

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

hb.makeGain = function(vol) {
    if (!vol) vol = 0;
	var gainNode = hb.ac.createGain();
	gainNode.gain.setValueAtTime(vol, hb.ac.currentTime);
	return gainNode;
};

hb.makeFilter = function(type) {
    if (!type) type = 'lowpass';
    var filter = hb.ac.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(0, hb.ac.currentTime);
    return filter;
};

var makeConstant = function(n) {
	var constant = hb.ac.createConstantSource();
	constant.offset.value = n;
	return constant;
};

hb.makeAdder = function(a, b) {
	var adder = hb.makeGain(1);
	for (var i = 0; i < arguments.length; i++) {
		var node = arguments[i];
		if (!isNaN(node)) node = makeConstant(node);
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

hb.makeChain = function(a) {
	var prevNode = false;
	for (var i = 0; i < arguments.length; i++) {
		var currNode = arguments[i];
		if (prevNode && prevNode.connect) {
			prevNode.connect(currNode);
		}
		prevNode = currNode;
	}
};

// TODO implement these components
// - mixbus
// - tape - https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamAudioDestinationNode

// Traveller
// simple monophonic synth:
// OSC -> VCF -> VCA
hb.Traveller = function(out) {
	var me = {};
	me.vol = 0.25;
	me.wave = 'sawtooth';
	me.attack = 0.2;
	me.decay = 0.5;
	me.hold = true;
	me.bite = false;
	me.quack = false;
	me.traveller = 22000;
	me.lfo = 'sawtooth';
	me.rate = 5;
	me.amp = 0;
	me.detune = 0;
	
	me._ac = hb.ac;
	if (!out) out = hb.ac;
	me._out = out;

	me._osc = hb.makeOsc(me.wave, 440);
	me._vcf = hb.makeFilter('lowpass');
	me._vca = hb.makeGain();
	me._vol = hb.makeGain(me.vol);

	me._lfo = hb.makeOsc(me.lfo, me.rate); // {-1, 1}
    me._lfoAmp = hb.makeGain(me.amp);
    me._lfoDetune = hb.makeGain(me.detune);

    var normLFO = hb.makeAdder(hb.makeMultiplier(me._lfo, 0.5), 0.5);
    hb.makeChain(normLFO, me._lfoAmp);
    var modF = hb.makeAdder(1, hb.makeMultiplier(me._lfoAmp, -1));
    var modulator = hb.makeGain(1);
    modF.connect(modulator.gain);

    var toCents = hb.makeGain(100);
    hb.makeChain(me._lfo, me._lfoDetune, toCents, me._osc.detune); // detune LFO

    hb.makeChain(me._osc, me._vcf, modulator, me._vca, me._vol, me._out.destination);
	
	me.param = function(name, val) {
		me[name] = val;
		
		if (!me.quack && name=='traveller') {
			me._vcf.frequency.setValueAtTime(me.traveller, me._ac.currentTime)
		}
		
		if (name=='vol') {
			me._vol.gain.setValueAtTime(me.vol, me._ac.currentTime)
		}

        if (name=='rate') {
            me._lfo.frequency.setValueAtTime(me.rate, me._ac.currentTime)
        }

        if (name=='amp') {
            me._lfoAmp.gain.setValueAtTime(me.amp, me._ac.currentTime)
        }

		if (name=='detune') {
			me._lfoDetune.gain.setValueAtTime(me.detune, me._ac.currentTime)
		}

        if (name=='lfo') {
            me._lfo.type = me.lfo;
        }
	};
	
	me._getEnv = function(max) {
        var env = {};
        env.max = max;
        env.attack = me.attack;
        if (me.hold) {
            env.sustain = env.max;
            env.decay = 0.01;
            env.release = me.decay;
        } else {
            env.sustain = 0;
            env.decay = me.decay;
            env.release = 0;
        }
        return env;
    };
	
	me.noteOn = function(nn) {
		me.lastN = nn;
		var freq = hb.midi2cps(nn);
		
		// switch OSC
		me._osc.type = me.wave;
		me._osc.frequency.setValueAtTime(freq, me._ac.currentTime + (me.attack / 2)); // TODO - portamento
		hb.adsrStart(me._vca.gain, me._getEnv(1)); // VCA ENV
		me._vcf.Q.value = me.bite ? 10 : 1;
		if (me.quack) { // VCF ENV:
			hb.adsrStart(me._vcf.frequency, me._getEnv(me.traveller));
		} else {
			me._vcf.frequency.setValueAtTime(me.traveller, me._ac.currentTime)
		}
	};
	
	me.noteOff = function(nn) {
		if (!me.hold) return;
		if (nn!=me.lastN) return;
		hb.adsrStop(me._vca.gain, me._getEnv(1));
		if (me.quack) {
			hb.adsrStop(me._vcf.frequency, me._getEnv(me.traveller));
		} else {
			me._vcf.frequency.setValueAtTime(me.traveller, me._ac.currentTime)
		}
	};
	
	me.panic = function() {
		me._vca.gain.setValueAtTime(0, me._ac.currentTime);
	};
	
	return me;
};

hb.AnalogNomad = function(out) {
	var me = {};
	me.vol = 0.25;
	
	me.attack = 0.1;
	me.decay = 0.1;
	me.sustain = 0.8;
	me.release = 0.5;
	
	me.saw = 0.3;
	me.pulse = 0.2;
	me.sub = 0.1;
	me.noise = 0.1;
	
	// TODO - implement pulse width of PWM OSC
	
	me.filter = 22000;
	me.resonance = 5;
	me.quack = true;
	
	me._ac = hb.ac;
	if (!out) out = hb.ac;
	me._out = out;
	
	me._vol = hb.makeGain(me.vol)
	me._vol.connect(me._out.destination);	
	
	// me._notes = [];
	me._voices = {};
	
	me.param = function(name, val) {
		me[name] = val;
		if (name=='vol') me._vol.gain.setValueAtTime(me.vol, me._ac.currentTime);
	};
	
	me._getEnv = function(max) {
		return {
			max: max,
			attack: me.attack,
			decay: me.decay,
			sustain: me.sustain,
			release: me.release
		};
	};

    me._getFEnv = function() {
        return {
            max: 22000,
            attack: me.attack,
            decay: me.decay,
            sustain: me.filter * me.sustain,
            release: me.release
        };
    };


    me._makeVoice = function(nn) {
		var freq = hb.midi2cps(nn);
		var vox = {};

		vox._saw = hb.makeOsc('sawtooth', freq);
		vox._pulse = hb.makeOsc('square', freq);
		vox._sub = hb.makeOsc('square', freq/2);
		vox._noise = hb.makeNoiseOsc();

		vox._saw_gain = hb.makeGain(me.saw);
		vox._pulse_gain = hb.makeGain(me.pulse);
		vox._sub_gain = hb.makeGain(me.sub);
		vox._noise_gain = hb.makeGain(me.noise);

		vox._env = hb.makeGain();

		vox._saw.connect(vox._saw_gain);
		vox._pulse.connect(vox._pulse_gain);
		vox._sub.connect(vox._sub_gain);
		vox._noise.connect(vox._noise_gain);
		vox._saw_gain.connect(vox._env);
		vox._pulse_gain.connect(vox._env);
		vox._sub_gain.connect(vox._env);
		vox._noise_gain.connect(vox._env);

        vox._filter = hb.makeFilter('lowpass');
        vox._filter.Q.setValueAtTime(me.resonance, hb.ac.currentTime);
        vox._env.connect(vox._filter);

		hb.adsrStart(vox._env.gain, me._getEnv(1));
		if (me.quack) {
            vox._filter.frequency.setValueAtTime(0, hb.ac.currentTime);
		    hb.adsrStart(vox._filter.frequency, me._getFEnv());
        } else {
            vox._filter.frequency.setValueAtTime(me.filter, hb.ac.currentTime);
        }

		vox._filter.connect(me._vol);


		vox.noteOff = function () {
			var env = me._getEnv(1);
			hb.adsrStop(vox._env.gain, env);
            if (me.quack) {
                hb.adsrStop(vox._filter.frequency, me._getFEnv());
            }
			vox._saw.stop(hb.ac.currentTime + env.release);
			vox._pulse.stop(hb.ac.currentTime + env.release);
			vox._sub.stop(hb.ac.currentTime + env.release);
		};

		return vox;
	};
	
	me.noteOn = function(nn) {
		me._voices[nn] = me._makeVoice(nn);
	};
	
	me.noteOff = function(nn) {
		if (!me._voices[nn]) return; // už není
		me._voices[nn].noteOff();
		delete me._voices[nn];
	};
	
	me.panic = function() {
		
		me._vol.gain.setValueAtTime(0, me._ac.currentTime);
	};
	
	return me;	
};

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
			synth.param(elem, ub.tonumber(ub.gebi(elem).value));
			if (ub.gebi(elem).getAttribute("type")=="range") {
				// slider is adjustable in real time
				ub.on(elem, 'input', function(){
					synth.param(param, ub.tonumber(ub.gebi(elem).value));
				});
			}
		}
	}
}



