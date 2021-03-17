!function(t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t:"function"==typeof define&&define.amd?define("JZZ.synth.OSC",["JZZ"],t):t(JZZ)}(function(s){var i,n,e,h,o;function a(){this.ac=n,this.dest=this.ac.destination,this.channels=[],this.channel=function(t){return this.channels[t]||(this.channels[t]=new c(this),9==t&&(this.channels[t].note=function(t){return this.notes[t]||(this.notes[t]=new r(t,this)),this.notes[t]})),this.channels[t]},this.play=function(t){var s,i,n=t[0],e=t[1],h=t[2];n<0||255<n||(s=15&n,9==(i=n>>4)?this.channel(s).play(e,h):8==i?this.channel(s).play(e,0):11==i&&(120==e||123==e?this.channel(s).allSoundOff():64==e&&this.channel(s).damper(!!h)))},this.plug=function(t){try{this.ac=void 0,(t.context instanceof AudioContext||t.context instanceof webkitAudioContext)&&(this.ac=t.context,this.dest=t)}catch(t){this.ac=void 0}this.ac||(this.ac=n,this.dest=this.ac.destination)}}function c(t){this.synth=t,this.notes=[],this.sustain=!1,this.note=function(t){return this.notes[t]||(this.notes[t]=new l(t,this)),this.notes[t]},this.play=function(t,s){this.note(t).play(s)},this.allSoundOff=function(){for(var t=0;t<this.notes.length;t++)this.notes[t]&&this.notes[t].stop()},this.damper=function(t){if(!t&&this.sustain!=t)for(var s=0;s<this.notes.length;s++)this.notes[s]&&this.notes[s].sustain&&this.notes[s].stop();this.sustain=t}}function l(t,s){this.note=t,this.channel=s,this.freq=440*Math.pow(2,(t-69)/12),this.stop=function(){try{this.oscillator&&this.oscillator.stop(0),this.oscillator=void 0,this.sustain=!1}catch(t){}},this.play=function(t){var s,i;!t&&this.channel.sustain||this.stop(),t?(s=t/127,this.oscillator=this.channel.synth.ac.createOscillator(),this.oscillator.type="sawtooth",this.oscillator.frequency.setTargetAtTime(this.freq,this.channel.synth.ac.currentTime,.005),this.oscillator.start||(this.oscillator.start=this.oscillator.noteOn),this.oscillator.stop||(this.oscillator.stop=this.oscillator.noteOff),this.gain=this.channel.synth.ac.createGain(),i=this.channel.synth.ac.currentTime,this.gain.gain.setValueAtTime(s,i),this.gain.gain.exponentialRampToValueAtTime(.01*s,i+2),this.oscillator.connect(this.gain),this.gain.connect(this.channel.synth.dest),this.oscillator.start(0)):this.sustain=this.channel.sustain}}function r(t,s){this.note=t,this.channel=s,this.freq=200,this.stop=function(){},this.play=function(t){var s,i;t&&(s=t/127,this.oscillator=this.channel.synth.ac.createOscillator(),this.oscillator.type="sine",this.oscillator.frequency.setTargetAtTime(this.freq,this.channel.synth.ac.currentTime,.005),this.oscillator.start||(this.oscillator.start=this.oscillator.noteOn),this.oscillator.stop||(this.oscillator.stop=this.oscillator.noteOff),this.gain=this.channel.synth.ac.createGain(),i=this.channel.synth.ac.currentTime,this.gain.gain.setValueAtTime(s,i),this.oscillator.connect(this.gain),this.gain.connect(this.channel.synth.dest),this.oscillator.start(0),this.oscillator.stop(this.channel.synth.ac.currentTime+.04))}}s&&(s.synth||(s.synth={}),s.synth.OSC||(i="1.1.7",n=s.lib.getAudioContext(),e={},h=[],o={_info:function(t){return{type:"Web Audo",name:t=t||"JZZ.synth.OSC",manufacturer:"virtual",version:i}},_openOut:function(t,s){var i;n?(void 0!==s?(e[s=""+s]||(e[s]=new a),i=e[s]):(i=new a,h.push(i)),t.plug=function(t){i.plug(t)},t._info=o._info(s),t._receive=function(t){i.play(t)},t._resume()):t._crash("AudioContext not supported")}},s.synth.OSC=function(t){return s.lib.openMidiOut(t,o)},s.synth.OSC.register=function(t){return!!n&&s.lib.registerMidiOut(t,o)},s.synth.OSC.version=function(){return i}))});