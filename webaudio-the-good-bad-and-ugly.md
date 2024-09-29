# WebAudio - the good, the bad and the ugly

***WIP - article not finished yet.***

I came across this article asking [for who WebAudio API is designed for](https://blog.mecheye.net/2017/09/i-dont-know-who-the-web-audio-api-is-designed-for/)? Author of this article came to the conclusion that it was designed with beginners in mind.

Back then in 2020 when I started working on this project ([Cyber Music Studio](https://severak.github.io/cyber-music-studio/)) I was beginner and in some extent I am still new to DSP math and other fundamental stuff. But now I have a lot of experience with some traps and pitfalls of WebAudio API!

This is my introduction 

## The good

The good thing is that there is even some thing called WebAudio. 

The fact that I can write [basic synth](https://severak.github.io/cyber-music-studio/minimal-webaudio-synth.html) in about [200 lines of code](https://github.com/severak/cyber-music-studio/blob/main/minimal-webaudio-synth.html) (including UI and everything) and it works out-of-the-box on multiple platforms without any plugins is great. 

You don't need to study any DSP magic and all the building blocks are right now in your browser! In fact - it's short of the miracle!

## The bad

But the implementation details are... Well... 

How to say it politely? Interesting...

Say for example you want to implement basic synth as I did before. You discover some ancient example but it does not make any sound in 2024 anymore. 

(https://noisehack.com/how-to-build-monotron-synth-web-audio-api/)

Why? Well, that's [because now](http://www.holovaty.com/writing/chrome-web-audio-change/) you need to create `AudioContext` only after user clicked on something because otherwise scam ad banners would go full air raid siren on you! 

OK. That makes sense, so all you code has now `let ac = new AudioContext()` on the beginning and you now need to carry that `AudioContext` everywhere because (I guess) it's possible you have two of these on one page somehow.

*API is somewhat talkative but browser APIs tend to be in this way...*

*Osc? OK! Filter? IIRFilterNode? WTF? Biquad then OK... Gain OK.*

(https://developer.mozilla.org/en-US/docs/Web/API/IIRFilterNode/IIRFilterNode)

Example - https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Simple_synth - there is the reason for square. Switch to sine and you hear clicks.

*Clicks -> rant about AudioParam madness...*

*There is no (built-in) ADSRNode.*

## The really, really awful parts

*Rant about buggy filter in Chrome 109 and debugging what's bad.*

## The ugly

*No noise source...*

*Rant about createScriptProcessor being deprecated and what mess AudioWorklet is...*

## What can be better?

- built-in ADSR node with robust polyfill
- setNow and moveTo for simpler cases
- metronome or other high level timer or audio-grade setTimeout - https://web.dev/articles/audio-scheduling
- noise source
- built-in reverb
- simpler worklet (https://github.com/acarabott/audio-dsp-playground/blob/master/livecode.js#L120)
- midi2cps, db2amp, amp2db, equal crossfade
- pwm (insert Nick Batt joke...) https://github.com/pendragon-andyh/WebAudio-PulseOscillator



---

https://robert.ocallahan.org/2017/09/some-opinions-on-history-of-web-audio.html
https://acarabott.github.io/audio-dsp-playground/
https://github.com/Tonejs/Tone.js/blob/cf73c22874ddbaf361ca62a8caf0edea155ef50a/Tone/component/envelope/Envelope.ts#L55
https://github.com/zacharydenton/noise.js
