// collection.js — Catálogo: temas, dorsos, medallas, trofeos, seguro, títulos
import { KEYS, DEFAULT_COLLECTION, DEFAULT_STATS, SHIELD_COST, SHIELDS_PER_FREE } from './config.js';

// ─── Temas de tablero ───
export const THEMES = {
  taller: {
    id: 'taller', name: 'Taller', free: true,
    css: {
      '--bg': '#1d1813', '--border': '#3a3026', '--corner': '#e0ab4f',
      '--hint': '#ecc986', '--multi': '#e0ab4f', '--bomb': '#fff200',
      '--highlight': '#3a3026', '--resolved': '#9aab79',
    },
    light: {
      '--bg': '#e8dcc8', '--border': '#c5b99e', '--corner': '#b06a1f',
      '--hint': '#8a6a2a', '--multi': '#b06a1f', '--bomb': '#cca800',
      '--highlight': '#d4c8ae', '--resolved': '#5a7a3a',
    },
  },
  medianoche: {
    id: 'medianoche', name: 'Medianoche', free: true,
    css: {
      '--bg': '#10171f', '--border': '#1e2d3d', '--corner': '#4a9eff',
      '--hint': '#7ab8ff', '--multi': '#4a9eff', '--bomb': '#fff200',
      '--highlight': '#1e2d3d', '--resolved': '#4ebf71',
    },
    light: {
      '--bg': '#dfe7f0', '--border': '#b8c8d8', '--corner': '#2a6ec8',
      '--hint': '#3a78c0', '--multi': '#2a6ec8', '--bomb': '#cca800',
      '--highlight': '#c8d6e4', '--resolved': '#3a8a4a',
    },
  },
  solar: {
    id: 'solar', name: 'Solar', free: true,
    css: {
      '--bg': '#1a1408', '--border': '#3d2e0a', '--corner': '#ff8c00',
      '--hint': '#ffb347', '--multi': '#e0ab4f', '--bomb': '#fff200',
      '--highlight': '#3d2e0a', '--resolved': '#e6a817',
    },
    light: {
      '--bg': '#f3e8d0', '--border': '#d8c098', '--corner': '#c86a00',
      '--hint': '#c08000', '--multi': '#c86a00', '--bomb': '#cca800',
      '--highlight': '#e8d8b8', '--resolved': '#c08000',
    },
  },
  verde: {
    id: 'verde', name: 'Verde', free: true,
    css: {
      '--bg': '#101a12', '--border': '#1e3622', '--corner': '#4ebf71',
      '--hint': '#7dd48a', '--multi': '#4ebf71', '--bomb': '#fff200',
      '--highlight': '#1e3622', '--resolved': '#9aab79',
    },
    light: {
      '--bg': '#dfeadf', '--border': '#b8ccb8', '--corner': '#2a8a3a',
      '--hint': '#3a9a4a', '--multi': '#2a8a3a', '--bomb': '#cca800',
      '--highlight': '#c8dcc8', '--resolved': '#4a8a3a',
    },
  },
  rojo: {
    id: 'rojo', name: 'Rojo', free: true,
    css: {
      '--bg': '#1a0f0f', '--border': '#3d1a1a', '--corner': '#c65a44',
      '--hint': '#e88b7a', '--multi': '#e0ab4f', '--bomb': '#fff200',
      '--highlight': '#3d1a1a', '--resolved': '#d4a44a',
    },
    light: {
      '--bg': '#f0dfdf', '--border': '#d8b8b8', '--corner': '#b84030',
      '--hint': '#c86050', '--multi': '#c86a00', '--bomb': '#cca800',
      '--highlight': '#e0c8c8', '--resolved': '#b08020',
    },
  },
  leyenda: {
    id: 'leyenda', name: 'Leyenda', free: true, locked: true,
    css: {
      '--bg': '#0f0c1a', '--border': '#2a1f45', '--corner': '#b388ff',
      '--hint': '#d1bfff', '--multi': '#b388ff', '--bomb': '#fff200',
      '--highlight': '#2a1f45', '--resolved': '#7c4dff',
    },
    light: {
      '--bg': '#e6dff0', '--border': '#c0b0d8', '--corner': '#7a4ad8',
      '--hint': '#8a5adf', '--multi': '#7a4ad8', '--bomb': '#cca800',
      '--highlight': '#d0c0e0', '--resolved': '#5a3ac0',
    },
  },
};

// ─── Dorsos de carta ───
export const SKINS = {
  clasico: {
    id: 'clasico', name: 'Clásico', free: true,
    css: {
      '--card-front-bg': 'linear-gradient(135deg, #3d2c1a, #5a3d24)',
      '--card-front-border': '#c8965c',
      '--card-back-bg': 'linear-gradient(135deg, #2a1f0f, #4a3520)',
      '--card-back-border': '#c8965c',
      '--card-glow': 'rgba(200, 150, 92, 0.15)',
    },
    light: {
      '--card-front-bg': 'linear-gradient(135deg, #ece1cc, #f5eedd)',
      '--card-front-border': '#a08050',
      '--card-back-bg': 'linear-gradient(135deg, #d9c7a8, #c4b08e)',
      '--card-back-border': '#8a7040',
      '--card-glow': 'rgba(160, 120, 60, 0.18)',
    },
  },
  brasa: {
    id: 'brasa', name: 'Brasa', free: true,
    css: {
      '--card-front-bg': 'linear-gradient(135deg, #3d1a0a, #5a2a10)',
      '--card-front-border': '#ff6600',
      '--card-back-bg': 'linear-gradient(135deg, #2a0f00, #4a1a05)',
      '--card-back-border': '#ff6600',
      '--card-glow': 'rgba(255, 102, 0, 0.15)',
    },
    light: {
      '--card-front-bg': 'linear-gradient(135deg, #f2d8c8, #eec0a0)',
      '--card-front-border': '#c85010',
      '--card-back-bg': 'linear-gradient(135deg, #e2c6ac, #d3a784)',
      '--card-back-border': '#c85010',
      '--card-glow': 'rgba(200, 80, 16, 0.18)',
    },
  },
  hielo: {
    id: 'hielo', name: 'Hielo', free: true,
    css: {
      '--card-front-bg': 'linear-gradient(135deg, #1a2535, #253a50)',
      '--card-front-border': '#6ab4ff',
      '--card-back-bg': 'linear-gradient(135deg, #0f1825, #1a2a3d)',
      '--card-back-border': '#6ab4ff',
      '--card-glow': 'rgba(106, 180, 255, 0.15)',
    },
    light: {
      '--card-front-bg': 'linear-gradient(135deg, #dce8f2, #c6d8ea)',
      '--card-front-border': '#3a7ac8',
      '--card-back-bg': 'linear-gradient(135deg, #cad9ea, #b2c8e0)',
      '--card-back-border': '#3a7ac8',
      '--card-glow': 'rgba(58, 122, 200, 0.18)',
    },
  },
  obsidiana: {
    id: 'obsidiana', name: 'Obsidiana', free: true,
    css: {
      '--card-front-bg': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
      '--card-front-border': '#a0a0a0',
      '--card-back-bg': 'linear-gradient(135deg, #0f0f0f, #1f1f1f)',
      '--card-back-border': '#a0a0a0',
      '--card-glow': 'rgba(160, 160, 160, 0.15)',
    },
    light: {
      '--card-front-bg': 'linear-gradient(135deg, #eaeaea, #d4d4d4)',
      '--card-front-border': '#7a7a7a',
      '--card-back-bg': 'linear-gradient(135deg, #dcdcdc, #c2c2c2)',
      '--card-back-border': '#6a6a6a',
      '--card-glow': 'rgba(120, 120, 120, 0.18)',
    },
  },
  jade: {
    id: 'jade', name: 'Jade', free: true,
    css: {
      '--card-front-bg': 'linear-gradient(135deg, #1a3322, #2a4a35)',
      '--card-front-border': '#4ebf71',
      '--card-back-bg': 'linear-gradient(135deg, #0f2215, #1a3525)',
      '--card-back-border': '#4ebf71',
      '--card-glow': 'rgba(78, 191, 113, 0.15)',
    },
    light: {
      '--card-front-bg': 'linear-gradient(135deg, #dceadc, #c4dcc4)',
      '--card-front-border': '#2a8a3a',
      '--card-back-bg': 'linear-gradient(135deg, #c6dcc6, #aed0ae)',
      '--card-back-border': '#2a8a3a',
      '--card-glow': 'rgba(42, 138, 58, 0.18)',
    },
  },
  cosmos: {
    id: 'cosmos', name: 'Cosmos', free: true, locked: true,
    css: {
      '--card-front-bg': 'linear-gradient(135deg, #1a0f2d, #2d1550)',
      '--card-front-border': '#b388ff',
      '--card-back-bg': 'linear-gradient(135deg, #0f0820, #1a0f35)',
      '--card-back-border': '#b388ff',
      '--card-glow': 'rgba(179, 136, 255, 0.2)',
    },
    light: {
      '--card-front-bg': 'linear-gradient(135deg, #e4dcf2, #ccb8e8)',
      '--card-front-border': '#7a4ad8',
      '--card-back-bg': 'linear-gradient(135deg, #d2c8e4, #b8a8d8)',
      '--card-back-border': '#7a4ad8',
      '--card-glow': 'rgba(122, 74, 216, 0.18)',
    },
  },
};

// ─── Medallas de vitrina (comprables) ───
export const MEDALS = [
  { id: 'medal_cobre', name: 'Medalla de Cobre', cost: 100, emoji: '🥉', tier: 'bronze' },
  { id: 'medal_plata', name: 'Medalla de Plata', cost: 250, emoji: '🥈', tier: 'silver' },
  { id: 'medal_oro', name: 'Medalla de Oro', cost: 500, emoji: '🥇', tier: 'gold' },
  { id: 'medal_zafiro', name: 'Medalla de Zafiro', cost: 800, emoji: '💎', tier: 'gold' },
  { id: 'medal_rubi', name: 'Medalla de Rubí', cost: 1200, emoji: '🔴', tier: 'legendary' },
  { id: 'medal_diamante', name: 'Medalla de Diamante', cost: 2000, emoji: '💠', tier: 'legendary' },
  { id: 'medal_obsidiana', name: 'Medalla de Obsidiana', cost: 3000, emoji: '🖤', tier: 'legendary' },
];

// ─── Trofeos de mérito ───
// Se ganan jugando, no se compran. Cada trofeo tiene un id, un name y una check function.
// ─── Rareza de trofeos ───
export const TROPHY_TIERS = {
  bronze: { label: 'Bronce', icon: '🥉', color: '#cd7f32' },
  silver: { label: 'Plata', icon: '🥈', color: '#c8ccd4' },
  gold: { label: 'Oro', icon: '🥇', color: '#ffd700' },
  legendary: { label: 'Legendario', icon: '💎', color: '#b388ff' },
};

export const TROPHIES = [
  { id: 'trophy_first', name: 'Primera Pantalla', desc: 'Completa tu primera pantalla', tier: 'bronze', check(s) { return s.screensWon >= 1; } },
  { id: 'trophy_10', name: '10 Pantallas', desc: 'Completa 10 pantallas', tier: 'bronze', check(s) { return s.screensWon >= 10; } },
  { id: 'trophy_25', name: '25 Pantallas', desc: 'Completa 25 pantallas', tier: 'silver', check(s) { return s.screensWon >= 25; } },
  { id: 'trophy_50', name: '50 Pantallas', desc: 'Completa 50 pantallas', tier: 'gold', check(s) { return s.screensWon >= 50; } },
  { id: 'trophy_100', name: '100 Pantallas', desc: 'Completa 100 pantallas', tier: 'legendary', check(s) { return s.screensWon >= 100; } },
  { id: 'trophy_streak3', name: 'Racha 3', desc: 'Gana 3 pantallas seguidas', tier: 'bronze', check(s) { return s.streak >= 3; } },
  { id: 'trophy_streak5', name: 'Racha 5', desc: 'Gana 5 pantallas seguidas', tier: 'silver', check(s) { return s.streak >= 5; } },
  { id: 'trophy_streak8', name: 'Racha 8', desc: 'Gana 8 pantallas seguidas', tier: 'gold', check(s) { return s.streak >= 8; } },
  { id: 'trophy_level4', name: 'Piso 4', desc: 'Llega a pantalla Duro (4)', tier: 'bronze', check(s) { return s.bestLevel >= 4; } },
  { id: 'trophy_level6', name: 'Piso 6', desc: 'Llega a pantalla Pesadilla (6)', tier: 'silver', check(s) { return s.bestLevel >= 6; } },
  { id: 'trophy_level8', name: 'Piso 8', desc: 'Llega a pantalla Leyenda (8)', tier: 'gold', check(s) { return s.bestLevel >= 8; } },
  { id: 'trophy_bank500', name: 'Ahorros', desc: 'Acumula 500 monedas en el banco', tier: 'bronze', check(s, coins) { return coins >= 500; } },
  { id: 'trophy_bank2500', name: 'Fortuna', desc: 'Acumula 2500 monedas en el banco', tier: 'silver', check(s, coins) { return coins >= 2500; } },
  { id: 'trophy_bank5000', name: 'Tesoro', desc: 'Acumula 5000 monedas en el banco', tier: 'gold', check(s, coins) { return coins >= 5000; } },
  { id: 'trophy_first_bomb', name: '¡Chispa!', desc: 'Sufre tu primer shock', tier: 'bronze', check(s) { return s.bombsHit >= 1; } },
  { id: 'trophy_20bombs', name: 'Alta tensión', desc: 'Sufre 20 shocks', tier: 'silver', check(s) { return s.bombsHit >= 20; } },
  { id: 'trophy_no_memo', name: 'Memoria pura', desc: 'Gana una pantalla sin usar MEMO', tier: 'bronze', check(s) { return s.screensWithoutMemo > 0; } },
  { id: 'trophy_no_ones', name: 'Eficiencia', desc: 'Gana una pantalla sin revelar ningún 1', tier: 'silver', check(s) { return s.screensRevealingNoOnes > 0; } },
  { id: 'trophy_mult40', name: 'Multi ×40', desc: 'Alcanza un multiplicador de ×40', tier: 'silver', check(s) { return s.highestMulti >= 40; } },
  { id: 'trophy_mult100', name: 'Multi ×100', desc: 'Alcanza un multiplicador de ×100', tier: 'gold', check(s) { return s.highestMulti >= 100; } },
  { id: 'trophy_shield', name: 'Aislante', desc: 'Gana una pantalla tras usar el aislante', tier: 'bronze', check(s) { return s.shieldsUsed > 0; } },
  { id: 'trophy_rendirse100', name: 'Sabio retiro', desc: 'Ríndete con ≥100 monedas en la partida', tier: 'bronze', check(s) { return s.rendirseOver100; } },
  { id: 'trophy_all_medals', name: 'Coleccionista', desc: 'Consigue todas las medallas de vitrina', tier: 'gold', check(s) { return s.allMedals; } },
  { id: 'trophy_1start', name: 'Desde cero', desc: 'Gana empezando con multiplicador ×1', tier: 'bronze', check(s) { return s.startWith1; } },
  { id: 'trophy_2start', name: 'Buen pie', desc: 'Gana empezando con multiplicador ×2', tier: 'silver', check(s) { return s.startWith2; } },
  { id: 'trophy_3start', name: 'Arranque perfecto', desc: 'Gana empezando con multiplicador ×3', tier: 'gold', check(s) { return s.startWith3; } },
  { id: 'trophy_all_trophies', name: 'Maestro Shock Flip', desc: 'Consigue todos los trofeos', tier: 'legendary', check(s, coins, trophies) { return trophies && trophies.length >= 25; } },
];

// ─── Aislante anti-shock ───
export class ShieldManager {
  constructor() {
    this.armed = false;
  }

  hasShield(collection) { return (collection?.shields || 0) > 0; }

  arm() {
    this.armed = true;
    return { consumed: false };
  }

  consume(collection) {
    if (!this.armed) return { blocked: false };
    this.armed = false;
    if (collection.shields > 0) {
      collection.shields--;
      return { blocked: true, consumed: true };
    }
    return { blocked: false };
  }

  addFreeShield(collection) {
    collection.shieldProgress = (collection.shieldProgress || 0) + 1;
    if (collection.shieldProgress >= SHIELDS_PER_FREE) {
      collection.shieldProgress = 0;
      collection.shields++;
      return true;
    }
    return false;
  }
}

// ─── Persistencia ───
export function loadCollection() {
  try {
    const raw = localStorage.getItem(KEYS.collection);
    if (!raw) return { ...DEFAULT_COLLECTION, owned: [], trophies: [] };
    const data = JSON.parse(raw);
    return { ...DEFAULT_COLLECTION, ...data };
  } catch { return { ...DEFAULT_COLLECTION, owned: [], trophies: [] }; }
}

export function saveCollection(col) {
  localStorage.setItem(KEYS.collection, JSON.stringify(col));
}

export function loadStats() {
  try {
    const raw = localStorage.getItem(KEYS.stats);
    if (!raw) return { ...DEFAULT_STATS };
    const data = JSON.parse(raw);
    // Migration: rename old trophy ids
    const migrated = { ...DEFAULT_STATS, ...data };
    return migrated;
  } catch { return { ...DEFAULT_STATS }; }
}

export function saveStats(stats) {
  localStorage.setItem(KEYS.stats, JSON.stringify(stats));
}

export function loadCoins() {
  return parseInt(localStorage.getItem(KEYS.coins) || '0', 10) || 0;
}

export function saveCoins(n) {
  localStorage.setItem(KEYS.coins, String(Math.floor(n)));
}

export function loadSound() {
  return localStorage.getItem(KEYS.sound) !== '0';
}

export function saveSound(on) {
  localStorage.setItem(KEYS.sound, on ? '1' : '0');
}

export function loadHaptics() {
  return localStorage.getItem(KEYS.haptics) !== '0';
}

export function saveHaptics(on) {
  localStorage.setItem(KEYS.haptics, on ? '1' : '0');
}

export function loadMusic() {
  return localStorage.getItem(KEYS.music) || 'track1';
}

export function saveMusic(id) {
  localStorage.setItem(KEYS.music, id);
}

export function loadMusicOn() {
  // Por defecto encendida en la primera visita (no hay clave → true)
  return localStorage.getItem(KEYS.musicOn) !== '0';
}

export function saveMusicOn(on) {
  localStorage.setItem(KEYS.musicOn, on ? '1' : '0');
}

// Modo de tema: 'auto' | 'dark' | 'light' (por defecto sigue al sistema)
export function loadTheme() {
  const v = localStorage.getItem(KEYS.theme);
  return v === 'dark' || v === 'light' ? v : 'auto';
}

export function saveTheme(mode) {
  localStorage.setItem(KEYS.theme, mode === 'dark' || mode === 'light' ? mode : 'auto');
}

// ─── Check and award trophies ───
export function checkTrophies(stats, coins, collection) {
  const newTrophies = [];
  for (const t of TROPHIES) {
    if (collection.trophies.includes(t.id)) continue;
    // Special check for all_trophies which needs to count other trophies
    if (t.id === 'trophy_all_trophies') {
      if (collection.trophies.length >= 25 && !collection.trophies.includes('trophy_all_trophies')) {
        newTrophies.push(t);
      }
      continue;
    }
    if (t.id === 'trophy_all_medals') {
      if (stats.allMedals) newTrophies.push(t);
      continue;
    }
    if (t.check(stats, coins)) newTrophies.push(t);
  }
  return newTrophies;
}

// ─── Unlock locked items ───
export function isUnlocked(collection, item) {
  if (!item.locked) return true;
  // Leyenda theme / Cosmos skin unlocked after completing level 8
  const stats = loadStats();
  return stats.bestLevel >= 8;
}