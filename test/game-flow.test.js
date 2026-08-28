// test/game-flow.test.js — Regression tests for state transitions across screens
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function createElement() {
  return {
    textContent: '', innerHTML: '', style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    appendChild() {}, addEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; },
  };
}

const elements = new Map();
for (const id of [
  'app', 'hud-level', 'hud-bank', 'hud-run', 'hud-mult', 'hud-streak', 'board-area',
  'status-bar', 'btn-memo', 'btn-shield', 'btn-rendirse', 'btn-salir', 'btn-sonido-game',
  'btn-haptics-game', 'btn-opciones', 'btn-reiniciar', 'btn-jugar', 'btn-taller',
  'btn-como-jugar', 'overlay', 'overlay-title', 'overlay-body', 'overlay-btn1',
  'overlay-btn2', 'trophy-alert', 'flash', 'workshop-content', 'workshop-bank',
  'workshop-title', 'workshop-back', 'howtoplay', 'bank-welcome', 'trophies-welcome',
  'stats-overlay', 'stats-body', 'stats-close', 'theme-toggle', 'welcome-section',
  'game-section', 'workshop-section', 'howtoplay-section', 'trophies-section',
  'options-section', 'options-back', 'trophies-back', 'bg-particles', 'fx-particles',
]) elements.set(id, createElement());
const root = createElement();
root.getAttribute = () => 'dark';
root.setAttribute = () => {};
globalThis.document = {
  documentElement: root,
  getElementById(id) { return elements.get(id) || null; },
  querySelector() { return null; }, querySelectorAll() { return []; },
  createElement() { return createElement(); }, addEventListener() {},
};
globalThis.window = {
  innerWidth: 1024, innerHeight: 768,
  matchMedia: () => ({ matches: true, addEventListener() {}, addListener() {} }),
  addEventListener() {},
};
globalThis.requestAnimationFrame = () => 1;
globalThis.setTimeout = (fn) => { fn(); return 1; };
globalThis.clearTimeout = () => {};
globalThis.localStorage = {
  data: {}, getItem(key) { return this.data[key] ?? null; },
  setItem(key, value) { this.data[key] = String(value); }, removeItem(key) { delete this.data[key]; },
};

const Game = await import('../game/js/game.js?game-flow-test');

describe('Game flow', () => {
  it('shows accumulated runCoins once after SIGUIENTE, without stale screenCoins', () => {
    const hudRun = document.getElementById('hud-run');
    const original = {
      board: Game.state.board, level: Game.state.level, runCoins: Game.state.runCoins,
      screenCoins: Game.state.screenCoins, stats: Game.state.stats,
      collection: Game.state.collection, boardSize: Game.state.boardSize,
    };
    try {
      Game.state.stats = { bestLevel: 1 };
      Game.state.collection = { trophies: [], owned: [], shields: [] };
      Game.state.board = [1, 2, ...new Array(23).fill(1)];
      Game.state.level = 1;
      Game.state.runCoins = 40;
      Game.state.screenCoins = 40;
      Game.state.boardSize = 5;

      Game.nextScreen();

      assert.equal(Game.state.level, 2);
      assert.equal(Game.state.runCoins, 40);
      assert.equal(Game.state.screenCoins, 0);
      hudRun.textContent = String(Game.state.runCoins + Game.state.screenCoins);
      assert.equal(hudRun.textContent, '40');
    } finally {
      Object.assign(Game.state, original);
    }
  });
});
