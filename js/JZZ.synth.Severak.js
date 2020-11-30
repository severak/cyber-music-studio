// WIP - wraps Severak synth interface™ for use with JZZ
(function(global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory;
  }
  else if (typeof define === 'function' && define.amd) {
    define('JZZ.synth.Severak', ['JZZ'], factory);
  }
  else {
    factory(JZZ);
  }
})(this, function(JZZ) {

  if (!JZZ) return;
  if (!JZZ.synth) JZZ.synth = {};
  if (JZZ.synth.Severak) return;

  var _version = '1.0';
  var _engine = {};
  
    _engine._info = function(name) {
    if (!name) name = 'JZZ.synth.Severak';
    return {
      type: 'Web Audio',
      name: name,
      manufacturer: 'Severak',
      version: _version
    };
  };

  _engine._openOut = function(port, name, conf) {
    
    port._synth = false;
    
    port._info = _engine._info(name);
    
    port._receive = function(arr) {
        if (!port._synth) {
          port._crash("Please setSynth before using this interface.");
        }
        var b = arr[0];
        var n = arr[1];
        var v = arr[2];
        if (b < 0 || b > 255) return;
        var c = b & 15;
        var s = b >> 4;
        if (s == 9) {
          port._synth.noteOn(n, v);
        } else if (s == 8) {
          port._synth.noteOff(n, v);
        } else if (s == 0xb) {
          if (n == 0x78 || n == 0x7b) {
              port._synth.panic();
          } else if (n == 0x40) {
              // damper?
          }
        }
    };
    
    port._resume();
    
    port.setSynth = function(synth) {
      port._synth = synth;
    };
  };

  JZZ.synth.Severak = function(name) {
    return JZZ.lib.openMidiOut(name, _engine);
  };

  JZZ.synth.Severak.register = function(name) {
    return JZZ.lib.registerMidiOut(name, _engine);
  };

  JZZ.synth.Severak.version = function() { return _version; };
});