// audio.js — Síntesis de audio con Web Audio API (0 samples externos)
// V2: ruido texturizado, filtros, paneo estéreo, compresor maestro
let ctx = null;
let masterGain = null;
let compressor = null;
let noiseBuffer = null;
let currentTrack = null;
let musicTimer = null;
let soundOn = true;
let musicOn = false;
let gameTrack = 'track1';     // pista seleccionable para la partida
let currentContext = 'menu';  // 'menu' | 'game'

export function initAudio() {
  if (ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    // Compresor maestro para dar punch y evitar clipping
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

    // Pre-generar buffer de ruido blanco (2s) para efectos percusivos
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
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

// ─── Nodos reutilizables ───
function makeOsc(type, freq, dest) {
  if (!ctx) return null;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(dest);
  return osc;
}

function makeGain(val, time, dest) {
  if (!ctx) return null;
  const g = ctx.createGain();
  g.gain.setValueAtTime(val, time);
  g.connect(dest);
  return g;
}

// Filtro con envolvente de frecuencia (útil para barridos)
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

// Ráfaga de ruido filtrado (para golpes, explosiones, clicks)
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

  src.connect(filt);
  filt.connect(g);
  g.connect(panner);
  panner.connect(dest || masterGain);
  src.start(t);
  src.stop(t + dur);
  return { src, filt, g, panner };
}

// Nota mejorada con envolvente AD, paneo, y opción de filtro
function noteV2(freq, time, dur, type, gain, opts = {}) {
  if (!ctx) return;
  const dest = opts.dest || masterGain;

  // Filtro de shaping
  const filt = ctx.createBiquadFilter();
  filt.type = opts.filterType || 'lowpass';
  filt.frequency.setValueAtTime(opts.filterFreq || 8000, time);
  filt.Q.value = opts.filterQ || 0.5;

  const g = ctx.createGain();
  // Ataque suave
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(gain, time + (opts.attack || 0.004));
  // Decay
  g.gain.setValueAtTime(gain, time + (opts.attack || 0.004) + (opts.hold || dur * 0.55));
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

  const pan = ctx.createStereoPanner();
  pan.pan.value = opts.pan !== undefined ? opts.pan : (Math.random() * 0.6 - 0.3);

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  if (opts.detune) osc.detune.value = opts.detune;

  osc.connect(filt);
  filt.connect(g);
  g.connect(pan);
  pan.connect(dest);

  osc.start(time);
  osc.stop(time + dur);
}

// ─── Frecuencias musicales ───
const NOTES = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5, D6: 1174.66, E6: 1318.5, F6: 1396.9, G6: 1568.0, A6: 1760.0, B6: 1975.5,
  C7: 2093.0, D7: 2349.3, E7: 2637.0,
};

// ─── Efectos de sonido V2 ───
export function sfx(name, speed = 1) {
  if (!soundOn) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  const s = Math.max(0.65, Math.min(1.5, speed));

  switch (name) {
    case 'click': {
      // Click percusivo: ruido HP filtrado + tick agudo
      noiseBurst(0.04, 0.18, t, 'highpass', 3000, 8000, 0, masterGain);
      noteV2(900 * s, t, 0.03, 'square', 0.06, { attack: 0.001, hold: 0.01, filterType: 'highpass', filterFreq: 2000 });
      break;
    }
    case 'flip': {
      // Barrido metálico para voltear carta
      noiseBurst(0.07, 0.1, t, 'bandpass', 800, 2000, 0, masterGain);
      noteV2(350, t, 0.08, 'triangle', 0.12, { pan: -0.3, attack: 0.002, hold: 0.03, filterType: 'lowpass', filterFreq: 1200 });
      noteV2(650, t + 0.04, 0.1, 'triangle', 0.1, { pan: 0.3, attack: 0.002, hold: 0.04, filterType: 'lowpass', filterFreq: 1800 });
      break;
    }
    case 'reveal1': {
      // Suave, madera — revelar un 1
      noteV2(NOTES.C5, t, 0.18, 'sine', 0.14, { attack: 0.01, hold: 0.08, pan: 0 });
      // Armónico suave
      noteV2(NOTES.C6, t + 0.02, 0.12, 'sine', 0.06, { attack: 0.01, hold: 0.05, pan: 0.2 });
      break;
    }
    case 'reveal2': {
      // Brillante y cálido — revelar un 2 (multiplicador)
      noteV2(NOTES.E5, t, 0.16, 'triangle', 0.16, { attack: 0.003, hold: 0.07, pan: -0.25 });
      noteV2(NOTES.G5, t + 0.03, 0.15, 'triangle', 0.12, { attack: 0.003, hold: 0.06, pan: 0.25 });
      noteV2(NOTES.C6, t + 0.06, 0.14, 'sine', 0.09, { attack: 0.004, hold: 0.05, pan: 0, detune: 7 });
      // Golpe de ruido brillante
      noiseBurst(0.06, 0.07, t, 'highpass', 4000, 8000, 0, masterGain);
      break;
    }
    case 'reveal3': {
      // Potente y metálico — revelar un 3 (multiplicador alto)
      noteV2(NOTES.C5, t, 0.14, 'sawtooth', 0.14, { attack: 0.002, hold: 0.05, pan: -0.3, filterType: 'lowpass', filterFreq: 3000 });
      noteV2(NOTES.E5, t + 0.03, 0.13, 'sawtooth', 0.13, { attack: 0.002, hold: 0.05, pan: 0.2, filterType: 'lowpass', filterFreq: 3500 });
      noteV2(NOTES.G5, t + 0.06, 0.15, 'sawtooth', 0.14, { attack: 0.002, hold: 0.06, pan: 0.3, filterType: 'lowpass', filterFreq: 4000 });
      noteV2(NOTES.C6, t + 0.09, 0.14, 'square', 0.1, { attack: 0.003, hold: 0.05, pan: -0.1, detune: 12 });
      // Impacto de ruido low+high
      noiseBurst(0.09, 0.1, t, 'lowpass', 400, 150, 0, masterGain);
      noiseBurst(0.06, 0.06, t + 0.02, 'highpass', 5000, 10000, 0.3, masterGain);
      break;
    }
    case 'bomb': {
      // Descarga eléctrica: zumbido grave + chisporroteo agudo + crujido de arco
      // Hum de 50/60 Hz
      noteV2(55, t, 0.55, 'sawtooth', 0.25, { attack: 0.002, hold: 0.22, pan: 0 });
      noteV2(110, t, 0.5, 'sawtooth', 0.18, { attack: 0.003, hold: 0.18, pan: -0.3 });
      // Chisporroteo de arco eléctrico
      noiseBurst(0.45, 0.3, t, 'bandpass', 3000, 8000, 0, masterGain);
      noiseBurst(0.35, 0.2, t + 0.04, 'highpass', 5000, 12000, 0.2, masterGain);
      noiseBurst(0.25, 0.12, t + 0.08, 'highpass', 8000, 16000, -0.2, masterGain);
      // Descenso del arco (zap descendente)
      const sweepFilt = filterSweep('lowpass', 800, 60, t, 0.4, masterGain);
      noteV2(220, t, 0.35, 'square', 0.16, { attack: 0.001, hold: 0.15, dest: sweepFilt, pan: 0.2 });
      noteV2(180, t + 0.02, 0.35, 'square', 0.14, { attack: 0.001, hold: 0.18, dest: sweepFilt, pan: -0.2 });
      // Crack final agudo (arco que se rompe)
      noiseBurst(0.2, 0.08, t + 0.18, 'bandpass', 6000, 10000, 0.1, masterGain);
      break;
    }
    case 'shield': {
      // Escudo: ascendente cristalino con brillo
      noteV2(NOTES.A4, t, 0.2, 'sine', 0.18, { attack: 0.008, hold: 0.1, pan: -0.4 });
      noteV2(NOTES.C5, t + 0.06, 0.25, 'sine', 0.2, { attack: 0.01, hold: 0.12, pan: 0.4 });
      noteV2(NOTES.E5, t + 0.12, 0.35, 'sine', 0.2, { attack: 0.012, hold: 0.15, pan: 0 });
      noteV2(NOTES.A5, t + 0.18, 0.3, 'triangle', 0.14, { attack: 0.01, hold: 0.1, pan: 0.2, detune: 15 });
      // Shimmer noise
      noiseBurst(0.2, 0.08, t, 'highpass', 6000, 12000, 0.5, masterGain);
      noiseBurst(0.25, 0.06, t + 0.1, 'highpass', 8000, 14000, -0.4, masterGain);
      break;
    }
    case 'win': {
      // Fanfarria de victoria: arpegio mayor con brillo
      const chords = [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6, NOTES.E6];
      chords.forEach((f, i) => {
        noteV2(f, t + i * 0.08, 0.35, 'square', 0.16, { attack: 0.004, hold: 0.15, pan: (i - 2) * 0.25 });
        // Octava
        if (i < 3) noteV2(f * 2, t + i * 0.08, 0.3, 'sine', 0.08, { attack: 0.006, hold: 0.12, pan: -(i - 2) * 0.25 });
      });
      // Confeti noise
      noiseBurst(0.4, 0.12, t, 'bandpass', 3000, 8000, 0, masterGain);
      noiseBurst(0.5, 0.08, t + 0.2, 'highpass', 6000, 14000, 0.3, masterGain);
      break;
    }
    case 'lose': {
      // Derrota: descenso triste con distorsión suave
      const loseNotes = [NOTES.E4, NOTES.D4, NOTES.C4, NOTES.A3];
      loseNotes.forEach((f, i) => {
        noteV2(f, t + i * 0.14, 0.35, 'triangle', 0.18, { attack: 0.015, hold: 0.2, pan: i % 2 === 0 ? -0.25 : 0.25, filterType: 'lowpass', filterFreq: 1500 - i * 300 });
      });
      // Sub boom triste
      noteV2(NOTES.C3, t + 0.4, 0.5, 'sine', 0.2, { attack: 0.02, hold: 0.3, pan: 0 });
      noiseBurst(0.3, 0.08, t + 0.4, 'lowpass', 200, 80, 0, masterGain);
      break;
    }
    case 'cash': {
      // Monedas: tintineo metálico rápido
      [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6, NOTES.E6].forEach((f, i) => {
        noteV2(f, t + i * 0.05, 0.18, 'triangle', 0.16, { attack: 0.001, hold: 0.06, pan: (i % 2 === 0 ? -0.4 : 0.4) });
        noteV2(f * 1.5, t + i * 0.05 + 0.02, 0.1, 'sine', 0.08, { attack: 0.002, hold: 0.04, pan: (i % 2 === 0 ? 0.3 : -0.3) });
      });
      noiseBurst(0.3, 0.1, t, 'highpass', 7000, 15000, 0, masterGain);
      break;
    }
    case 'buy': {
      // Compra: ca-ching satisfactorio
      noteV2(NOTES.C5, t, 0.12, 'square', 0.18, { attack: 0.003, hold: 0.05, pan: -0.3 });
      noteV2(NOTES.E5, t + 0.05, 0.15, 'square', 0.16, { attack: 0.003, hold: 0.06, pan: 0.3 });
      noteV2(NOTES.G5, t + 0.1, 0.25, 'square', 0.18, { attack: 0.004, hold: 0.1, pan: 0 });
      noteV2(NOTES.C6, t + 0.12, 0.2, 'sine', 0.1, { attack: 0.005, hold: 0.08, pan: 0.15 });
      noiseBurst(0.15, 0.1, t, 'bandpass', 3000, 5000, 0, masterGain);
      break;
    }
    case 'equip': {
      // Equipar: click mecánico + tono neutro
      noteV2(NOTES.A4, t, 0.1, 'triangle', 0.15, { attack: 0.002, hold: 0.04, pan: -0.25 });
      noteV2(NOTES.D5, t + 0.05, 0.15, 'triangle', 0.14, { attack: 0.003, hold: 0.06, pan: 0.25 });
      noiseBurst(0.06, 0.12, t, 'bandpass', 2000, 4000, 0, masterGain);
      break;
    }
    case 'deny': {
      // Denegar: buzz grave de error
      noteV2(200, t, 0.18, 'square', 0.15, { attack: 0.003, hold: 0.08, pan: -0.2, detune: -15 });
      noteV2(140, t + 0.08, 0.25, 'square', 0.16, { attack: 0.005, hold: 0.1, pan: 0.2, detune: -10 });
      noiseBurst(0.15, 0.1, t, 'lowpass', 600, 200, 0, masterGain);
      break;
    }
    case 'trophy': {
      // Trofeo: fanfarria festiva con campanas
      const trophyNotes = [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6, NOTES.E6, NOTES.G6];
      trophyNotes.forEach((f, i) => {
        noteV2(f, t + i * 0.06, 0.28, 'sine', 0.18, { attack: 0.006, hold: 0.12, pan: (i % 2 === 0 ? -0.35 : 0.35) });
        // Armónico de campana
        if (i >= 2) noteV2(f * 2.5, t + i * 0.06 + 0.01, 0.15, 'sine', 0.06, { attack: 0.008, hold: 0.06, pan: (i % 2 === 0 ? 0.3 : -0.3) });
      });
      noiseBurst(0.4, 0.15, t, 'bandpass', 5000, 12000, 0, masterGain);
      noiseBurst(0.5, 0.08, t + 0.2, 'highpass', 10000, 16000, 0.4, masterGain);
      break;
    }
    default:
      break;
  }
}

// ─── 4 pistas chiptune (seleccionables para la partida) ───
export const TRACKS = {
  track1: { id: 'track1', name: 'Mecánica', tempo: 120, notes: ['C4', 'E4', 'G4', 'C5', 'B4', 'G4', 'E4', 'G4', 'A4', 'C5', 'E5', 'C5', 'G4', 'E4', 'D4', 'E4', 'F4', 'A4', 'C5', 'A4', 'E4', 'C4', 'D4', 'E4', 'G4', 'B4', 'D5', 'B4', 'A4', 'G4', 'E4', 'C4'] },
  track2: { id: 'track2', name: 'Fábrica', tempo: 100, notes: ['A3', 'C4', 'E4', 'A4', 'G4', 'E4', 'C4', 'A3', 'F3', 'A3', 'C4', 'F4', 'E4', 'C4', 'A3', 'F3', 'G3', 'B3', 'D4', 'G4', 'F4', 'D4', 'B3', 'G3', 'A3', 'C4', 'E4', 'A4', 'G4', 'E4', 'C4', 'A3'] },
  track3: { id: 'track3', name: 'Peligro', tempo: 90, notes: ['E3', 'G3', 'B3', 'E4', 'D4', 'B3', 'G3', 'E3', 'C3', 'E3', 'G3', 'C4', 'B3', 'G3', 'E3', 'C3', 'A3', 'C4', 'E4', 'A4', 'G4', 'E4', 'C4', 'A3', 'E4', 'G4', 'B4', 'E5', 'D5', 'B4', 'G4', 'E4'] },
  track4: { id: 'track4', name: 'Leyenda', tempo: 135, notes: ['C5', 'E5', 'G5', 'E5', 'D5', 'C5', 'A4', 'C5', 'F5', 'E5', 'D5', 'C5', 'B4', 'D5', 'G4', 'B4', 'A4', 'C5', 'E5', 'G5', 'F5', 'E5', 'D5', 'C5', 'E5', 'G5', 'C6', 'G5', 'A5', 'G5', 'E5', 'C5'] },
};

// Pista ambiental del menú (no seleccionable en el taller): tranquila y suave
const MENU_TRACK = {
  id: 'menu', name: 'Menú', tempo: 74, wave: 'triangle', gain: 0.7,
  notes: ['C4', 'E4', 'G4', 'E4', 'A4', 'F4', 'C4', 'F4', 'D4', 'F4', 'A4', 'F4', 'G4', 'B4', 'D4', 'B4', 'E4', 'G4', 'C5', 'G4', 'F4', 'A4', 'C5', 'A4', 'C4', 'E4', 'G4', 'C5', 'B4', 'G4', 'F4', 'G4'],
};

let noteIdx = 0;
let oldMusicGain = null;
let previewTimer = null;
const CROSSFADE_MS = 0.45; // segundos

function resolveTrack(trackId) {
  if (trackId === 'menu') return MENU_TRACK;
  return TRACKS[trackId] || TRACKS.track1;
}

function startMusic(trackId) {
  if (!musicOn || !ctx) return;

  // Crossfade: el viejo timer sigue sonando (sus notas ya agendadas al viejo gain)
  // y el nuevo arranca sobre un nodo de ganancia fresco.
  const oldTimer = musicTimer;
  const oldGain = oldMusicGain;

  if (oldTimer && oldGain && ctx) {
    // Fade-out del nodo de ganancia viejo
    const t = ctx.currentTime;
    oldGain.gain.cancelScheduledValues(t);
    oldGain.gain.setValueAtTime(oldGain.gain.value, t);
    oldGain.gain.linearRampToValueAtTime(0, t + CROSSFADE_MS);
    // Parar el viejo timer AHORA (sus notas ya agendadas se oirán durante el fade).
    // Si no lo paramos ahora perdemos su referencia.
    clearInterval(oldTimer);
  } else if (oldTimer) {
    clearInterval(oldTimer);
  }

  // Crear un nuevo nodo de ganancia para la pista entrante
  const newGain = ctx.createGain();
  newGain.gain.setValueAtTime(oldTimer ? 0 : 0.18, ctx.currentTime);
  if (oldTimer) {
    newGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + CROSSFADE_MS);
  }
  newGain.connect(masterGain);

  // Redirigir musicGain al nuevo nodo (las notas se conectan a musicGain)
  // Alternativa más simple: usar el nuevo nodo directamente como destino de las notas
  const track = resolveTrack(trackId);
  currentTrack = trackId;
  const tempo = track.tempo;
  const wave = track.wave || 'square';
  const g = track.gain || 1;
  const sixteenth = 60 / tempo / 4;
  noteIdx = 0;

  musicTimer = setInterval(() => {
    if (!ctx || ctx.state === 'suspended') return;
    const freq = NOTES[track.notes[noteIdx]] || 440;
    const t = ctx.currentTime;
    // Acorde: nota base + quinta + octava con paneo estéreo y filtro
    noteV2(freq, t, sixteenth, wave, 0.09 * g, { dest: newGain, pan: -0.35, attack: 0.002, hold: sixteenth * 0.5, filterType: 'lowpass', filterFreq: 4000 });
    noteV2(freq * 1.5, t, sixteenth, wave, 0.06 * g, { dest: newGain, pan: 0.35, attack: 0.002, hold: sixteenth * 0.5, filterType: 'lowpass', filterFreq: 4000 });
    noteV2(freq * 2, t, sixteenth, 'sine', 0.04 * g, { dest: newGain, pan: 0, attack: 0.004, hold: sixteenth * 0.5 });
    noteIdx = (noteIdx + 1) % track.notes.length;
  }, sixteenth * 1000);

  oldMusicGain = newGain;
}

function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  oldMusicGain = null;
  currentTrack = null;
}

export function setTrack(trackId) {
  gameTrack = trackId || 'track1';
  // Solo reiniciar si cambió la pista de partida y estamos en contexto game
  if (musicOn && currentContext === 'game') startMusic(gameTrack);
}

// Reproduce una pista durante unos segundos sin cambiar la pista equipada ni el contexto.
export function previewTrack(trackId, duration = 3000) {
  const c = ensureCtx();
  if (!c) return;
  clearTimeout(previewTimer);
  const wasPlaying = Boolean(musicOn && musicTimer);
  const previousTrack = currentTrack;
  const previousContext = currentContext;
  // La previsualización usa temporalmente el motor normal para conservar la síntesis.
  const previousMusicOn = musicOn;
  musicOn = true;
  startMusic(trackId);
  previewTimer = setTimeout(() => {
    previewTimer = null;
    stopMusic();
    musicOn = previousMusicOn;
    currentContext = previousContext;
    if (wasPlaying) startMusic(previousContext === 'game' ? (previousTrack || gameTrack) : 'menu');
  }, duration);
}

export function setMusicContext(ctx) {
  const next = ctx === 'game' ? 'game' : 'menu';
  if (currentContext === next) return;
  currentContext = next;
  if (musicOn) startMusic(currentContext === 'game' ? gameTrack : 'menu');
}

export function getTrack() { return gameTrack; }