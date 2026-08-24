// logic.js — Generación de tableros y lógica pura (sin DOM)
import { getActiveLevels } from './config.js';

// ─── Grid-size-aware helpers ───
let currentGridSize = 5;

export function setGridSize(size) { currentGridSize = size; }
export function getGridSize() { return currentGridSize; }

function S() { return currentGridSize; }
function N() { return S() * S(); }

// Fisher-Yates shuffle con RNG inyectable
export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Genera el contenido de S² casillas: 0 = shock, 1/2/3 = valores
export function generateBoard(levelId, rng = Math.random) {
  const levels = getActiveLevels(S());
  const level = levels[levelId - 1];
  if (!level) throw new Error('Nivel inválido: ' + levelId);
  const pattern = level.patterns[Math.floor(rng() * level.patterns.length)];
  return placePattern(pattern, level, rng);
}

function placePattern(pattern, level, rng) {
  const { twos, threes, bombs } = pattern;
  const n = N();
  const total = twos + threes + bombs;
  if (total > n) throw new Error('Patrón excede ' + n + ' casillas');

  const cells = [];
  for (let i = 0; i < bombs; i++) cells.push(0);
  for (let i = 0; i < twos; i++) cells.push(2);
  for (let i = 0; i < threes; i++) cells.push(3);
  while (cells.length < n) cells.push(1);

  let board = shuffle(cells, rng);

  // Garantía de fila sin bombas en pantallas 1-2 (hasta 120 intentos)
  if (level.noBombRow) {
    for (let attempt = 0; attempt < 120; attempt++) {
      if (hasNoBombRow(board)) break;
      board = shuffle(cells, rng);
    }
    // Plan B: intercambiar una bomba por un número de otra fila
    if (!hasNoBombRow(board)) {
      board = swapForNoBombRow(board, rng);
    }
  }
  return board;
}

export function hasNoBombRow(board) {
  const s = S();
  for (let row = 0; row < s; row++) {
    let bombs = 0;
    for (let col = 0; col < s; col++) {
      if (board[row * s + col] === 0) bombs++;
    }
    if (bombs === 0) return true;
  }
  return false;
}

// Plan B: busca una bomba y un número en otra fila para intercambiar
function swapForNoBombRow(board, rng) {
  const s = S();
  const n = N();
  const b = board.slice();
  // Encontrar la fila con menos bombas
  let bestRow = 0, minBombs = Infinity;
  for (let row = 0; row < s; row++) {
    let count = 0;
    for (let col = 0; col < s; col++) if (b[row * s + col] === 0) count++;
    if (count < minBombs) { minBombs = count; bestRow = row; }
  }
  if (minBombs === 0) return b;
  const bombIdx = [];
  for (let col = 0; col < s; col++) if (b[bestRow * s + col] === 0) bombIdx.push(bestRow * s + col);
  const numIdx = [];
  for (let i = 0; i < n; i++) {
    if (b[i] !== 0 && Math.floor(i / s) !== bestRow) numIdx.push(i);
  }
  if (bombIdx.length && numIdx.length) {
    const bi = bombIdx[Math.floor(rng() * bombIdx.length)];
    const ni = numIdx[Math.floor(rng() * numIdx.length)];
    [b[bi], b[ni]] = [b[ni], b[bi]];
  }
  return b;
}

// ─── Pistas (MULTI y SHOCKS) ───
export function lineMulti(line) {
  let sum = 0;
  for (const v of line) sum += v;
  return sum;
}

export function lineBombs(line) {
  return line.filter(v => v === 0).length;
}

export function computeHints(board) {
  const s = S();
  const rows = [], cols = [];
  for (let r = 0; r < s; r++) {
    const line = board.slice(r * s, r * s + s);
    rows.push({ multi: lineMulti(line), bombs: lineBombs(line) });
  }
  for (let c = 0; c < s; c++) {
    const line = [];
    for (let r = 0; r < s; r++) line.push(board[r * s + c]);
    cols.push({ multi: lineMulti(line), bombs: lineBombs(line) });
  }
  return { rows, cols };
}

// ─── Estado de pistas durante la partida ───
// Una línea está "resuelta" si todas sus casillas ocultas son bombas.
// Una línea está "muerta" si ya no quedan 2 ni 3 ocultos.
// ✓ si está completamente revelada.
export function lineStatus(line, revealed) {
  const cells = line.map((v, i) => ({ v, rev: revealed[i] }));
  const allRevealed = cells.every(c => c.rev);
  if (allRevealed) return 'done';
  const hidden = cells.filter(c => !c.rev);
  const hiddenAllBombs = hidden.every(c => c.v === 0);
  if (hiddenAllBombs) return 'resolved';
  const hiddenHasMulti = hidden.some(c => c.v >= 2);
  if (!hiddenHasMulti) return 'dead';
  return 'active';
}

// ─── Revelar una casilla ───
export function revealCell(board, revealed, idx) {
  const val = board[idx];
  revealed[idx] = true;
  return val;
}

// ─── Condición de victoria: todas las casillas 2 y 3 reveladas ───
export function countMultipliers(board) {
  return board.filter(v => v >= 2).length;
}

export function countRevealedMultipliers(board, revealed) {
  let count = 0;
  for (let i = 0; i < board.length; i++) {
    if (revealed[i] && board[i] >= 2) count++;
  }
  return count;
}

export function isWin(board, revealed) {
  return countRevealedMultipliers(board, revealed) === countMultipliers(board);
}

// ─── Puntuación multiplicativa ───
export function applyScore(score, value) {
  if (score === 0) return value;
  if (value > 1) return score * value;
  return score;
}

// ─── Economía: monedas ganadas por pantalla ───
// Base por pantalla + bonus según multiplicador final.
export function coinsForScreen(levelId, finalMulti) {
  const base = 5 + levelId * 3; // 8..29
  return Math.round(base + finalMulti * 1.5);
}