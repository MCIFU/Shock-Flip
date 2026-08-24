// config.js — Niveles, constantes, claves de localStorage para Shock Flip
export const KEYS = {
  coins: 'bombflip:coins',
  sound: 'bombflip:sound',
  haptics: 'bombflip:haptics',
  music: 'bombflip:music',
  musicOn: 'bombflip:musicOn',
  theme: 'bombflip:theme',
  collection: 'bombflip:collection',
  stats: 'bombflip:stats',
  boardSize: 'bombflip:boardsize',
};

// ─── Board sizes ───
export const BOARD_SIZES = [
  { id: 4, name: 'Compacto', icon: '4×4' },
  { id: 5, name: 'Normal', icon: '5×5' },
  { id: 6, name: 'Grande', icon: '6×6' },
];

export const DEFAULT_BOARD_SIZE = 5;

// ─── Card-back patterns ───
export const CARD_BACK_PATTERNS = [
  { id: 'core', name: 'Núcleo', icon: '⚡' },
  { id: 'grid', name: 'Cuadrícula', icon: '🔲' },
  { id: 'diamond', name: 'Diamante', icon: '🔶' },
  { id: 'crosshatch', name: 'Aspa', icon: '❌' },
];

export const DEFAULT_CARD_BACK = 'core';

// 8 pantallas de dificultad, 5 patrones cada una para tablero 5×5.
// Cada patrón define: twos, threes, bombs. Los 1 rellenan hasta 25.
// Para otros tamaños de tablero, los patrones se escalan proporcionalmente.
const LEVELS_5X5 = [
  {
    id: 1, name: 'NOVATO',
    patterns: [
      { twos: 6, threes: 2, bombs: 3 },
      { twos: 5, threes: 3, bombs: 4 },
      { twos: 7, threes: 1, bombs: 4 },
      { twos: 4, threes: 4, bombs: 5 },
      { twos: 6, threes: 2, bombs: 5 },
    ],
    noBombRow: true,
  },
  {
    id: 2, name: 'RUTINA',
    patterns: [
      { twos: 5, threes: 3, bombs: 6 },
      { twos: 6, threes: 2, bombs: 7 },
      { twos: 4, threes: 4, bombs: 7 },
      { twos: 7, threes: 1, bombs: 7 },
      { twos: 5, threes: 3, bombs: 7 },
    ],
    noBombRow: true,
  },
  {
    id: 3, name: 'VETERANO',
    patterns: [
      { twos: 4, threes: 4, bombs: 8 },
      { twos: 5, threes: 3, bombs: 7 },
      { twos: 6, threes: 2, bombs: 8 },
      { twos: 3, threes: 5, bombs: 8 },
      { twos: 4, threes: 3, bombs: 9 },
    ],
    noBombRow: false,
  },
  {
    id: 4, name: 'DURO',
    patterns: [
      { twos: 4, threes: 4, bombs: 8 },
      { twos: 3, threes: 5, bombs: 9 },
      { twos: 5, threes: 3, bombs: 9 },
      { twos: 6, threes: 2, bombs: 10 },
      { twos: 4, threes: 3, bombs: 10 },
    ],
    noBombRow: false,
  },
  {
    id: 5, name: 'INFIERNO',
    patterns: [
      { twos: 4, threes: 4, bombs: 10 },
      { twos: 5, threes: 3, bombs: 10 },
      { twos: 3, threes: 5, bombs: 10 },
      { twos: 6, threes: 2, bombs: 10 },
      { twos: 4, threes: 3, bombs: 10 },
    ],
    noBombRow: false,
  },
  {
    id: 6, name: 'PESADILLA',
    patterns: [
      { twos: 4, threes: 4, bombs: 10 },
      { twos: 3, threes: 5, bombs: 10 },
      { twos: 5, threes: 3, bombs: 10 },
      { twos: 2, threes: 6, bombs: 10 },
      { twos: 6, threes: 1, bombs: 11 },
    ],
    noBombRow: false,
  },
  {
    id: 7, name: 'IMPOSIBLE',
    patterns: [
      { twos: 3, threes: 4, bombs: 11 },
      { twos: 4, threes: 3, bombs: 12 },
      { twos: 2, threes: 5, bombs: 10 },
      { twos: 5, threes: 2, bombs: 13 },
      { twos: 3, threes: 4, bombs: 10 },
    ],
    noBombRow: false,
  },
  {
    id: 8, name: 'LEYENDA',
    patterns: [
      { twos: 3, threes: 7, bombs: 10 },
      { twos: 2, threes: 8, bombs: 10 },
      { twos: 4, threes: 6, bombs: 10 },
      { twos: 1, threes: 9, bombs: 10 },
      { twos: 5, threes: 5, bombs: 10 },
    ],
    noBombRow: false,
  },
];

// Escala los patrones a un tamaño de tablero dado
export function getLevelsForSize(gridSize) {
  if (gridSize === 5) return LEVELS_5X5;
  const ratio = (gridSize * gridSize) / 25;
  const ceil = gridSize * gridSize;
  return LEVELS_5X5.map(lv => ({
    ...lv,
    patterns: lv.patterns.map(p => {
      const twos = Math.max(1, Math.round(p.twos * ratio));
      const threes = Math.max(1, Math.round(p.threes * ratio));
      const bombs = Math.min(ceil - twos - threes, Math.round(p.bombs * ratio));
      return { twos, threes, bombs };
    }),
  }));
}

let _cachedLevels = null;
let _cachedSize = 5;

export function setActiveLevels(size) {
  if (size !== _cachedSize) {
    _cachedLevels = null;
    _cachedSize = size;
  }
}

export function getActiveLevels(size) {
  if (!_cachedLevels || _cachedSize !== size) {
    _cachedLevels = getLevelsForSize(size);
    _cachedSize = size;
  }
  return _cachedLevels;
}

// Referencia por defecto (5×5)
export const LEVELS = LEVELS_5X5;

// Multi color gradient map: value → HSL hue
export function multiColor(value) {
  // ×1 → azul frío (210°), ×3 → verde (130°), ×6 → ámbar (42°), ×10 → naranja (25°), ×15 → rojo (5°)
  const t = Math.min((value - 1) / 14, 1); // 1→0, 15→1
  const hue = 210 - t * 205; // 210 → 5
  const sat = 70 + t * 30;   // 70 → 100
  const lit = 45 + t * 5;     // 45 → 50
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

export const SHIELD_COST = 300;
export const SHIELDS_PER_FREE = 3; // pantallas completadas por seguro gratis

export const TITLE_THRESHOLDS = [
  { min: 0, name: 'Aprendiz' },
  { min: 400, name: 'Técnico' },
  { min: 1500, name: 'Artesano' },
  { min: 4000, name: 'Maestro' },
  { min: 10000, name: 'Leyenda' },
];

export const DEFAULT_COLLECTION = {
  owned: [],
  theme: 'taller',
  skin: 'clasico',
  boardSize: DEFAULT_BOARD_SIZE,
  cardBack: DEFAULT_CARD_BACK,
  shields: 0,
  trophies: [],
  shieldProgress: 0,
};

export const DEFAULT_STATS = {
  screensWon: 0,
  bombsHit: 0,
  bestLevel: 1,
  streak: 0,
  bestStreak: 0,
  gamesPlayed: 0,
  totalRendirse: 0,
  shieldsUsed: 0,
  totalCoinsEarned: 0,
  highestMulti: 0,
  screensWithoutMemo: 0,
  screensRevealingNoOnes: 0,
  rendirseOver100: false,
  allMedals: false,
};