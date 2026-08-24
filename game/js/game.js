// game.js — Controlador principal: UI, flujo del juego, HUD, taller
import * as Logic from './logic.js';
import * as Audio from './audio.js';
import * as Particles from './particles.js';
import * as Haptic from './haptic.js';
import { celebrateTrophy, purchaseMedal } from './rarity.js';
import {
  KEYS, LEVELS, SHIELD_COST, SHIELDS_PER_FREE, multiColor, DEFAULT_COLLECTION, DEFAULT_STATS,
  BOARD_SIZES, DEFAULT_BOARD_SIZE, CARD_BACK_PATTERNS, DEFAULT_CARD_BACK,
} from './config.js';
import {
  loadCoins, saveCoins, loadCollection, saveCollection,
  loadStats, saveStats, loadSound, saveSound, loadHaptics, saveHaptics, loadMusic, saveMusic, loadMusicOn, saveMusicOn,
  loadTheme, saveTheme,
  checkTrophies, ShieldManager, THEMES, SKINS, MEDALS, getTitle, isUnlocked,
  TROPHIES, TROPHY_TIERS,
} from './collection.js';

// ─── Estado global ───
let state = {
  screen: 'welcome',     // welcome | game | workshop | howtoplay | victory | defeat | final | cashout
  board: [],             // 25 valores
  revealed: [],          // 25 booleans
  hints: { rows: [], cols: [] },
  level: 1,              // pantalla actual (1-8)
  runCoins: 0,           // monedas de la racha actual
  score: 0,              // multiplicador actual
  target: 0,             // cuántos multiplicadores hay que revelar
  found: 0,              // cuántos se han revelado
  memoMode: false,
  marks: [],             // 25 marcas: 0=nada, 1=shock, 2=1, 3=2, 4=3
  bankCoins: 0,
  collection: null,
  stats: null,
  soundOn: true,
  hapticsOn: true,
  musicOn: false,
  themeMode: 'auto',    // 'auto' | 'dark' | 'light'
  darkTheme: true,      // booleano resuelto (resultado final)
  shieldMgr: new ShieldManager(),
  hasWonScreen: false,
  usedShieldThisScreen: false,
  revealedOnesThisScreen: false,
  hasUsedMemo: false,
  startValue: 0,         // valor con el que empezó la pantalla
  rendirseStage: 0,      // 0=nada, 1=confirmar, 2=listo para cobrar
  salirStage: 0,
  boardSize: DEFAULT_BOARD_SIZE,
};

let dom = {};
let trophyQueue = [];
let fuseInterval = null;
let screenTransitionTimer = null;
let trophyFilter = 'all';
const SCREEN_TRANSITION_MS = 280;

// ─── Inicialización ───
export function init() {
  dom = {
    app: document.getElementById('app'),
    hudLevel: document.getElementById('hud-level'),
    hudBank: document.getElementById('hud-bank'),
    hudRun: document.getElementById('hud-run'),
    hudMult: document.getElementById('hud-mult'),
    boardArea: document.getElementById('board-area'),
    statusBar: document.getElementById('status-bar'),
    btnMemo: document.getElementById('btn-memo'),
    btnShield: document.getElementById('btn-shield'),
    btnRendirse: document.getElementById('btn-rendirse'),
    btnSalir: document.getElementById('btn-salir'),
    btnSonidoGame: document.getElementById('btn-sonido-game'),
    btnHapticsGame: document.getElementById('btn-haptics-game'),
    btnOpciones: document.getElementById('btn-opciones'),
    btnReiniciar: document.getElementById('btn-reiniciar'),
    btnJugar: document.getElementById('btn-jugar'),
    btnTaller: document.getElementById('btn-taller'),
    btnComoJugar: document.getElementById('btn-como-jugar'),
    overlay: document.getElementById('overlay'),
    overlayTitle: document.getElementById('overlay-title'),
    overlayBody: document.getElementById('overlay-body'),
    overlayBtn1: document.getElementById('overlay-btn1'),
    overlayBtn2: document.getElementById('overlay-btn2'),
    trophyAlert: document.getElementById('trophy-alert'),
    flash: document.getElementById('flash'),
    workshopContent: document.getElementById('workshop-content'),
    workshopBank: document.getElementById('workshop-bank'),
    workshopTitle: document.getElementById('workshop-title'),
    workshopBack: document.getElementById('workshop-back'),
    howtoplayContent: document.getElementById('howtoplay'),
    bankWelcome: document.getElementById('bank-welcome'),
    rankWelcome: document.getElementById('rank-welcome'),
    statsOverlay: document.getElementById('stats-overlay'),
    statsBody: document.getElementById('stats-body'),
    statsClose: document.getElementById('stats-close'),
    themeToggle: document.getElementById('theme-toggle'),
  };

  // Cargar persistencia
  state.bankCoins = loadCoins();
  state.collection = loadCollection();
  state.stats = loadStats();
  state.soundOn = loadSound();
  state.hapticsOn = loadHaptics();
  Haptic.setEnabled(state.hapticsOn);
  state.themeMode = loadTheme();
  state.darkTheme = resolveTheme(state.themeMode);
  bindSystemTheme();
  state.boardSize = state.collection.boardSize || DEFAULT_BOARD_SIZE;
  state.cardBack = state.collection.cardBack || DEFAULT_CARD_BACK;
  Logic.setGridSize(state.boardSize);
  applyThemeDOM();
  applyCardBack(state.cardBack);
  state.musicOn = loadMusicOn();
  applyThemeDOM();
  Audio.initAudio();
  Audio.setSound(state.soundOn);
  Audio.setTrack(loadMusic());
  Audio.setMusic(state.musicOn);
  Particles.initParticles();

  // Shield manager state
  state.shieldMgr = new ShieldManager();
  state.shieldMgr.armed = false;

  applyThemeDOM();

  updateHUD();
  renderWelcome();

  // Eventos globales
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeOverlay(); hideStats(); hideTrophies(); }
    if (e.key === 'm' || e.key === 'M') toggleMemo();
    if (e.key === 's' || e.key === 'S') {
      if (state.screen === 'game') toggleShield();
    }
  });

  // Botones de bienvenida
  dom.btnJugar?.addEventListener('click', () => startGame());
  dom.btnTaller?.addEventListener('click', () => showWorkshop());
  dom.btnComoJugar?.addEventListener('click', () => showHowToPlay());
  dom.btnOpciones?.addEventListener('click', () => showScreen('options'));

  // Opciones
  document.getElementById('options-back')?.addEventListener('click', () => showScreen('welcome'));

  // Taller
  dom.workshopBack?.addEventListener('click', () => showScreen('welcome'));
  document.getElementById('trophies-back')?.addEventListener('click', () => showScreen('welcome'));
  dom.statsClose?.addEventListener('click', hideStats);
  dom.statsOverlay?.addEventListener('click', e => { if (e.target === dom.statsOverlay) hideStats(); });

  // Overlay botones
  dom.overlayBtn1?.addEventListener('click', () => handleOverlay(1));
  dom.overlayBtn2?.addEventListener('click', () => handleOverlay(2));

  updateSoundBtn();
  updateMusicBtn();
  updateShieldBtn();
}

// ─── Navegación de pantallas ───
const SCREEN_ELEMENTS = {
  welcome: 'welcome-section',
  game: 'game-section',
  workshop: 'workshop-section',
  howtoplay: 'howtoplay-section',
  trophies: 'trophies-section',
  options: 'options-section',
};

function showScreen(name) {
  if (name !== 'welcome') stopFuseSparks();

  const targetId = SCREEN_ELEMENTS[name];
  if (!targetId) return;
  const targetEl = document.getElementById(targetId);
  if (!targetEl) return;

  const currentId = SCREEN_ELEMENTS[state.screen];
  const currentEl = currentId ? document.getElementById(currentId) : null;

  // Already fully on this screen → no-op
  if (state.screen === name && currentEl && currentEl.style.display !== 'none') {
    return;
  }

  // Cancel any pending hide from a previous transition
  if (screenTransitionTimer) { clearTimeout(screenTransitionTimer); screenTransitionTimer = null; }

  // Close overlays immediately
  dom.overlay?.classList.add('hidden');
  dom.trophyAlert?.classList.add('hidden');
  dom.flash?.classList.remove('active');

  // Fade out current screen
  if (currentEl && currentEl !== targetEl) {
    currentEl.classList.remove('screen-enter');
    currentEl.classList.add('screen-leave');
    currentEl.style.pointerEvents = 'none';
    const el = currentEl;
    screenTransitionTimer = setTimeout(() => {
      el.style.display = 'none';
      el.classList.remove('screen-leave');
      el.style.pointerEvents = '';
    }, SCREEN_TRANSITION_MS);
  }

  // Fade in target screen
  const display = (name === 'welcome' || name === 'game' || name === 'howtoplay') ? 'flex' : 'block';
  targetEl.classList.remove('screen-leave');
  targetEl.style.display = display;
  targetEl.style.pointerEvents = 'none';
  // Restart the enter animation
  targetEl.classList.remove('screen-enter');
  void targetEl.offsetWidth;
  targetEl.classList.add('screen-enter');
  setTimeout(() => { targetEl.style.pointerEvents = ''; }, SCREEN_TRANSITION_MS);

  state.screen = name;

  // Música contextual: pista de menú en pantallas de inicio, pista de partida al jugar
  Audio.setMusicContext(name === 'game' ? 'game' : 'menu');

  // Post-transition setup
  if (name === 'workshop') renderWorkshop();
  if (name === 'trophies') renderTrophies();
  if (name === 'options') renderOptions();
  if (name === 'welcome' || name === 'game') updateHUD();
}

// ─── HUD ───
function updateHUD() {
  const title = getTitle(state.bankCoins);
  if (dom.hudLevel) dom.hudLevel.textContent = state.level;
  if (dom.hudBank) dom.hudBank.textContent = `${state.bankCoins} (${title})`;
  if (dom.hudRun) dom.hudRun.textContent = state.runCoins;
  if (dom.hudMult) dom.hudMult.textContent = state.score > 0 ? `×${state.score}` : '—';
  if (dom.bankWelcome) dom.bankWelcome.textContent = state.bankCoins;
  if (dom.rankWelcome) dom.rankWelcome.textContent = title;
  updateSoundBtn();
  updateShieldBtn();
}

function updateSoundBtn() {
  if (dom.btnSonidoGame) dom.btnSonidoGame.innerHTML = state.soundOn ? svg_sound_on : svg_sound_off;
  updateHapticsBtn();
}

function updateHapticsBtn() {
  const el = dom.btnHapticsGame;
  if (!el) return;
  el.innerHTML = state.hapticsOn ? svg_haptics_on : svg_haptics_off;
  el.classList.toggle('hud-haptics-off', !state.hapticsOn);
  el.setAttribute('aria-pressed', String(state.hapticsOn));
  el.title = state.hapticsOn ? 'Desactivar vibración' : 'Activar vibración';
}

function updateMusicBtn() {
  // La música se muestra en la pantalla de opciones y el taller
}

// ─── Botón AISLANTE ───
function updateShieldBtn() {
  if (!dom.btnShield) return;
  const shields = state.collection?.shields || 0;
  const armed = state.shieldMgr?.armed;
  dom.btnShield.textContent = `🛡️ AISLANTE (${shields})`;
  dom.btnShield.className = 'btn shield-btn';
  if (shields <= 0 && !armed) dom.btnShield.classList.add('shield-empty');
  else if (!armed) dom.btnShield.classList.add('shield-pulse');
  else dom.btnShield.classList.add('shield-armed');
}

function toggleShield() {
  if (!state.shieldMgr) return;
  const shields = state.collection?.shields || 0;
  if (state.shieldMgr.armed) {
    state.shieldMgr.armed = false;
    Audio.sfx('click');
  } else if (shields > 0) {
    state.shieldMgr.armed = true;
    Audio.sfx('shield');
  } else {
    Audio.sfx('deny');
  }
  updateShieldBtn();
}

// ─── Iniciar partida ───
function startGame() {
  stopFuseSparks();
  state.level = 1;
  state.runCoins = 0;
  state.score = 0;
  state.shieldMgr.armed = false;
  state.rendirseStage = 0;
  state.salirStage = 0;
  state.hasWonScreen = false;
  state.usedShieldThisScreen = false;
  state.hasUsedMemo = false;
  state.startValue = 0;
  state.trophiesToShow = [];
  generateScreen();
  showScreen('game');
  Audio.sfx('click');
}

function generateScreen() {
  Logic.setGridSize(state.boardSize);
  const board = Logic.generateBoard(state.level);
  state.board = board;
  const n = board.length;
  state.revealed = new Array(n).fill(false);
  state.marks = new Array(n).fill(0);
  state.hints = Logic.computeHints(board);
  state.target = Logic.countMultipliers(board);
  state.found = 0;
  state.score = 0;
  state.usedShieldThisScreen = false;
  state.revealedOnesThisScreen = false;
  state.startValue = 0;
  state.rendirseStage = 0;
  state.salirStage = 0;
  renderBoard();
  updateStatusBar();
  updateHUD();
}

// ─── Renderizar tablero ───
function renderBoard() {
  if (!dom.boardArea) return;
  const area = dom.boardArea;
  const s = state.boardSize;
  area.innerHTML = '';
  area.className = 'board-grid';
  area.style.gridTemplateColumns = `44px repeat(${s}, 1fr)`;
  area.style.gridTemplateRows = `44px repeat(${s}, 1fr)`;
  area.dataset.size = s;
  area.setAttribute('aria-label', `Tablero de juego ${s} por ${s}`);

  // Esquina
  const corner = document.createElement('div');
  corner.className = 'board-corner';
  corner.innerHTML = svg_shock_icon;
  area.appendChild(corner);

  // Pistas de columna
  for (let c = 0; c < s; c++) {
    const hint = state.hints.cols[c];
    const el = document.createElement('div');
    el.className = 'board-hint col-hint';
    el.innerHTML = `<span class="hint-multi" style="color:${multiColor(hint.multi)}">×${hint.multi}</span><span class="hint-bombs">⚡${hint.bombs}</span>`;
    el.addEventListener('click', () => highlightColumn(c));
    hintLineStyle(el, c, 'col');
    area.appendChild(el);
  }

  for (let r = 0; r < s; r++) {
    // Pista de fila
    const hint = state.hints.rows[r];
    const rowHint = document.createElement('div');
    rowHint.className = 'board-hint row-hint';
    rowHint.innerHTML = `<span class="hint-multi" style="color:${multiColor(hint.multi)}">×${hint.multi}</span><span class="hint-bombs">⚡${hint.bombs}</span>`;
    rowHint.addEventListener('click', () => highlightRow(r));
    hintLineStyle(rowHint, r, 'row');
    area.appendChild(rowHint);

    // Casillas
    for (let c = 0; c < s; c++) {
      const idx = r * s + c;
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.idx = idx;
      if (state.revealed[idx]) {
        cell.classList.add('revealed');
        const val = state.board[idx];
        if (val === 0) {
          cell.classList.add('bomb');
          cell.classList.add('shock');
          cell.innerHTML = svg_shock_icon;
        } else if (val === 1) {
          cell.classList.add('val1');
          cell.innerHTML = '<span class="cell-value">1</span>';
        } else if (val === 2) {
          cell.classList.add('val2');
          cell.innerHTML = '<span class="cell-value">2</span>';
        } else if (val === 3) {
          cell.classList.add('val3');
          cell.innerHTML = '<span class="cell-value">3</span>';
        }
      } else {
        cell.classList.add('hidden');
        // Marcas MEMO
        if (state.marks[idx] > 0) {
          const mark = state.marks[idx];
          cell.innerHTML = marksHTML(mark);
          cell.classList.add('marked');
        }
        cell.addEventListener('click', e => handleCellClick(idx, e));
        cell.addEventListener('contextmenu', e => {
          e.preventDefault();
          handleRightClick(idx);
        });
        // Long press (táctil)
        let longPressTimer = null;
        cell.addEventListener('touchstart', () => {
          longPressTimer = setTimeout(() => {
            handleRightClick(idx);
            longPressTimer = null;
          }, 420);
        });
        cell.addEventListener('touchend', () => {
          if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        });
        cell.addEventListener('touchmove', () => {
          if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        });
      }
      area.appendChild(cell);
    }
  }

  updateRendirseBtn();
  updateShieldBtn();
}

function hintLineStyle(el, idx, type) {
  const s = state.boardSize;
  let line = type === 'row' ? state.board.slice(idx * s, idx * s + s) : [];
  if (type === 'col') {
    line = [];
    for (let r = 0; r < s; r++) line.push(state.board[r * s + idx]);
  }
  const revealed = [];
  for (let i = 0; i < s; i++) {
    const ri = type === 'row' ? idx * s + i : i * s + idx;
    revealed.push(state.revealed[ri]);
  }
  const status = Logic.lineStatus(line, revealed);
  if (status === 'resolved') el.classList.add('hint-resolved');
  else if (status === 'done') el.classList.add('hint-done');
  else if (status === 'dead') el.classList.add('hint-dead');
}

// SVG compacto de núcleo eléctrico para la marca de MEMO (sin IDs para evitar colisiones)
const svg_mark_shock = `<svg class="mark-shock-icon" viewBox="0 0 24 24" width="15" height="15" fill="none"><circle cx="12" cy="13" r="8.5" fill="#5a4a00" stroke="#fff200" stroke-width="1"/><path d="M12 5.5 L10 10 L12 11 L9 14.5 L13.5 8.5 L11.5 9.5 L13 5.5Z" fill="#fff200"/><circle cx="12" cy="13" r="2" fill="#fff" opacity="0.2"/><rect x="11" y="3" width="2" height="3" rx="0.5" fill="#aaa"/><circle cx="12" cy="3" r="2" fill="#ccc"/></svg>`;

function marksHTML(mark) {
  const marks = [];
  if (mark & 1) marks.push(`<span class="mark mark-tl mark-shock-mark">${svg_mark_shock}</span>`);
  if (mark & 2) marks.push('<span class="mark mark-tr mark-num mark-num-1">1</span>');
  if (mark & 4) marks.push('<span class="mark mark-bl mark-num mark-num-2">2</span>');
  if (mark & 8) marks.push('<span class="mark mark-br mark-num mark-num-3">3</span>');
  return marks.join('');
}

// ─── Interacción con casillas ───
function handleCellClick(idx, e) {
  if (state.revealed[idx]) return;

  // Flash visual de presión
  const cellEl = dom.boardArea?.querySelector(`[data-idx="${idx}"]`);
  if (cellEl) {
    cellEl.classList.add('press-flash');
    setTimeout(() => cellEl.classList.remove('press-flash'), 350);
  }

  if (state.memoMode) {
    cycleMark(idx);
    return;
  }
  reveal(idx);
}

function handleRightClick(idx) {
  if (state.revealed[idx]) return;
  removeMark(idx);
  renderBoard();
}

function cycleMark(idx) {
  state.hasUsedMemo = true;
  // Ciclo exclusivo: nada → bomba → 1 → 2 → 3 → nada
  const CYCLE = [0, 1, 2, 4, 8];
  const pos = CYCLE.indexOf(state.marks[idx]);
  state.marks[idx] = CYCLE[(pos + 1) % CYCLE.length];
  Audio.sfx('click');
  Haptic.tick();
  renderBoard();
}

function removeMark(idx) {
  state.marks[idx] = 0;
  renderBoard();
}

// ─── Revelar casilla ───
function reveal(idx) {
  const val = Logic.revealCell(state.board, state.revealed, idx);
  state.revealed[idx] = true;

  const cellEl = dom.boardArea?.querySelector(`[data-idx="${idx}"]`);
  const rect = cellEl?.getBoundingClientRect();
  const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

  if (val === 0) {
    // Bomba
    if (state.shieldMgr?.armed) {
      // Seguro salva
      state.shieldMgr.consume(state.collection);
      state.usedShieldThisScreen = true;
      Audio.sfx('shield');
      Particles.shieldParticles(cx, cy);
      // Update cell in-place for animation
      patchCellDOM(idx, val, cellEl);
      refreshHints();
      updateShieldBtn();
    } else {
      Audio.sfx('bomb');
      Particles.explodeBomb(cx, cy);
      Haptic.tick();
      state.stats.bombsHit++;
      state.stats.gamesPlayed = Math.max(state.stats.gamesPlayed, 1);
      state.stats.streak = 0;
      state.runCoins = 0;
      saveStats(state.stats);
      saveCollection(state.collection);
      // Full re-render to show bomb state
      renderBoard();
      const revealedCount = state.revealed.filter(Boolean).length;
      if (revealedCount < state.level) {
        state.level = Math.max(1, revealedCount);
      }
      showOverlayDefeat();
      return;
    }
  } else {
    // Número — update in-place for smooth animation
    patchCellDOM(idx, val, cellEl);
    refreshHints();

    state.found = Logic.countRevealedMultipliers(state.board, state.revealed);
    if (state.score === 0) {
      state.score = val;
      state.startValue = val;
    } else {
      state.score = Logic.applyScore(state.score, val);
    }
    state.runCoins = Logic.coinsForScreen(state.level, state.score);

    if (val === 1) {
      state.revealedOnesThisScreen = true;
      Audio.sfx('reveal1');
      Haptic.tick();
    } else if (val === 2) {
      Audio.sfx('reveal2');
      Particles.explodeMultiplier(cx, cy);
      Haptic.tick();
    } else {
      Audio.sfx('reveal3');
      Particles.explodeMultiplier(cx, cy);
      Haptic.tick();
    }

    if (state.score > state.stats.highestMulti) state.stats.highestMulti = state.score;

    updateStatusBar();
    updateHUD();

    if (Logic.isWin(state.board, state.revealed)) {
      handleWin();
    }
  }
}

// Patch a single cell DOM element in-place (no full re-render).
// Uses the Web Animations API for reliable cross-browser animation.
function patchCellDOM(idx, val, cellEl) {
  if (!cellEl) return;
  // Remove hidden state and marks
  cellEl.classList.remove('hidden', 'marked', 'press-flash');
  cellEl.innerHTML = '';

  if (val === 0) {
    cellEl.classList.add('revealed', 'shock');
    cellEl.innerHTML = svg_shock_icon;
  } else if (val === 1) {
    cellEl.classList.add('revealed', 'val1');
    cellEl.innerHTML = '<span class="cell-value">1</span>';
  } else if (val === 2) {
    cellEl.classList.add('revealed', 'val2');
    cellEl.innerHTML = '<span class="cell-value">2</span>';
  } else {
    cellEl.classList.add('revealed', 'val3');
    cellEl.innerHTML = '<span class="cell-value">3</span>';
  }

  // Run reveal animation via Web Animations API (reliable, no reflow tricks needed)
  cellEl.animate([
    { transform: 'scale(0.3)', opacity: 0, offset: 0 },
    { transform: 'scale(1.08)', opacity: 1, offset: 0.55 },
    { transform: 'scale(0.94)', opacity: 1, offset: 0.75 },
    { transform: 'scale(1)',   opacity: 1, offset: 1 }
  ], {
    duration: 380,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    fill: 'forwards'
  });
}

// Refresh hint line styles without rebuilding cells
function refreshHints() {
  const hints = dom.boardArea?.querySelectorAll('.board-hint');
  if (!hints) return;
  const s = state.boardSize;
  hints.forEach(el => {
    el.classList.remove('hint-resolved', 'hint-done', 'hint-dead');
  });
  // Re-apply to each hint
  for (let c = 0; c < s; c++) {
    hintLineStyle(hints[c], c, 'col');
  }
  for (let r = 0; r < s; r++) {
    hintLineStyle(hints[s + r], r, 'row');
  }
}

// ─── Victoria ───
function handleWin() {
  Audio.sfx('win');
  Particles.confetti(window.innerWidth / 2, window.innerHeight / 2);
  state.hasWonScreen = true;
  state.stats.screensWon++;
  state.stats.streak++;
  if (state.stats.streak > state.stats.bestStreak) state.stats.bestStreak = state.stats.streak;
  if (state.level > state.stats.bestLevel) state.stats.bestLevel = state.level;
  if (!state.hasUsedMemo) state.stats.screensWithoutMemo++;
  if (!state.revealedOnesThisScreen) state.stats.screensRevealingNoOnes++;
  if (state.startValue === 1) state.stats.startWith1 = true;
  if (state.startValue === 2) state.stats.startWith2 = true;
  if (state.startValue === 3) state.stats.startWith3 = true;
  if (state.usedShieldThisScreen) state.stats.shieldsUsed++;

  // Seguro gratis cada 3 pantallas
  state.shieldMgr.addFreeShield(state.collection);

  // Trofeos
  const newTrophies = checkTrophies(state.stats, state.bankCoins, state.collection);
  for (const t of newTrophies) {
    state.collection.trophies.push(t.id);
    queueTrophy(t);
  }

  saveStats(state.stats);
  saveCollection(state.collection);

  if (state.level >= 8) {
    // Victoria final
    state.bankCoins += state.runCoins;
    saveCoins(state.bankCoins);
    state.runCoins = 0;
    saveCollection(state.collection);
    showOverlayFinal();
  } else {
    showOverlayWin();
  }
}

function queueTrophy(trophy) {
  trophyQueue.push(trophy);
  if (trophyQueue.length === 1) showNextTrophy();
}

function showNextTrophy() {
  if (trophyQueue.length === 0) return;
  const t = trophyQueue[0];
  const tier = TROPHY_TIERS[t.tier] || TROPHY_TIERS.bronze;
  dom.trophyAlert.innerHTML = `
    <div class="trophy-card tier-${t.tier}" style="--tier-color:${tier.color}">
      <div class="trophy-icon">${tier.icon}</div>
      <div class="trophy-name" style="color:${tier.color}">${t.name}</div>
      <div class="trophy-tier-label">${tier.label}</div>
      <div class="trophy-desc">${t.desc}</div>
    </div>`;
  dom.trophyAlert.classList.remove('hidden');
  dom.trophyAlert.classList.add('active');
  Audio.sfx('trophy');
  const rect = dom.trophyAlert.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  celebrateTrophy(t.tier, cx, cy, dom);

  setTimeout(() => {
    dom.trophyAlert.classList.remove('active');
    dom.trophyAlert.classList.add('hidden');
    trophyQueue.shift();
    setTimeout(() => showNextTrophy(), 300);
  }, 3200);
}

// ─── Overlays ───
function showOverlayWin() {
  dom.overlayTitle.textContent = `¡PANTALLA ${state.level} SUPERADA!`;
  dom.overlayBody.innerHTML = `
    <div class="overlay-coins">+${state.runCoins} 💰</div>
    <div class="overlay-mult">Multi ×${state.score}</div>
    <p style="color:#bfb3a0;text-align:center">Monedas en juego: ${state.runCoins}</p>`;
  dom.overlayBtn1.textContent = 'COBRAR';
  dom.overlayBtn1.className = 'btn primary';
  dom.overlayBtn2.textContent = 'SIGUIENTE';
  dom.overlayBtn2.className = 'btn gold';
  dom.overlay.dataset.action = 'win';
  dom.overlay.classList.remove('hidden');
  dom.flash.classList.add('active');
  Haptic.doublePulse();
  setTimeout(() => dom.flash.classList.remove('active'), 600);
}

function showOverlayDefeat() {
  dom.overlayTitle.textContent = '¡SHOCK! ⚡';
  dom.overlayBody.innerHTML = `
    <div class="overlay-shock">⚡ ¡SHOCK!</div>
    <p style="color:#bfb3a0;text-align:center">Las monedas de esta partida se pierden.</p>
    <p style="color:#bfb3a0;text-align:center">El banco está a salvo.</p>`;
  dom.overlayBtn1.textContent = 'MENÚ';
  dom.overlayBtn1.className = 'btn';
  dom.overlayBtn2.textContent = 'REINTENTAR';
  dom.overlayBtn2.className = 'btn primary';
  dom.overlay.dataset.action = 'defeat';
  dom.overlay.classList.remove('hidden');
}

function showOverlayFinal() {
  dom.overlayTitle.textContent = '🏆 ¡VICTORIA FINAL! 🏆';
  dom.overlayBody.innerHTML = `
    <div class="overlay-coins">+${state.runCoins} 💰 al banco</div>
    <p style="color:#ecc986;text-align:center;font-size:1.2em">¡Has completado todas las pantallas!</p>
    <p style="color:#bfb3a0;text-align:center">Rango: ${getTitle(state.bankCoins)}</p>`;
  dom.overlayBtn1.textContent = 'TALLER';
  dom.overlayBtn1.className = 'btn';
  dom.overlayBtn2.textContent = 'MENÚ';
  dom.overlayBtn2.className = 'btn primary';
  dom.overlay.dataset.action = 'final';
  dom.overlay.classList.remove('hidden');
  dom.flash.classList.add('active');
  setTimeout(() => dom.flash.classList.remove('active'), 800);
}

function showOverlayCashout() {
  dom.overlayTitle.textContent = '💸 ¡COBRADO!';
  dom.overlayBody.innerHTML = `
    <div class="overlay-coins">+${state.runCoins} 💰 al banco</div>
    <p style="color:#bfb3a0;text-align:center">Banco: ${state.bankCoins}</p>`;
  dom.overlayBtn1.textContent = '';
  dom.overlayBtn1.className = 'btn hidden-btn';
  dom.overlayBtn2.textContent = 'AL MENÚ';
  dom.overlayBtn2.className = 'btn primary';
  dom.overlay.dataset.action = 'cashout';
  dom.overlay.classList.remove('hidden');
  dom.flash.classList.add('active');
  setTimeout(() => dom.flash.classList.remove('active'), 600);
  Audio.sfx('cash');
  state.runCoins = 0;
}

function closeOverlay() {
  dom.overlay.classList.add('hidden');
  updateHUD();
}

function handleOverlay(n) {
  const action = dom.overlay.dataset.action;
  dom.overlay.classList.add('hidden');

  switch (action) {
    case 'win':
      if (n === 1) cashOut();  // COBRAR
      else nextScreen();        // SIGUIENTE
      break;
    case 'defeat':
      if (n === 1) showScreen('welcome');
      else startGame();
      break;
    case 'final':
      if (n === 1) showWorkshop();
      else showScreen('welcome');
      break;
    case 'cashout':
    case 'rendirse':
      showScreen('welcome');
      break;
    default: break;
  }
  updateHUD();
}

function nextScreen() {
  state.level++;
  state.shieldMgr.armed = false;
  generateScreen();
  updateHUD();
}

function cashOut() {
  Audio.sfx('cash');
  const earned = state.runCoins;
  state.bankCoins += earned;
  if (earned >= 100) state.stats.rendirseOver100 = true;
  state.stats.totalRendirse++;
  state.stats.totalCoinsEarned += earned;
  state.runCoins = 0;
  saveCoins(state.bankCoins);
  saveStats(state.stats);
  saveCollection(state.collection);
  Particles.confetti(window.innerWidth / 2, window.innerHeight / 2);
  showOverlayCashout();
}

function rendirse() {
  if (state.level <= 1 && state.runCoins <= 0) return;
  state.rendirseStage++;
  if (state.rendirseStage === 1) {
    dom.btnRendirse.textContent = '¿COBRAR?';
    dom.btnRendirse.classList.add('confirm-stage');
    setTimeout(() => {
      if (state.rendirseStage === 1) {
        state.rendirseStage = 0;
        updateRendirseBtn();
      }
    }, 3000);
  } else if (state.rendirseStage >= 2) {
    cashOut();
    state.rendirseStage = 0;
  }
}

function updateRendirseBtn() {
  if (!dom.btnRendirse) return;
  if (state.level <= 1 || state.hasWonScreen) {
    dom.btnRendirse.style.display = 'none';
  } else {
    dom.btnRendirse.style.display = '';
    dom.btnRendirse.textContent = 'RENDIRSE';
    dom.btnRendirse.classList.remove('confirm-stage');
    state.rendirseStage = 0;
  }
}

// Botón REINICIAR
function reiniciar() {
  state.runCoins = 0;
  state.score = 0;
  state.shieldMgr.armed = false;
  state.rendirseStage = 0;
  state.salirStage = 0;
  state.hasWonScreen = false;
  generateScreen();
  updateHUD();
  Audio.sfx('click');
}

// Botón SALIR
function salir() {
  state.salirStage++;
  if (state.salirStage === 1) {
    dom.btnSalir.textContent = '¿SEGURO?';
    dom.btnSalir.classList.add('confirm-stage');
    setTimeout(() => {
      if (state.salirStage === 1) {
        state.salirStage = 0;
        updateSalirBtn();
      }
    }, 3000);
  } else if (state.salirStage >= 2) {
    state.runCoins = 0;
    state.salirStage = 0;
    showScreen('welcome');
  }
}

function updateSalirBtn() {
  if (!dom.btnSalir) return;
  dom.btnSalir.textContent = 'SALIR';
  dom.btnSalir.classList.remove('confirm-stage');
  state.salirStage = 0;
}

function toggleMemo() {
  state.memoMode = !state.memoMode;
  if (dom.btnMemo) {
    dom.btnMemo.textContent = state.memoMode ? '✎ MEMO: 💣 1 2 3' : '✎ MEMO';
    dom.btnMemo.classList.toggle('memo-active', state.memoMode);
    dom.btnMemo.setAttribute('aria-pressed', state.memoMode);
  }
  state.hasUsedMemo = state.hasUsedMemo || state.memoMode;
  Audio.sfx('click');
  updateStatusBar();
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  Audio.setSound(state.soundOn);
  saveSound(state.soundOn);
  updateSoundBtn();
  Audio.sfx('click');
  if (state.screen === 'workshop') renderWorkshop();
  if (state.screen === 'options') renderOptions();
}

function toggleHaptics() {
  state.hapticsOn = !state.hapticsOn;
  Haptic.setEnabled(state.hapticsOn);
  saveHaptics(state.hapticsOn);
  updateHapticsBtn();
  Audio.sfx('click');
  // Pulso de prueba si se activa: el jugador siente inmediatamente la intensidad
  if (state.hapticsOn) Haptic.doublePulse();
  if (state.screen === 'workshop') renderWorkshop();
  if (state.screen === 'options') renderOptions();
}

// ─── Tema: modo (auto/dark/light) + resolución según el sistema ───
const systemDarkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function resolveTheme(mode) {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return systemDarkQuery ? systemDarkQuery.matches : true;
}

function bindSystemTheme() {
  if (!systemDarkQuery) return;
  const onChange = () => {
    if (state.themeMode !== 'auto') return;
    state.darkTheme = systemDarkQuery.matches;
    applyThemeDOM();
    applyTheme(state.collection?.theme || 'taller');
    applySkin(state.collection?.skin || 'clasico');
  };
  // API moderna y fallback antiguo
  if (typeof systemDarkQuery.addEventListener === 'function') {
    systemDarkQuery.addEventListener('change', onChange);
  } else if (typeof systemDarkQuery.addListener === 'function') {
    systemDarkQuery.addListener(onChange);
  }
}

function toggleTheme() {
  // Ciclo: dark → light → auto → dark
  if (state.themeMode === 'dark') state.themeMode = 'light';
  else if (state.themeMode === 'light') state.themeMode = 'auto';
  else state.themeMode = 'dark';
  state.darkTheme = resolveTheme(state.themeMode);
  saveTheme(state.themeMode);
  applyThemeDOM();
  applyTheme(state.collection?.theme || 'taller');
  applySkin(state.collection?.skin || 'clasico');
  Audio.sfx('click');
}

function applyThemeDOM() {
  document.documentElement.setAttribute('data-theme', state.darkTheme ? 'dark' : 'light');
  const lbl = dom.themeToggle?.querySelector('.theme-toggle-label');
  if (lbl) lbl.textContent = state.themeMode === 'auto' ? '🅰️' : (state.darkTheme ? '🌙' : '☀️');
  const track = dom.themeToggle?.querySelector('.theme-toggle-thumb');
  if (track) track.dataset.mode = state.themeMode;
}

// ─── Status bar ───
function updateStatusBar() {
  if (!dom.statusBar) return;
  const remaining = state.target - state.found;
  if (state.memoMode) {
    dom.statusBar.textContent = `✎ MEMO activo: toca para marcar 💣 → 1 → 2 → 3 → limpiar · Quedan ${remaining}`;
  } else {
    dom.statusBar.textContent = `Revela los multiplicadores · Quedan ${remaining}`;
  }
}

// ─── Highlight row/column ───
function highlightRow(r) {
  const cells = dom.boardArea?.querySelectorAll('.cell');
  if (!cells) return;
  const s = state.boardSize;
  cells.forEach(c => {
    const idx = parseInt(c.dataset.idx);
    c.classList.toggle('highlight-temp', Math.floor(idx / s) === r);
  });
  setTimeout(() => {
    cells.forEach(c => c.classList.remove('highlight-temp'));
  }, 800);
}

function highlightColumn(c) {
  const cells = dom.boardArea?.querySelectorAll('.cell');
  if (!cells) return;
  const s = state.boardSize;
  cells.forEach(cell => {
    const idx = parseInt(cell.dataset.idx);
    cell.classList.toggle('highlight-temp', idx % s === c);
  });
  setTimeout(() => {
    cells.forEach(cell => cell.classList.remove('highlight-temp'));
  }, 800);
}

// ─── Pantalla de bienvenida ───
function renderWelcome() {
  document.getElementById('welcome-section').style.display = 'flex';
  document.getElementById('game-section').style.display = 'none';
  if (dom.workshopContent) dom.workshopContent.parentElement.style.display = 'none';
  document.getElementById('howtoplay-section').style.display = 'none';
  updateHUD();
  startFuseSparks();
}

// ─── Logo fuse spark emitter ───
function getFusePosition() {
  const icon = document.querySelector('.logo-icon');
  if (!icon) return null;
  const rect = icon.getBoundingClientRect();
  // The SVG viewBox is "0 0 100 100", fuse tip is near (50, 2)
  // Scale factor: rect.width / 100
  const scale = rect.width / 100;
  return {
    x: rect.left + 50 * scale,
    y: rect.top + 2 * scale,
  };
}

function startFuseSparks() {
  stopFuseSparks();
  fuseInterval = setInterval(() => {
    const pos = getFusePosition();
    if (pos) Particles.fuseSparks(pos.x, pos.y);
  }, 180);
}

function stopFuseSparks() {
  if (fuseInterval) { clearInterval(fuseInterval); fuseInterval = null; }
}

// ─── Opciones ───
function renderOptions() {
  // Botón de sonido
  const soundBtn = document.getElementById('opt-sound');
  if (soundBtn) {
    soundBtn.textContent = state.soundOn ? '🔊 Activado' : '🔇 Silenciado';
    soundBtn.className = 'btn toggle-btn' + (state.soundOn ? ' toggle-on' : ' toggle-off');
    soundBtn.onclick = () => toggleSound();
  }

  // Botón de música
  const musicBtn = document.getElementById('opt-music');
  if (musicBtn) {
    musicBtn.textContent = state.musicOn ? '🎵 Activada' : '🔕 Silenciada';
    musicBtn.className = 'btn toggle-btn' + (state.musicOn ? ' toggle-on' : ' toggle-off');
    musicBtn.onclick = () => {
      state.musicOn = !state.musicOn;
      Audio.setMusic(state.musicOn);
      saveMusicOn(state.musicOn);
      renderOptions();
    };
  }

  // Botón de vibración
  const hapticsBtn = document.getElementById('opt-haptics');
  if (hapticsBtn) {
    hapticsBtn.textContent = state.hapticsOn ? '📳 Activada' : '🚫 Desactivada';
    hapticsBtn.className = 'btn toggle-btn' + (state.hapticsOn ? ' toggle-on' : ' toggle-off');
    hapticsBtn.onclick = () => toggleHaptics();
  }

  // Botones de tema
  document.querySelectorAll('.theme-opt-btn').forEach(btn => {
    const mode = btn.dataset.themeMode;
    const isActive = state.themeMode === mode;
    btn.classList.toggle('theme-active', isActive);
    if (isActive) btn.classList.add('primary');
    else btn.classList.remove('primary');
  });

  updateSoundBtn();
}

function setThemeMode(mode) {
  state.themeMode = mode;
  state.darkTheme = resolveTheme(mode);
  saveTheme(mode);
  applyThemeDOM();
  applyTheme(state.collection?.theme || 'taller');
  applySkin(state.collection?.skin || 'clasico');
  Audio.sfx('click');
  renderOptions();
}

// ─── Taller (tienda) ───
function showWorkshop() {
  showScreen('workshop');
}

function renderWorkshop() {
  if (!dom.workshopContent) return;
  state.bankCoins = loadCoins();
  state.collection = loadCollection();
  if (dom.workshopBank) dom.workshopBank.innerHTML = `<span class="coins-icon">🪙</span> ${state.bankCoins} <span class="coins-rank">${getTitle(state.bankCoins)}</span>`;
  if (dom.workshopTitle) dom.workshopTitle.textContent = 'TALLER';

  const themeId = state.collection.theme || 'taller';
  const skinId = state.collection.skin || 'clasico';

  const sections = [];

  // 7.1 Música
  sections.push(`<div class="shop-section"><h3>🎵 Música de partida</h3>`);
  sections.push(`<div class="shop-grid-2">`);
  const tracks = Audio.TRACKS;
  for (const [id, t] of Object.entries(tracks)) {
    const active = Audio.getTrack() === id;
    sections.push(`<button class="shop-btn ${active ? 'equipped' : ''}" data-action="music" data-id="${id}">${active ? '▶ ' : ''}${t.name}</button>`);
  }
  sections.push(`</div>`);
  sections.push(`<p class="shop-hint">Elige la pista que sonará durante las partidas. En el menú suena una melodía ambiental distinta.</p></div>`);

  // 7.1b Sonido y háptica
  sections.push(`<div class="shop-section"><h3>📳 Audio y vibración</h3>`);
  sections.push(`<div class="shop-grid-2">`);
  sections.push(`<button class="shop-btn ${state.soundOn ? 'equipped' : ''}" data-action="toggle-sound">${state.soundOn ? '🔊' : '🔇'} Sonido ${state.soundOn ? 'ON' : 'OFF'}</button>`);
  sections.push(`<button class="shop-btn ${state.hapticsOn ? 'equipped' : ''}" data-action="toggle-haptics">${state.hapticsOn ? '📳' : '🚫'} Vibrar ${state.hapticsOn ? 'ON' : 'OFF'}</button>`);
  sections.push(`</div>`);
  sections.push(`<p class="shop-hint">El sonido controla efectos y música. La vibración se siente al revelar casillas, sufrir shocks y ganar.</p></div>`);

  // 7.2 Temas de tablero
  sections.push(`<div class="shop-section"><h3>🎨 Temas de tablero</h3>`);
  for (const [id, theme] of Object.entries(THEMES)) {
    const unlocked = theme.locked ? isUnlocked(state.collection, theme) : true;
    const equipped = themeId === id;
    sections.push(`<button class="shop-btn ${equipped ? 'equipped' : ''} ${!unlocked ? 'locked' : ''}"
      data-action="equip-theme" data-id="${id}"
      ${!unlocked ? 'disabled' : ''}>
      ${equipped ? '✓ ' : ''}${theme.name}${!unlocked ? ' 🔒 (Pantalla 8)' : ''}
    </button>`);
  }
  sections.push(`</div>`);

  // 7.3 Dorsos
  sections.push(`<div class="shop-section"><h3>🃏 Dorsos de carta</h3>`);
  for (const [id, skin] of Object.entries(SKINS)) {
    const unlocked = skin.locked ? isUnlocked(state.collection, skin) : true;
    const equipped = skinId === id;
    sections.push(`<button class="shop-btn ${equipped ? 'equipped' : ''} ${!unlocked ? 'locked' : ''}"
      data-action="equip-skin" data-id="${id}"
      ${!unlocked ? 'disabled' : ''}>
      ${equipped ? '✓ ' : ''}${skin.name}${!unlocked ? ' 🔒 (Pantalla 8)' : ''}
    </button>`);
  }
  sections.push(`</div>`);

  // 7.3b Patrón del dorso
  const currentBack = state.cardBack || DEFAULT_CARD_BACK;
  sections.push(`<div class="shop-section"><h3>🀄 Patrón del dorso</h3>`);
  for (const p of CARD_BACK_PATTERNS) {
    const equipped = currentBack === p.id;
    sections.push(`<button class="shop-btn ${equipped ? 'equipped' : ''}" data-action="card-back" data-id="${p.id}">
      ${equipped ? '✓ ' : ''}${p.icon} ${p.name}
    </button>`);
  }
  sections.push(`<p class="shop-hint">Cambia el dibujo decorativo del dorso de las cartas ocultas.</p></div>`);

  // 7.4 Tamaño de tablero
  const currentSize = state.boardSize || DEFAULT_BOARD_SIZE;
  sections.push(`<div class="shop-section"><h3>📐 Tamaño de tablero</h3>`);
  for (const sz of BOARD_SIZES) {
    const equipped = currentSize === sz.id;
    sections.push(`<button class="shop-btn ${equipped ? 'equipped' : ''}" data-action="board-size" data-id="${sz.id}">
      ${equipped ? '✓ ' : ''}${sz.icon} — ${sz.name}
    </button>`);
  }
  sections.push(`<p class="shop-hint">4×4 partidas rápidas, 6×6 más estratégico. El cambio se aplica al iniciar una nueva partida.</p></div>`);

  // 7.5 Aislante
  sections.push(`<div class="shop-section"><h3>🛡️ Aislante anti-shock</h3>`);
  sections.push(`<p class="shop-hint" style="font-style:normal;margin-top:0">Protege del próximo shock. Ármalo en partida y se consume automáticamente. Se regala 1 gratis cada ${SHIELDS_PER_FREE} pantallas completadas.</p>`);
  sections.push(`<button class="shop-btn" data-action="buy-shield">🛡️ Comprar aislante (${SHIELD_COST} 🪙)</button>`);
  sections.push(`</div>`);

  // 7.5 Medallas de vitrina
  sections.push(`<div class="shop-section"><h3>🏅 Medallas de vitrina</h3>`);
  for (const m of MEDALS) {
    const owned = state.collection.owned && state.collection.owned.includes(m.id);
    const canBuy = state.bankCoins >= m.cost && !owned;
    const tier = TROPHY_TIERS[m.tier] || TROPHY_TIERS.bronze;
    sections.push(`<button class="shop-btn medal-btn tier-${m.tier} ${owned ? 'owned' : ''}"
      data-action="buy-medal" data-id="${m.id}"
      ${!canBuy && !owned ? 'disabled' : ''}>
      ${owned ? '✓ ' : ''}${m.emoji} ${m.name} — ${m.cost}💰 <span class="medal-tier-label">${tier.label}</span>
    </button>`);
  }
  sections.push(`</div>`);

  // 7.6 Trofeos
  sections.push(`<div class="shop-section"><h3>🏆 Trofeos</h3>`);
  const trophies = state.collection.trophies || [];
  for (const t of TROPHIES) {
    const earned = trophies.includes(t.id);
    const tier = TROPHY_TIERS[t.tier] || TROPHY_TIERS.bronze;
    sections.push(`<div class="trophy-item ${earned ? 'earned' : ''} tier-${t.tier}">${earned ? tier.icon : '🔒'} ${t.name} — ${t.desc}</div>`);
  }
  sections.push(`</div>`);

  dom.workshopContent.innerHTML = sections.join('');

  // Event listeners del taller
  dom.workshopContent.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      switch (action) {
        case 'toggle-sound':
          toggleSound();
          break;
        case 'toggle-haptics':
          toggleHaptics();
          break;
        case 'music':
          Audio.setTrack(id);
          saveMusic(id);
          Audio.setMusic(state.musicOn);
          Audio.sfx('equip');
          renderWorkshop();
          break;
        case 'equip-theme':
          state.collection.theme = id;
          saveCollection(state.collection);
          applyTheme(id);
          Audio.sfx('equip');
          renderWorkshop();
          break;
        case 'equip-skin':
          state.collection.skin = id;
          saveCollection(state.collection);
          applySkin(id);
          Audio.sfx('equip');
          renderWorkshop();
          break;
        case 'board-size':
          state.boardSize = parseInt(id);
          state.collection.boardSize = state.boardSize;
          Logic.setGridSize(state.boardSize);
          saveCollection(state.collection);
          Audio.sfx('equip');
          renderWorkshop();
          break;
        case 'card-back':
          state.cardBack = id;
          state.collection.cardBack = id;
          applyCardBack(id);
          saveCollection(state.collection);
          Audio.sfx('equip');
          renderWorkshop();
          break;
        case 'buy-shield':
          if (state.bankCoins >= SHIELD_COST) {
            state.bankCoins -= SHIELD_COST;
            state.collection.shields = (state.collection.shields || 0) + 1;
            saveCoins(state.bankCoins);
            saveCollection(state.collection);
            Audio.sfx('buy');
            renderWorkshop();
          } else {
            Audio.sfx('deny');
          }
          break;
        case 'buy-medal':
          const medal = MEDALS.find(m => m.id === id);
          const result = purchaseMedal(medal, state.bankCoins, state.collection);
          if (result.ok) {
            state.bankCoins = result.bankCoins;
            state.collection.owned = result.owned;
            saveCoins(state.bankCoins);
            saveCollection(state.collection);
            Audio.sfx('buy');
            // Check all medals trophy
            if (result.allMedals) {
              state.stats.allMedals = true;
              saveStats(state.stats);
            }
            renderWorkshop();
          } else {
            Audio.sfx('deny');
          }
          break;
      }
    });
  });
}

// ─── Cómo jugar ───
function showHowToPlay() {
  showScreen('howtoplay');
}

// ─── Trofeos ───
function showTrophies() {
  showScreen('trophies');
}

function renderTrophies() {
  const grid = document.getElementById('trophies-content');
  const filterBar = document.getElementById('trophies-filter');
  const progress = document.getElementById('trophies-progress');
  const breakdown = document.getElementById('trophies-breakdown');
  if (!grid) return;

  state.collection = loadCollection();
  const earned = state.collection.trophies || [];
  const total = TROPHIES.length;

  if (progress) progress.textContent = `${earned.length}/${total}`;

  // Desglose por rareza en la cabecera
  if (breakdown) {
    breakdown.innerHTML = Object.entries(TROPHY_TIERS).map(([id, tier]) => {
      const tierTotal = TROPHIES.filter(t => t.tier === id).length;
      const tierEarned = TROPHIES.filter(t => t.tier === id && earned.includes(t.id)).length;
      return `<span class="trophies-breakdown-chip tier-${id}" title="${tier.label}">
        ${tier.icon} <span class="bd-count">${tierEarned}/${tierTotal}</span>
      </span>`;
    }).join('');
  }

  // Construir barra de filtros con conteos
  if (filterBar) {
    const tiers = [{ id: 'all', icon: '🏆', label: 'Todos' }, ...Object.entries(TROPHY_TIERS).map(([id, t]) => ({ id, icon: t.icon, label: t.label }))];
    filterBar.innerHTML = tiers.map(({ id, icon, label }) => {
      const count = id === 'all' ? total : TROPHIES.filter(t => t.tier === id).length;
      const active = trophyFilter === id;
      return `<button class="trophies-filter-btn tier-${id} ${active ? 'active' : ''}" data-filter="${id}" role="tab" aria-selected="${active}">
        ${icon} ${label}<span class="filter-count">${count}</span>
      </button>`;
    }).join('');

    filterBar.querySelectorAll('.trophies-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        trophyFilter = btn.dataset.filter;
        Audio.sfx('click');
        renderTrophies();
      });
    });
  }

  const cards = TROPHIES.map(t => {
    const has = earned.includes(t.id);
    const tier = TROPHY_TIERS[t.tier] || TROPHY_TIERS.bronze;
    const cls = has ? `earned tier-${t.tier}` : `locked tier-${t.tier}`;
    const icon = has ? tier.icon : '🔒';
    const filteredOut = trophyFilter !== 'all' && t.tier !== trophyFilter;
    return `<div class="trophy-card ${cls} ${filteredOut ? 'filtered-out' : ''}" data-tier="${t.tier}">
      <span class="trophy-card-icon">${icon}</span>
      <div class="trophy-card-body">
        <span class="trophy-card-name">${t.name}</span>
        <span class="trophy-card-desc">${t.desc}</span>
      </div>
      <span class="trophy-card-tier">${tier.label}</span>
    </div>`;
  });

  grid.innerHTML = cards.join('');
}

function hideTrophies() {
  const ts = document.getElementById('trophies-section');
  if (ts && ts.style.display !== 'none') showScreen('welcome');
}

// ─── Aplicar tema y skin ───
function applyTheme(id) {
  const theme = THEMES[id] || THEMES.taller;
  const root = document.documentElement;
  const vars = state.darkTheme ? theme.css : (theme.light || theme.css);
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
}

function applySkin(id) {
  const skin = SKINS[id] || SKINS.clasico;
  const root = document.documentElement;
  const vars = state.darkTheme ? skin.css : (skin.light || skin.css);
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
}

function applyCardBack(id) {
  document.documentElement.setAttribute('data-back-pattern', id || DEFAULT_CARD_BACK);
}

// ─── Stats overlay ───
function statsSettingsRow() {
  const ss = state.soundOn ? 'on' : 'off';
  const hs = state.hapticsOn ? 'on' : 'off';
  const ms = state.musicOn ? 'on' : 'off';
  const ts = state.themeMode === 'auto' ? '🅰️ Auto' : (state.darkTheme ? '🌙 Oscuro' : '☀️ Claro');
  return `
    <div class="stats-row settings-pills">
      <div class="settings-chip ${ss}"><span class="chip-icon">${ss === 'on' ? '🔊' : '🔇'}</span> Sonido: ${ss === 'on' ? 'Sí' : 'No'}</div>
      <div class="settings-chip ${hs}"><span class="chip-icon">${hs === 'on' ? '📳' : '🚫'}</span> Vibración: ${hs === 'on' ? 'Sí' : 'No'}</div>
      <div class="settings-chip ${ms}"><span class="chip-icon">${ms === 'on' ? '🎵' : '🔕'}</span> Música: ${ms === 'on' ? 'Sí' : 'No'}</div>
      <div class="settings-chip on"><span class="chip-icon">🎨</span> ${ts}</div>
    </div>`;
}

function showStats() {
  state.stats = loadStats();
  state.collection = loadCollection();
  if (!dom.statsBody) return;
  const s = state.stats;
  const trophies = state.collection.trophies || [];
  const medals = state.collection.owned || [];
  const coins = loadCoins();
  const title = getTitle(coins);

  const items = [
    { label: 'Pantallas ganadas', value: s.screensWon, cls: '' },
    { label: 'Shocks sufridos', value: s.bombsHit, cls: 'dim' },
    { label: 'Mejor nivel', value: LEVELS.find(l => l.id === s.bestLevel)?.name || s.bestLevel, cls: '' },
    { label: 'Racha actual', value: s.streak, cls: 'amber' },
    { label: 'Mejor racha', value: s.bestStreak, cls: 'amber' },
    { label: 'Partidas jugadas', value: s.gamesPlayed, cls: 'dim' },
    { label: 'Veces cobrado', value: s.totalRendirse, cls: 'dim' },
    { label: 'Seguros usados', value: s.shieldsUsed, cls: 'dim' },
    { label: 'Monedas ganadas', value: s.totalCoinsEarned, cls: '' },
    { label: 'Multi récord', value: s.highestMulti > 0 ? `×${s.highestMulti}` : '—', cls: 'amber' },
    { label: 'Banco actual', value: coins, cls: '' },
    { label: 'Rango', value: title, cls: 'dim' },
    { label: 'Trofeos', value: `${trophies.length}/${TROPHIES.length}`, cls: 'amber' },
    { label: 'Medallas', value: `${medals.length}/7`, cls: '' },
  ];

  dom.statsBody.innerHTML = items.map(i =>
    `<div class="stat-box${i.cls ? ' highlight' : ''}"><div class="stat-box-title">${i.label}</div><div class="stat-box-value${i.cls ? ' ' + i.cls : ''}">${i.value}</div></div>`
  ).join('') + statsSettingsRow();

  dom.statsOverlay.classList.remove('hidden');
  Audio.sfx('click');
}

function hideStats() {
  if (dom.statsOverlay) dom.statsOverlay.classList.add('hidden');
}

// ─── SVG icons inline ───
const svg_shock_icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><defs><radialGradient id="sc" cx="50%" cy="45%"><stop offset="0%" stop-color="#fffbe6"/><stop offset="30%" stop-color="#fff200"/><stop offset="70%" stop-color="#e6c200"/><stop offset="100%" stop-color="#8a6500"/></radialGradient></defs><circle cx="12" cy="13" r="9.5" fill="url(#sc)" stroke="#fffbe6" stroke-width="0.8"/><path d="M12 4.5 L10 10 L12 11 L9 15 L14 9 L11 8 L13 4.5Z" fill="#3a2a00" opacity="0.8"/><circle cx="12" cy="13" r="3.5" fill="#fff" opacity="0.15"/><rect x="11" y="2" width="2" height="3" rx="0.5" fill="#aaa"/><circle cx="12" cy="2" r="2.5" fill="#ccc" stroke="#999" stroke-width="0.5"/></svg>`;

const svg_sound_on = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z" fill="#ecc986"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke="#ecc986" stroke-width="2" stroke-linecap="round"/></svg>`;

const svg_sound_off = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z" fill="#bfb3a0"/><path d="M23 9l-6 6M17 9l6 6" stroke="#c65a44" stroke-width="2" stroke-linecap="round"/></svg>`;

const svg_music_on = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M9 18V5l12-2v13" stroke="#ecc986" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" fill="#ecc986"/><circle cx="18" cy="16" r="3" fill="#ecc986"/></svg>`;

const svg_music_off = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M9 18V5l12-2v13" stroke="#bfb3a0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" fill="#bfb3a0"/><circle cx="18" cy="16" r="3" fill="#bfb3a0"/><line x1="3" y1="4" x2="21" y2="20" stroke="#c65a44" stroke-width="2"/></svg>`;

const svg_haptics_on = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3 12h2a2 2 0 012 2v4a2 2 0 01-2 2H3a1 1 0 01-1-1v-6a1 1 0 011-1z" fill="#ecc986"/><path d="M7 13c1-4 2-7 4-9 1.6-1.6 4-1 4 1 0 1.2-.3 2.3-.6 3.3H16a3 3 0 013 3v.5a2 2 0 01-2 2h-3c-1.2 1.6-2.5 3-4 4" stroke="#ecc986" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const svg_haptics_off = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3 12h2a2 2 0 012 2v4a2 2 0 01-2 2H3a1 1 0 01-1-1v-6a1 1 0 011-1z" fill="#bfb3a0"/><path d="M7 13c1-4 2-7 4-9 1.6-1.6 4-1 4 1 0 1.2-.3 2.3-.6 3.3H16a3 3 0 013 3v.5a2 2 0 01-2 2h-3c-1.2 1.6-2.5 3-4 4" stroke="#bfb3a0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><line x1="3" y1="4" x2="21" y2="20" stroke="#c65a44" stroke-width="2"/></svg>`;

// ─── Inicializar al cargar ───
document.addEventListener('DOMContentLoaded', () => {
  init();
  applyTheme(state.collection?.theme || 'taller');
  applySkin(state.collection?.skin || 'clasico');
  applyCardBack(state.collection?.cardBack || DEFAULT_CARD_BACK);
});

// ─── Exportar para acceso global desde HTML (eventos inline) ───
window.ShockFlip = {
  rendirse, reiniciar, salir, toggleMemo, toggleShield, toggleSound, toggleHaptics, toggleTheme, setThemeMode, startGame,
  showWorkshop, showHowToPlay, closeOverlay, handleOverlay,
  showStats, hideStats, showTrophies, showScreen,
};

export {
  state, startGame, generateScreen, reveal, handleWin, cashOut, rendirse, toggleMemo, toggleShield,
};