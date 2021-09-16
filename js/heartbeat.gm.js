// Hearthbeat GM - an general MIDI (subset) synth for heartbeat.js

var hb = window.hb || console.log('does not work without heartbeat.js');

hb.gm = {};

hb.gm.presets = {



};

hb.gm.synth = function() {
    var me = {};

    // public params
    me.attack = 0.01;
    me.release = 0.5;
    me.eq_low = 0;
    me.eq_hi = 0;
    me.chorus = 0;
    me.reverb = 0;
    me.volume = 1;

    // patch (internal) params
    me.decay = 0.01;
    me.sustain = 0.8;




    me.once = false;
    me.buffer = hb.ac.createBuffer(1, hb.ac.sampleRate * 1, hb.ac.sampleRate);

    me._ac = hb.ac;

    me._mixer = hb.MixStrip();
    me.output = me._mixer.output;

    // me._notes = [];
    me._voices = {};

    me.param = function(name, val) {
        me[name] = val;
        // TODO - předávání do mixéru
    };

    me._getEnv = function(max) {
        // TODO - velocity
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
        vox._osc = hb.makeSamplerLoopOsc(me.buffer, freq);
        vox._env = hb.makeGain();

        vox._osc.connect(vox._env);
        hb.adsrStart(vox._env.gain, me._getEnv(1));

        vox._env.connect(me._mixer.input);

        vox.noteOff = function () {
            var env = me._getEnv(1);
            hb.adsrStop(vox._env.gain, env);
            vox._osc.stop(hb.ac.currentTime + env.release);
            // TODO - GC
        };

        return vox;
    };

    me.noteOn = function(nn) {
        console.log('on ' + nn);
        if (me._voices[nn]) return; // už je
        me._voices[nn] = me._makeVoice(nn);
    };

    me.noteOff = function(nn) {
        console.log('off ' + nn);
        if (!me._voices[nn]) return; // už není
        me._voices[nn].noteOff();
        delete me._voices[nn];
    };


    me.panic = function() {
        console.log('PANIC at the disco!');
        for (var nn in me._voices) {
            hb.setNow(me._voices[nn]._env.gain, 0);
            me._voices[nn]._osc.stop(hb.now());
            delete me._voices[nn];
        }
        // me._vol.gain.setValueAtTime(0, me._ac.currentTime);
    };

    // TODO - init
    me.buffer = hb.generateWaveformBuffer(hb.generators.saw);

    return me;
};
