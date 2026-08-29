// audio.js — Síntesis de audio con Web Audio API (0 samples externos)
let ctx = null;
let masterGain = null;
let compressor = null;
let noiseBuffer = null;
let currentTrack = null;
let musicTimer = null;
let soundOn = true;
let musicOn = false;
let gameTrack = 'track1';
let currentContext = 'menu';

export function initAudio() {
  if (ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, ctx.currentTime);
    compressor.knee.setValueAtTime(30, ctx.currentTime);
    compressor.ratio.setValueAtTime(12, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);
    compressor.connect(ctx.destination);
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.55;
    masterGain.connect(compressor);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  } catch { ctx = null; }
}

export function setSound(on) {
  soundOn = on;
  if (masterGain && !on && !musicOn) masterGain.gain.value = 0;
  else if (masterGain && on) masterGain.gain.value = 0.55;
}

export function setMusic(on) {
  musicOn = on;
  if (on) startMusic(currentContext === 'game' ? gameTrack : 'menu');
  else stopMusic();
}

function ensureCtx() {
  if (!ctx) initAudio();
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function filterSweep(type, freqStart, freqEnd, t, dur, dest) {
  if (!ctx) return null;
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.frequency.setValueAtTime(freqStart, t);
  filt.frequency.linearRampToValueAtTime(freqEnd, t + dur);
  filt.Q.value = 1.5;
  filt.connect(dest);
  return filt;
}

function noiseBurst(dur, gain, t, filterType, freqStart, freqEnd, pan = 0, dest) {
  if (!ctx || !noiseBuffer) return null;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const filt = ctx.createBiquadFilter();
  filt.type = filterType || 'lowpass';
  filt.frequency.setValueAtTime(freqStart || 1000, t);
  if (freqEnd) filt.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  filt.Q.value = 2.5;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const panner = ctx.createStereoPanner();
  panner.pan.value = pan;
  src.connect(filt); filt.connect(g); g.connect(panner); panner.connect(dest || masterGain);
  src.start(t); src.stop(t + dur);
  return { src, filt, g, panner };
}

function noteV2(freq, time, dur, type, gain, opts = {}) {
  if (!ctx) return;
  const dest = opts.dest || masterGain;
  const filt = ctx.createBiquadFilter();
  filt.type = opts.filterType || 'lowpass';
  filt.frequency.setValueAtTime(opts.filterFreq || 8000, time);
  filt.Q.value = opts.filterQ || 0.5;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(gain, time + (opts.attack || 0.004));
  g.gain.setValueAtTime(gain, time + (opts.attack || 0.004) + (opts.hold || dur * 0.55));
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  const pan = ctx.createStereoPanner();
  pan.pan.value = opts.pan !== undefined ? opts.pan : (Math.random() * 0.6 - 0.3);
  const osc = ctx.createOscillator();
  osc.type = type; osc.frequency.value = freq;
  if (opts.detune) osc.detune.value = opts.detune;
  osc.connect(filt); filt.connect(g); g.connect(pan); pan.connect(dest);
  osc.start(time); osc.stop(time + dur);
}

const NOTES = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98, A2: 110, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196, A3: 220, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77,
  C6: 1046.5, D6: 1174.66, E6: 1318.5, F6: 1396.9, G6: 1568, A6: 1760, B6: 1975.5,
  C7: 2093, D7: 2349.3, E7: 2637,
};

export function sfx(name, speed = 1) {
  if (!soundOn) return;
  const c = ensureCtx(); if (!c) return;
  const t = c.currentTime; const s = Math.max(0.65, Math.min(1.5, speed));
  switch (name) {
    case 'click': noiseBurst(.04,.18,t,'highpass',3000,8000,0,masterGain); noteV2(900*s,t,.03,'square',.06,{attack:.001,hold:.01,filterType:'highpass',filterFreq:2000}); break;
    case 'flip': noiseBurst(.07,.1,t,'bandpass',800,2000,0,masterGain); noteV2(350,t,.08,'triangle',.12,{pan:-.3,attack:.002,hold:.03,filterType:'lowpass',filterFreq:1200}); noteV2(650,t+.04,.1,'triangle',.1,{pan:.3,attack:.002,hold:.04,filterType:'lowpass',filterFreq:1800}); break;
    case 'reveal1': noteV2(NOTES.C5,t,.18,'sine',.14,{attack:.01,hold:.08,pan:0}); noteV2(NOTES.C6,t+.02,.12,'sine',.06,{attack:.01,hold:.05,pan:.2}); break;
    case 'reveal2': noteV2(NOTES.E5,t,.16,'triangle',.16,{attack:.003,hold:.07,pan:-.25}); noteV2(NOTES.G5,t+.03,.15,'triangle',.12,{attack:.003,hold:.06,pan:.25}); noteV2(NOTES.C6,t+.06,.14,'sine',.09,{attack:.004,hold:.05,pan:0,detune:7}); noiseBurst(.06,.07,t,'highpass',4000,8000,0,masterGain); break;
    case 'reveal3': noteV2(NOTES.C5,t,.14,'sawtooth',.14,{attack:.002,hold:.05,pan:-.3,filterType:'lowpass',filterFreq:3000}); noteV2(NOTES.E5,t+.03,.13,'sawtooth',.13,{attack:.002,hold:.05,pan:.2,filterType:'lowpass',filterFreq:3500}); noteV2(NOTES.G5,t+.06,.15,'sawtooth',.14,{attack:.002,hold:.06,pan:.3,filterType:'lowpass',filterFreq:4000}); noteV2(NOTES.C6,t+.09,.14,'square',.1,{attack:.003,hold:.05,pan:-.1,detune:12}); noiseBurst(.09,.1,t,'lowpass',400,150,0,masterGain); noiseBurst(.06,.06,t+.02,'highpass',5000,10000,.3,masterGain); break;
    case 'bomb': noteV2(55,t,.55,'sawtooth',.25,{attack:.002,hold:.22,pan:0}); noteV2(110,t,.5,'sawtooth',.18,{attack:.003,hold:.18,pan:-.3}); noiseBurst(.45,.3,t,'bandpass',3000,8000,0,masterGain); noiseBurst(.35,.2,t+.04,'highpass',5000,12000,.2,masterGain); noiseBurst(.25,.12,t+.08,'highpass',8000,16000,-.2,masterGain); const sweepFilt=filterSweep('lowpass',800,60,t,.4,masterGain); noteV2(220,t,.35,'square',.16,{attack:.001,hold:.15,dest:sweepFilt,pan:.2}); noteV2(180,t+.02,.35,'square',.14,{attack:.001,hold:.18,dest:sweepFilt,pan:-.2}); noiseBurst(.2,.08,t+.18,'bandpass',6000,10000,.1,masterGain); break;
    case 'shield': [ [NOTES.A4,0,.2,-.4],[NOTES.C5,.06,.25,.4],[NOTES.E5,.12,.35,0],[NOTES.A5,.18,.3,.2] ].forEach(([f,o,d,p])=>noteV2(f,t+o,d,'sine',.18,{attack:.01,hold:.1,pan:p})); break;
    case 'win': [NOTES.C5,NOTES.E5,NOTES.G5,NOTES.C6,NOTES.E6].forEach((f,i)=>noteV2(f,t+i*.08,.35,'square',.16,{attack:.004,hold:.15,pan:(i-2)*.25})); break;
    case 'lose': [NOTES.E4,NOTES.D4,NOTES.C4,NOTES.A3].forEach((f,i)=>noteV2(f,t+i*.14,.35,'triangle',.18,{attack:.015,hold:.2,pan:i%2? .25:-.25,filterType:'lowpass',filterFreq:1500-i*300})); break;
    case 'cash': [NOTES.C5,NOTES.E5,NOTES.G5,NOTES.C6,NOTES.E6].forEach((f,i)=>noteV2(f,t+i*.05,.18,'triangle',.16,{attack:.001,hold:.06,pan:i%2? .4:-.4})); break;
    case 'buy': [NOTES.C5,NOTES.E5,NOTES.G5,NOTES.C6].forEach((f,i)=>noteV2(f,t+i*.05,.18,'square',.17,{attack:.003,hold:.06,pan:i%2? .3:-.3})); break;
    case 'equip': noteV2(NOTES.A4,t,.1,'triangle',.15,{attack:.002,hold:.04,pan:-.25}); noteV2(NOTES.D5,t+.05,.15,'triangle',.14,{attack:.003,hold:.06,pan:.25}); break;
    case 'deny': noteV2(200,t,.18,'square',.15,{attack:.003,hold:.08,pan:-.2,detune:-15}); noteV2(140,t+.08,.25,'square',.16,{attack:.005,hold:.1,pan:.2,detune:-10}); break;
    case 'trophy': [NOTES.C5,NOTES.E5,NOTES.G5,NOTES.C6,NOTES.E6,NOTES.G6].forEach((f,i)=>noteV2(f,t+i*.06,.28,'sine',.18,{attack:.006,hold:.12,pan:i%2? .35:-.35})); break;
    default: break;
  }
}

// Four low-fatigue gameplay tracks: distinct moods, intentionally soft for background use.
export const TRACKS = {
  track1: { id: 'track1', name: 'Calma', tempo: 72, wave: 'sine', gain: 0.48, notes: ['C4','G4','E4','G4','A4','E4','D4','G4','C4','G4','F4','A4','E4','G4','D4','G4','C4','E4','G4','E4','A4','C5','G4','E4','D4','F4','A4','G4','E4','D4','C4','G3'] },
  track2: { id: 'track2', name: 'Impulso', tempo: 104, wave: 'triangle', gain: 0.38, notes: ['C4','E4','G4','E4','D4','F4','A4','F4','E4','G4','B4','G4','F4','A4','C5','A4','G4','B4','D5','B4','A4','C5','E5','C5','G4','E4','D4','F4','G4','E4','C4','G3'] },
  track3: { id: 'track3', name: 'Deriva', tempo: 82, wave: 'triangle', gain: 0.34, notes: ['A3','E4','C4','E4','G4','D4','B3','D4','F4','C4','A3','C4','E4','B3','G3','B3','D4','A3','F3','A3','C4','G3','E3','G3','A3','E4','C4','E4','D4','B3','A3','E3'] },
  track4: { id: 'track4', name: 'Ascenso', tempo: 92, wave: 'sine', gain: 0.4, notes: ['F4','A4','C5','A4','G4','B4','D5','B4','A4','C5','E5','C5','G4','B4','D5','B4','C5','E5','G5','E5','D5','F5','A5','F5','E5','G5','B5','G5','A5','E5','C5','A4'] },
};

const MENU_TRACK = { id:'menu', name:'Menú Lo-Fi', tempo:68, wave:'sine', gain:.42, notes:['A3','C4','E4','G4','E4','C4','D4','F4','A4','F4','D4','C4','E4','G4','B4','G4','E4','D4','F4','A4','C5','A4','F4','E4','G4','B4','D5','B4','G4','E4','D4','C4'] };
let noteIdx=0, oldMusicGain=null, previewTimer=null;
const CROSSFADE_MS=.45;
function resolveTrack(id){return id==='menu'?MENU_TRACK:TRACKS[id]||TRACKS.track1;}
function startMusic(trackId){
  if(!musicOn||!ctx)return;
  const oldTimer=musicTimer, oldGain=oldMusicGain;
  if(oldTimer&&oldGain){const t=ctx.currentTime; oldGain.gain.cancelScheduledValues(t); oldGain.gain.setValueAtTime(oldGain.gain.value,t); oldGain.gain.linearRampToValueAtTime(0,t+CROSSFADE_MS); clearInterval(oldTimer);}
  else if(oldTimer)clearInterval(oldTimer);
  const musicLevel = 0.5;
  const newGain=ctx.createGain(); newGain.gain.setValueAtTime(oldTimer?0:musicLevel,ctx.currentTime); if(oldTimer)newGain.gain.linearRampToValueAtTime(musicLevel,ctx.currentTime+CROSSFADE_MS); newGain.connect(masterGain);
  const track=resolveTrack(trackId); currentTrack=trackId; const sixteenth=60/track.tempo/4; noteIdx=0;
  musicTimer=setInterval(()=>{if(!ctx||ctx.state==='suspended')return; const freq=NOTES[track.notes[noteIdx]]||440,t=ctx.currentTime; noteV2(freq,t,sixteenth,track.wave||'square',.09*(track.gain||1),{dest:newGain,pan:-.35,attack:.002,hold:sixteenth*.5,filterType:'lowpass',filterFreq:4000}); noteV2(freq*1.5,t,sixteenth,track.wave||'square',.06*(track.gain||1),{dest:newGain,pan:.35,attack:.002,hold:sixteenth*.5,filterType:'lowpass',filterFreq:4000}); noteV2(freq*2,t,sixteenth,'sine',.04*(track.gain||1),{dest:newGain,pan:0,attack:.004,hold:sixteenth*.5}); noteIdx=(noteIdx+1)%track.notes.length;},sixteenth*1000);
  oldMusicGain=newGain;
}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null;}oldMusicGain=null;currentTrack=null;}
export function setTrack(id){gameTrack=id||'track1';if(musicOn&&currentContext==='game')startMusic(gameTrack);}
export function previewTrack(id,duration=3000){const c=ensureCtx();if(!c)return;clearTimeout(previewTimer);const wasPlaying=Boolean(musicOn&&musicTimer),prev=currentTrack,context=currentContext,prevOn=musicOn;musicOn=true;startMusic(id);previewTimer=setTimeout(()=>{previewTimer=null;stopMusic();musicOn=prevOn;currentContext=context;if(wasPlaying)startMusic(context==='game'?(prev||gameTrack):'menu');},duration);}
export function setMusicContext(context){const next=context==='game'?'game':'menu';if(currentContext===next)return;currentContext=next;if(musicOn)startMusic(currentContext==='game'?gameTrack:'menu');}
export function getTrack(){return gameTrack;}
