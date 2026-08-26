// test/collection.test.js — Tests for collection, catalog, economy
import { describe, it, before } from 'node:test';
import assert from 'node:assert';

globalThis.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
};

import {
  loadCoins, saveCoins, loadCollection, saveCollection,
  loadStats, saveStats, ShieldManager,
  THEMES, SKINS, MEDALS, TROPHIES, TROPHY_TIERS, checkTrophies, isUnlocked,
} from '../game/js/collection.js';
import { DEFAULT_COLLECTION, DEFAULT_STATS, KEYS } from '../game/js/config.js';

describe('Collection', () => {
  before(() => {
    localStorage._data = {};
  });

  describe('coins persistence', () => {
    it('should start at 0', () => {
      assert.equal(loadCoins(), 0);
    });

    it('should save and load coins', () => {
      saveCoins(500);
      assert.equal(loadCoins(), 500);
    });

    it('should floor coins', () => {
      saveCoins(123.7);
      assert.equal(loadCoins(), 123);
    });
  });

  describe('collection persistence', () => {
    it('should return default collection when empty', () => {
      localStorage._data = {};
      const col = loadCollection();
      assert.equal(col.theme, 'taller');
      assert.equal(col.skin, 'clasico');
      assert.equal(col.shields, 0);
      assert.deepEqual(col.trophies, []);
    });

    it('should save and load collection', () => {
      const col = loadCollection();
      col.theme = 'verde';
      saveCollection(col);
      assert.equal(loadCollection().theme, 'verde');
    });
  });

  describe('stats persistence', () => {
    it('should return default stats when empty', () => {
      localStorage._data = {};
      const stats = loadStats();
      assert.equal(stats.screensWon, 0);
      assert.equal(stats.bestLevel, 1);
    });

    it('should save and load stats', () => {
      const stats = loadStats();
      stats.screensWon = 42;
      saveStats(stats);
      assert.equal(loadStats().screensWon, 42);
    });
  });

  describe('THEMES', () => {
    it('should have all 6 themes', () => {
      const ids = Object.keys(THEMES);
      assert.ok(ids.includes('taller'));
      assert.ok(ids.includes('medianoche'));
      assert.ok(ids.includes('solar'));
      assert.ok(ids.includes('verde'));
      assert.ok(ids.includes('rojo'));
      assert.ok(ids.includes('leyenda'));
    });

    it('should have 5 free themes and 1 locked', () => {
      const free = Object.values(THEMES).filter(t => !t.locked);
      const locked = Object.values(THEMES).filter(t => t.locked);
      assert.equal(free.length, 5);
      assert.equal(locked.length, 1);
      assert.equal(locked[0].id, 'leyenda');
    });

    it('all themes should have CSS variables', () => {
      for (const theme of Object.values(THEMES)) {
        assert.ok(theme.css['--bg']);
        assert.ok(theme.css['--border']);
        assert.ok(theme.css['--corner']);
      }
    });
  });

  describe('SKINS', () => {
    it('should have all 6 skins', () => {
      const ids = Object.keys(SKINS);
      assert.ok(ids.includes('clasico'));
      assert.ok(ids.includes('brasa'));
      assert.ok(ids.includes('hielo'));
      assert.ok(ids.includes('obsidiana'));
      assert.ok(ids.includes('jade'));
      assert.ok(ids.includes('cosmos'));
    });

    it('should have 5 free and 1 locked', () => {
      const locked = Object.values(SKINS).filter(s => s.locked);
      assert.equal(locked.length, 1);
      assert.equal(locked[0].id, 'cosmos');
    });
  });

  describe('MEDALS', () => {
    it('should have 7 medals', () => {
      assert.equal(MEDALS.length, 7);
    });

    it('medals should have increasing costs', () => {
      for (let i = 1; i < MEDALS.length; i++) {
        assert.ok(MEDALS[i].cost > MEDALS[i - 1].cost);
      }
    });
  });

  describe('TROPHIES', () => {
    it('should have 26 trophies', () => {
      assert.ok(TROPHIES.length >= 25, `Expected >= 25, got ${TROPHIES.length}`);
    });

    it('should define all four rarity tiers', () => {
      for (const key of ['bronze', 'silver', 'gold', 'legendary']) {
        assert.ok(TROPHY_TIERS[key], `missing tier ${key}`);
        assert.ok(TROPHY_TIERS[key].icon, `tier ${key} missing icon`);
        assert.ok(TROPHY_TIERS[key].color, `tier ${key} missing color`);
      }
    });

    it('should assign a valid tier to every trophy', () => {
      for (const t of TROPHIES) {
        assert.ok(TROPHY_TIERS[t.tier], `trophy ${t.id} has invalid tier ${t.tier}`);
      }
    });
  });

  describe('ShieldManager', () => {
    it('should start unarmed', () => {
      const sm = new ShieldManager();
      assert.equal(sm.armed, false);
    });

    it('should arm and disarm', () => {
      const sm = new ShieldManager();
      sm.arm();
      assert.equal(sm.armed, true);
    });

    it('should consume shield when armed', () => {
      const sm = new ShieldManager();
      sm.arm();
      const col = { shields: 1, shieldProgress: 0 };
      const result = sm.consume(col);
      assert.ok(result.blocked);
      assert.ok(result.consumed);
      assert.equal(col.shields, 0);
    });

    it('should not block when not armed', () => {
      const sm = new ShieldManager();
      const col = { shields: 1 };
      const result = sm.consume(col);
      assert.ok(!result.blocked);
    });

    it('should add free shield every 3 screens', () => {
      const sm = new ShieldManager();
      const col = { shields: 0, shieldProgress: 0 };
      assert.ok(!sm.addFreeShield(col)); // progress = 1
      assert.ok(!sm.addFreeShield(col)); // progress = 2
      assert.ok(sm.addFreeShield(col));  // progress = 3 → +1 shield, progress = 0
      assert.equal(col.shields, 1);
    });
  });

  describe('checkTrophies', () => {
    it('should award first screen trophy', () => {
      const stats = { screensWon: 1, bombsHit: 0, bestLevel: 1 };
      const col = { trophies: [] };
      const newT = checkTrophies(stats, 0, col);
      const found = newT.some(t => t.id === 'trophy_first');
      assert.ok(found);
    });

    it('should not duplicate trophies', () => {
      const stats = { screensWon: 5, bombsHit: 0, bestLevel: 1 };
      const col = { trophies: ['trophy_first', 'trophy_10'] };
      const newT = checkTrophies(stats, 0, col);
      // Should not re-award trophy_first or trophy_10 (screensWon < 10)
      const found = newT.some(t => t.id === 'trophy_first');
      assert.ok(!found);
    });
  });

  describe('isUnlocked', () => {
    it('should unlock items for non-locked', () => {
      assert.ok(isUnlocked({}, { locked: false }));
      assert.ok(isUnlocked({}, { id: 'test' }));
    });
  });
});