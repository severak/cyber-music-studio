# compiling instructions

`wave-encoder-polyfill.js` is just this code:

```
import MediaRecorder from "audio-recorder-polyfill";
window.WaveAudioRecorder = MediaRecorder;
```

compiled with `esbuild`.