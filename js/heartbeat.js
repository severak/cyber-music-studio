// hearthbeat.js - simple WebAudio library
// (c) Severák 2021
 
// My heart starts missing a beat
// Every time... 
 
var hb = {};

// audio context

var AudioContext = window.AudioContext || window.webkitAudioContext;
hb.ac= new AudioContext();

// common functions
 
 hb.clamp = function(min, v, max) {
	if (v < min) return min;
	if (v > max) return max;
	return v;
}

hb.midi2cps = function(midi, A4) {
	A4 = A4 || 440;
	return A4 * Math.pow(2, (midi - 69) / 12);
}

hb.cps2midi = function(cps, A4)
{
	A4 = A4 || 440;
	return 69 + 12 * Math.log2(cps / A4);
}

// ADSR
 
hb.adsr_start = function(audioParam, env)
{
	env.max = env.max || 1;
	env.attack = env.attack || 0.05;
	env.decay = env.decay || 0.01;
	env.sustain = env.sustain || 0;
	var curr = audioParam.value;
	audioParam.cancelScheduledValues(hb.ac.currentTime);
	audioParam.setValueAtTime(curr, hb.ac.currentTime); // stop ENV at current point
	audioParam.linearRampToValueAtTime(env.max, hb.ac.currentTime + env.attack); // move to max
	audioParam.linearRampToValueAtTime(env.sustain, hb.ac.currentTime + env.attack + env.decay); // move to sustain level
}

hb.adsr_stop = function(audioParam, env)
{
	env.max = env.max || 1;
	env.sustain = env.sustain || 0;
	env.release = env.release || 0.05;
	var curr = audioParam.value;
	if (curr==0 || env.sustain==0) return; // not moving ENV
	audioParam.cancelScheduledValues(hb.ac.currentTime);
	audioParam.setValueAtTime(curr, hb.ac.currentTime); // stop ENV at current point
	audioParam.linearRampToValueAtTime(0, hb.ac.currentTime + env.release); // move to 0
}

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
	
	me._osc = me._ac.createOscillator();
	me._osc.type = me.wave;
	me._osc.frequency.setValueAtTime(440, me._ac.currentTime);
	me._osc.start();
	
	me._vcf = me._ac.createBiquadFilter();
	me._vcf.type = 'lowpass';
	
	me._vca = me._ac.createGain();
	me._vca.gain.setValueAtTime(0, me._ac.currentTime);
	
	me._osc.connect(me._vcf);
	me._vcf.connect(me._vca);
	me._vca.connect(me._out.destination);
	
	me.param = function(name, val) {
		me[name] = val;
		
		if (!me.quack && name=='traveller') {
			me._vcf.frequency.setValueAtTime(me.traveller, me._ac.currentTime)
		}
		
		// TODO - filtr chceme měnit za jízdy vol
	}
	
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
	}
	
	me.noteOn = function(nn) {
		me.lastN = nn;
		var freq = hb.midi2cps(nn);
		
		// switch OSC
		me._osc.type = me.wave;
		me._osc.frequency.setValueAtTime(freq, me._ac.currentTime + (me.attack / 2)); // TODO - portamento
		hb.adsr_start(me._vca.gain, me._getEnv(me.vol)); // VCA ENV
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
		hb.adsr_stop(me._vca.gain, me._getEnv(me.vol));
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
}

window.hb = hb;

// bonus - hb.chnget

if (window.ub && ub.on) {
	hb.chnget= function(synth, param) {
		// TODO - výchozí hodnoty
		if (ub.gebi(param).tagName=="SELECT") {
			// select -> string
			ub.on(param, 'change', function(){
				synth.param(param, ub.gebi(param).value);
			});
			synth.param(param, ub.gebi(param).value);
		} else if (ub.gebi(param).getAttribute("type")=="checkbox") {
			// checkbox -> bool
			ub.on(param, 'change', function(){
				synth.param(param, ub.gebi(param).checked);
			});
			synth.param(param, ub.gebi(param).checked);
		} else {
			// numeric
			ub.on(param, 'change', function(){
				synth.param(param, ub.tonumber(ub.gebi(param).value));
			});
			synth.param(param, ub.tonumber(ub.gebi(param).value));
			if (ub.gebi(param).getAttribute("type")=="range") {
				// slider is adjustable in real time
				ub.on(param, 'input', function(){
					synth.param(param, ub.tonumber(ub.gebi(param).value));
				});
			}
		}
	}
}



