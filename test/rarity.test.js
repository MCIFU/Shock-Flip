// test/rarity.test.js — Tests for rarity module (tier celebrations + medal purchase)
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';

// Stub globals that rarity.js (and its imports) may touch
// Note: navigator (Node 21+ getter) already exists; it has no vibrate so haptics will no-op.
globalThis.window = { innerWidth: 1200, innerHeight: 800 };
globalThis.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
};
globalThis.document = {
  documentElement: { getAttribute() { return 'dark'; } },
};
globalThis.setTimeout = (fn, ms) => { fn(); return 42; };

// Now we can safely import the module
import { purchaseMedal, celebrateTrophy } from '../game/js/rarity.js';
import { MEDALS } from '../game/js/collection.js';

describe('Rarity', () => {
  describe('purchaseMedal', () => {
    const cheapMedal = { id: 'medal_cobre', cost: 100, emoji: '🥉', tier: 'bronze' };
    const priceyMedal = { id: 'medal_obsidiana', cost: 3000, emoji: '🖤', tier: 'legendary' };

    it('should reject null/undefined medal', () => {
      assert.deepEqual(purchaseMedal(null, 500, { owned: [] }), { ok: false });
      assert.deepEqual(purchaseMedal(undefined, 500, { owned: [] }), { ok: false });
    });

    it('should reject when bankCoins < cost', () => {
      const result = purchaseMedal(cheapMedal, 50, { owned: [] });
      assert.equal(result.ok, false);
      assert(!('bankCoins' in result));
      assert(!('owned' in result));
    });

    it('should reject when medal already owned', () => {
      const result = purchaseMedal(cheapMedal, 500, { owned: ['medal_cobre'] });
      assert.equal(result.ok, false);
    });

    it('should accept purchase with exact coins', () => {
      const result = purchaseMedal(cheapMedal, 100, { owned: [] });
      assert.equal(result.ok, true);
      assert.equal(result.bankCoins, 0);
      assert.deepEqual(result.owned, ['medal_cobre']);
      assert.equal(result.allMedals, false); // only 1 out of 7
    });

    it('should return correct change', () => {
      const result = purchaseMedal(cheapMedal, 500, { owned: [] });
      assert.equal(result.ok, true);
      assert.equal(result.bankCoins, 400);
    });

    it('should append to existing owned array (copied, not mutated)', () => {
      const orig = { owned: ['medal_plata'] };
      const result = purchaseMedal(cheapMedal, 200, orig);
      assert.equal(result.ok, true);
      assert.deepEqual(result.owned, ['medal_plata', 'medal_cobre']);
      // Original must not be mutated
      assert.deepEqual(orig.owned, ['medal_plata']);
      assert.equal(orig.owned.length, 1);
    });

    it('should handle collection with no owned key at all', () => {
      const result = purchaseMedal(cheapMedal, 200, {});
      assert.equal(result.ok, true);
      assert.deepEqual(result.owned, ['medal_cobre']);
    });

    it('should detect allMedals flag when this purchase completes the set', () => {
      // 6 medals already owned → buying the 7th triggers allMedals
      const sixOwned = MEDALS.filter(m => m.id !== priceyMedal.id).map(m => m.id);
      assert.equal(sixOwned.length, MEDALS.length - 1);
      const result = purchaseMedal(priceyMedal, 3000, { owned: sixOwned });
      assert.equal(result.ok, true);
      assert.equal(result.allMedals, true);
      assert.deepEqual(result.owned, MEDALS.map(m => m.id));
    });

    it('should not trigger allMedals on duplicates', () => {
      const allOwned = MEDALS.map(m => m.id);
      const result = purchaseMedal(cheapMedal, 500, { owned: allOwned });
      assert.equal(result.ok, false);
    });
  });

  describe('celebrateTrophy', () => {
    // Minimal DOM stub for classList interactions
    function stubDom() {
      const classLog = { flash: [], app: [] };
      return {
        flash: {
          classList: {
            _log: classLog.flash,
            add(...cls) { classLog.flash.push(`add:${cls.join(',')}`); },
            remove(...cls) { classLog.flash.push(`remove:${cls.join(',')}`); },
          },
        },
        app: {
          classList: {
            _log: classLog.app,
            add(...cls) { classLog.app.push(`add:${cls.join(',')}`); },
            remove(...cls) { classLog.app.push(`remove:${cls.join(',')}`); },
          },
          offsetWidth: 0, // for reflow
        },
        _logs: classLog,
      };
    }

    it('should flash legendary with shake + legendary class', () => {
      const dom = stubDom();
      celebrateTrophy('legendary', 100, 100, dom);
      assert(dom._logs.flash.some(s => s.includes('legendary') && s.startsWith('add:')));
      assert(dom._logs.app.some(s => s === 'remove:screen-shake'));
      assert(dom._logs.app.some(s => s === 'add:screen-shake'));
      // setTimeout cleans up flash + shake
      assert(dom._logs.flash.some(s => s.includes('legendary') && s.startsWith('remove:')));
      assert(dom._logs.app.some(s => s === 'remove:screen-shake'));
    });

    it('should flash gold with gold class (no shake)', () => {
      const dom = stubDom();
      celebrateTrophy('gold', 100, 100, dom);
      assert(dom._logs.flash.some(s => s.includes('gold') && s.startsWith('add:')));
      assert(!dom._logs.app.some(s => s === 'add:screen-shake'));
      assert(dom._logs.flash.some(s => s.includes('gold') && s.startsWith('remove:')));
    });

    it('should flash silver with silver class (no shake)', () => {
      const dom = stubDom();
      celebrateTrophy('silver', 100, 100, dom);
      assert(dom._logs.flash.some(s => s.includes('silver') && s.startsWith('add:')));
      assert(!dom._logs.app.some(s => s === 'add:screen-shake'));
    });

    it('should flash bronze with bronze class (no shake)', () => {
      const dom = stubDom();
      celebrateTrophy('bronze', 100, 100, dom);
      assert(dom._logs.flash.some(s => s.includes('bronze') && s.startsWith('add:')));
      assert(!dom._logs.app.some(s => s === 'add:screen-shake'));
    });

    it('should treat unknown tiers as bronze fallback', () => {
      const dom = stubDom();
      celebrateTrophy('platinum', 100, 100, dom);
      assert(dom._logs.flash.some(s => s.includes('bronze') && s.startsWith('add:')));
    });

    it('should not throw on missing dom elements (null flash/app)', () => {
      assert.doesNotThrow(() => {
        celebrateTrophy('gold', 0, 0, { flash: null, app: null });
      });
    });
  });
});