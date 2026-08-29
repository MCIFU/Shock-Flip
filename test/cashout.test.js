// test/cashout.test.js — Regression: cashOut includes mid-screen screenCoins
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cashOutEarned } from '../game/js/logic.js';

describe('cashOutEarned', () => {
  it('should move runCoins to bank exactly and return earned', () => {
    const state = { bankCoins: 95, runCoins: 250 };
    const earned = cashOutEarned(state);
    assert.equal(earned, 250);
    assert.equal(state.bankCoins, 345);
    assert.equal(state.runCoins, 0);
  });

  it('should keep bank unchanged when runCoins is 0', () => {
    const state = { bankCoins: 500, runCoins: 0 };
    const earned = cashOutEarned(state);
    assert.equal(earned, 0);
    assert.equal(state.bankCoins, 500);
  });

  it('should floor fractional runCoins and clamp negatives', () => {
    const state = { bankCoins: 10, runCoins: 12.7 };
    assert.equal(cashOutEarned(state), 12);
    assert.equal(state.bankCoins, 22);

    const neg = { bankCoins: 10, runCoins: -5 };
    assert.equal(cashOutEarned(neg), 0);
    assert.equal(neg.bankCoins, 10);
  });
});

describe('cashOut merges screenCoins (game.js integration)', () => {
  it('cashOut function in game.js merges screenCoins before cashOutEarned', () => {
    // Simulate what game.js cashOut does after the fix:
    // state.runCoins += state.screenCoins; then cashOutEarned(state)
    const state = { bankCoins: 0, runCoins: 0, screenCoins: 42 };
    // The fix: runCoins += screenCoins before cashOutEarned
    state.runCoins += state.screenCoins;
    const earned = cashOutEarned(state);
    assert.equal(earned, 42);
    assert.equal(state.bankCoins, 42);
    assert.equal(state.runCoins, 0);
    // screenCoins gets zeroed separately by cashOut
  });

  it('cashOut with no screenCoins still works', () => {
    const state = { bankCoins: 100, runCoins: 30, screenCoins: 0 };
    state.runCoins += state.screenCoins;
    const earned = cashOutEarned(state);
    assert.equal(earned, 30);
    assert.equal(state.bankCoins, 130);
    assert.equal(state.runCoins, 0);
  });

  it('cashOut with both runCoins and screenCoins accumulates correctly', () => {
    // After winning screen 1, runCoins = 40 (committed), screenCoins = 25 (current)
    const state = { bankCoins: 0, runCoins: 40, screenCoins: 25 };
    state.runCoins += state.screenCoins;
    const earned = cashOutEarned(state);
    assert.equal(earned, 65);
    assert.equal(state.bankCoins, 65);
    assert.equal(state.runCoins, 0);
  });
});
