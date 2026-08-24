// test/logic.test.js — Tests for board generation and pure logic
import { describe, it } from 'node:test';
import assert from 'node:assert';

// We need to mock localStorage for ES modules before importing
globalThis.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; },
};

import * as Logic from '../game/js/logic.js';
import { LEVELS, getActiveLevels } from '../game/js/config.js';

// Set default grid size for all tests
Logic.setGridSize(5);

describe('Logic', () => {
  describe('shuffle', () => {
    it('should shuffle an array', () => {
      let callCount = 0;
      const rng = () => { callCount++; return callCount / 100; };
      const result = Logic.shuffle([1, 2, 3, 4, 5], rng);
      assert.equal(result.length, 5);
      assert.equal(callCount, 4);
    });

    it('should not modify original array', () => {
      const orig = [1, 2, 3];
      Logic.shuffle(orig);
      assert.deepEqual(orig, [1, 2, 3]);
    });
  });

  describe('generateBoard', () => {
    it('should generate 25 cells', () => {
      const board = Logic.generateBoard(1);
      assert.equal(board.length, 25);
    });

    it('should only contain valid values (0,1,2,3)', () => {
      for (let level = 1; level <= 8; level++) {
        const board = Logic.generateBoard(level);
        for (const v of board) {
          assert.ok([0, 1, 2, 3].includes(v), `Invalid value ${v} in level ${level}`);
        }
      }
    });

    it('should match pattern constraints', () => {
      // Verify that total 2+3+bombs matches one of the patterns
      for (let level = 1; level <= 8; level++) {
        const board = Logic.generateBoard(level);
        const twos = board.filter(v => v === 2).length;
        const threes = board.filter(v => v === 3).length;
        const bombs = board.filter(v => v === 0).length;
        const levelDef = LEVELS[level - 1];
        const match = levelDef.patterns.some(p => p.twos === twos && p.threes === threes && p.bombs === bombs);
        assert.ok(match, `Level ${level}: twos=${twos}, threes=${threes}, bombs=${bombs} do not match any pattern`);
      }
    });

    it('should guarantee no-bomb row for levels 1-2', () => {
      for (let level = 1; level <= 2; level++) {
        let allOK = true;
        for (let i = 0; i < 10; i++) {
          const board = Logic.generateBoard(level);
          if (!Logic.hasNoBombRow(board)) { allOK = false; break; }
        }
        assert.ok(allOK, `Level ${level} should always have a no-bomb row`);
      }
    });
  });

  describe('computeHints', () => {
    it('should compute row and column hints', () => {
      const board = [
        1, 2, 0, 3, 1,
        0, 1, 2, 1, 0,
        2, 0, 3, 0, 2,
        1, 1, 0, 2, 3,
        0, 0, 1, 1, 1,
      ];
      const hints = Logic.computeHints(board);
      assert.equal(hints.rows.length, 5);
      assert.equal(hints.cols.length, 5);
    });

    it('should compute multi as sum of all values (bombs=0)', () => {
      // [2,3,1,0,0] → multi = 2+3+1+0+0 = 6
      assert.equal(Logic.lineMulti([2, 3, 1, 0, 0]), 6);
    });

    it('should compute multi for only ones', () => {
      // [1,1,1,1,1] → multi = 5
      assert.equal(Logic.lineMulti([1, 1, 1, 1, 1]), 5);
    });

    it('should compute multi with no ones', () => {
      // [2,2,0,0,0] → multi = 4
      assert.equal(Logic.lineMulti([2, 2, 0, 0, 0]), 4);
    });

    it('should match user examples', () => {
      // [1,1,2,1,1] → 6
      assert.equal(Logic.lineMulti([1, 1, 2, 1, 1]), 6);
      // [3,1,3,1,2] → 10
      assert.equal(Logic.lineMulti([3, 1, 3, 1, 2]), 10);
    });

    it('should count bombs correctly', () => {
      const line = [0, 2, 0, 3, 0];
      assert.equal(Logic.lineBombs(line), 3);
    });
  });

  describe('lineStatus', () => {
    it('should return done for fully revealed line', () => {
      const line = [1, 2, 0, 3, 1];
      const revealed = [true, true, true, true, true];
      assert.equal(Logic.lineStatus(line, revealed), 'done');
    });

    it('should return resolved when all hidden are bombs', () => {
      const line = [2, 0, 0, 3, 0];
      const revealed = [true, false, false, true, false];
      assert.equal(Logic.lineStatus(line, revealed), 'resolved');
    });

    it('should return dead when hidden cells are only 1s (no 2/3, no bombs)', () => {
      const line = [1, 1, 0, 0, 1];
      const revealed = [true, false, true, true, true];
      assert.equal(Logic.lineStatus(line, revealed), 'dead');
    });

    it('should return active when multipliers remain to be found', () => {
      const line = [1, 2, 0, 0, 1];
      const revealed = [true, false, false, false, true];
      assert.equal(Logic.lineStatus(line, revealed), 'active');
    });
  });

  describe('countMultipliers', () => {
    it('should count cells with value >= 2', () => {
      const board = [1, 0, 2, 3, 0, 1, 1, 2, 0, 0, 1, 3, 3, 0, 0, 1, 1, 1, 2, 0, 0, 0, 1, 1, 1];
      assert.equal(Logic.countMultipliers(board), 6);
    });
  });

  describe('isWin', () => {
    it('should detect win when all multipliers revealed', () => {
      const board = [1, 2, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      const revealed = new Array(25).fill(false);
      revealed[1] = true; // reveal the only 2
      assert.ok(Logic.isWin(board, revealed));
    });

    it('should not detect win when multipliers remain', () => {
      const board = [1, 2, 3, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      const revealed = new Array(25).fill(false);
      revealed[1] = true; // revealed 2 but 3 remains
      assert.ok(!Logic.isWin(board, revealed));
    });
  });

  describe('applyScore', () => {
    it('should start with first value', () => {
      assert.equal(Logic.applyScore(0, 2), 2);
      assert.equal(Logic.applyScore(0, 1), 1);
      assert.equal(Logic.applyScore(0, 3), 3);
    });

    it('should multiply for values > 1', () => {
      assert.equal(Logic.applyScore(2, 3), 6);
      assert.equal(Logic.applyScore(6, 2), 12);
    });

    it('should not change for value 1', () => {
      assert.equal(Logic.applyScore(6, 1), 6);
    });
  });

  describe('coinsForScreen', () => {
    it('should return reasonable values', () => {
      const c = Logic.coinsForScreen(1, 2);
      assert.ok(c > 0 && c < 100);
    });
  });
});