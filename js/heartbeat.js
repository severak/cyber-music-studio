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
 
hb.adsr_start = function(audioParam, env) {
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

hb.adsr_stop = function(audioParam, env) {
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
	osc.loop = true;
	osc.playbackRate.setValueAtTime(freq / baseFreq, startAt);
	osc.start(startAt);

	osc.frequency = {
		setValueAtTime : function(freq, at) {
			osc.playbackRate.setValueAtTime(freq / baseFreq, at);
		}
	};

	return osc;
};

hb.makeDrumOsc = function(buffer, startAt) {
	// TODO - implement
};

// TODO - hb.makePwmOsc

hb.makeGain = function() {
	var gain = hb.ac.createGain();
	gain.gain.setValueAtTime(0, hb.ac.currentTime);
	return gain;
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
	
	me._ac = hb.ac;
	if (!out) out = hb.ac;
	me._out = out;

	me._osc = hb.makeOsc(me.wave, 440);
	
	me._vcf = me._ac.createBiquadFilter();
	me._vcf.type = 'lowpass';
	
	me._vca = me._ac.createGain();
	me._vca.gain.setValueAtTime(0, me._ac.currentTime);
	
	me._vol = me._ac.createGain();
	me._vol.gain.setValueAtTime(me.vol, me._ac.currentTime);
	
	
	me._osc.connect(me._vcf);
	me._vcf.connect(me._vca);
	me._vca.connect(me._vol);
	me._vol.connect(me._out.destination);	
	
	me.param = function(name, val) {
		me[name] = val;
		
		if (!me.quack && name=='traveller') {
			me._vcf.frequency.setValueAtTime(me.traveller, me._ac.currentTime)
		}
		
		if (name=='vol') {
			me._vol.gain.setValueAtTime(me.vol, me._ac.currentTime)
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
		hb.adsr_start(me._vca.gain, me._getEnv(1)); // VCA ENV
		me._vcf.Q.value = me.bite ? 10 : 1;
		if (me.quack) { // VCF ENV:
			hb.adsr_start(me._vcf.frequency, me._getEnv(me.traveller));
		} else {
			me._vcf.frequency.setValueAtTime(me.traveller, me._ac.currentTime)
		}
	};
	
	me.noteOff = function(nn) {
		if (!me.hold) return;
		if (nn!=me.lastN) return;
		hb.adsr_stop(me._vca.gain, me._getEnv(1));
		if (me.quack) {
			hb.adsr_stop(me._vcf.frequency, me._getEnv(me.traveller));
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
	
	// pulse width - https://github.com/pendragon-andyh/WebAudio-PulseOscillator
	
	me.filter = 22000;
	me.resonance = 5;
	me.quack = true;
	
	me._ac = hb.ac;
	if (!out) out = hb.ac;
	me._out = out;
	
	me._vol = me._ac.createGain();
	me._vol.gain.setValueAtTime(me.vol, me._ac.currentTime);
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
	
	me._makeVoice = function(nn) {
		var ac = hb.ac;
		var freq = hb.midi2cps(nn);
		var vox = {};
		vox._saw = ac.createOscillator();
		vox._saw.type = 'sawtooth';
		vox._saw.frequency.setValueAtTime(freq, ac.currentTime);
		vox._saw.start();

		vox._saw = hb.makeOsc('saw', freq);
		vox._pulse = hb.makeOsc('square', freq);
		vox._sub = hb.makeOsc('square', freq);

		// TODO - zkrátit vytváření a spouštění oscilátorů
		// TODO - přidat noise

		vox._saw_gain = ac.createGain();
		vox._saw_gain.gain.setValueAtTime(me.saw, ac.currentTime);
		vox._pulse_gain = ac.createGain();
		vox._pulse_gain.gain.setValueAtTime(me.pulse, ac.currentTime);
		vox._sub_gain = ac.createGain();
		vox._sub_gain.gain.setValueAtTime(me.sub, ac.currentTime);

		vox._env = ac.createGain();

		// TODO - filtr

		vox._saw.connect(vox._saw_gain);
		vox._pulse.connect(vox._pulse_gain);
		vox._sub.connect(vox._sub_gain);
		vox._saw_gain.connect(vox._env);
		vox._pulse_gain.connect(vox._env);
		vox._sub_gain.connect(vox._env);

		hb.adsr_start(vox._env.gain, me._getEnv(0.5));

		vox._env.connect(me._vol);

		vox.noteOff = function () {
			var env = me._getEnv(1);
			hb.adsr_stop(vox._env.gain, env);
			vox._saw.stop(hb.ac.currentTime + env.release);
			vox._pulse.stop(hb.ac.currentTime + env.release);
			vox._sub.stop(hb.ac.currentTime + env.release);

			// TODO - GC
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



