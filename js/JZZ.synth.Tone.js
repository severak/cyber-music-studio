// WIP - wraps Tone.js for use with JZZ.js
(function(global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory;
  }
  else if (typeof define === 'function' && define.amd) {
    define('JZZ.synth.Tone', ['JZZ'], factory);
  }
  else {
    factory(JZZ);
  }
})(this, function(JZZ) {

  if (!JZZ) return;
  if (!JZZ.synth) JZZ.synth = {};
  if (JZZ.synth.Tone) return;

  var _version = '1.0';
  var _engine = {};
  
    _engine._info = function(name) {
    if (!name) name = 'JZZ.synth.Tiny';
    return {
      type: 'Web Audio',
      name: name,
      manufacturer: 'virtual',
      version: _version
    };
  };

  _engine._openOut = function(port, name, conf) {
    if (!window.Tone) { port._crash('Tone.js not loaded'); return; }
    
    port.debug = false;
    port._synth = false;
    port._poly = false;
    
    port._info = _engine._info(name);
    
    port._receive = function(arr) {
        if (!port._synth) port._crash("You have to port.setSynth before use!");
        if (port.debug) console.log("Tone.js MIDI IN: ", arr);
      
        var relTime = port._synth.release || port._synth.options.release || port._synth.options.envelope.release;
        var sustain = false; //port._synth.options.envelope.sustain || false;
        // var attTime = port._synth.options.envelope.attack;
        // if (port.debug) console.log("att time", attTime);
        if (port.debug) console.log("rel time", relTime);
        if (port.debug) console.log("sustain", sustain);
      
        var b = arr[0];
        var n = arr[1];
        var v = arr[2];
        if (b < 0 || b > 255) return;
        var c = b & 15;
        var s = b >> 4;
        if (s == 9) {
          // note on (n,v)
          if (!port._poly) port._synth.triggerRelease(0.05); // triggering off previous note
          if (port.debug) console.log("trig", Tone.Midi(n).toFrequency(), 0.1, 0.8 /* v/127 */ );
          // TODO - this works great
          // triggerAttack has some issues
          port._synth.triggerAttack (Tone.Midi(n).toFrequency(), "+0");
        } else if (s == 8) {
          // note off (n,v)
          
          if (port._poly) {
            if (port.debug) console.log("Tone.js MIDI off ", n);
            port._synth.triggerRelease(Tone.Midi(n).toFrequency(), "+"+relTime);
          } else {
            if (port.debug) console.log("Tone.js MIDI off (mono)");
            port._synth.triggerRelease("+"+relTime);
          }
        } else if (s == 0xb) {
          if (n == 0x78 || n == 0x7b) {
              // PANIC
              port._synth.volume.value = Tone.gainToDb(0);
          } else if (n == 0x40) {
              // damper?
          }
        }
    };
    
    port._resume();
    
    port.setSynth = function(synth) {
      port._synth = synth;
      port._poly = (synth.name == "PolySynth") || (synth.name == "Sampler");
    };
  };

  JZZ.synth.Tone = function(name) {
    return JZZ.lib.openMidiOut(name, _engine);
  };

  JZZ.synth.Tone.register = function(name) {
    return JZZ.lib.registerMidiOut(name, _engine);
  };

  JZZ.synth.Tone.version = function() { return _version; };
});