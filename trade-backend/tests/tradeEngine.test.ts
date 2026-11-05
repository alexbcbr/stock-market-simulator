import { describe, expect, test } from 'bun:test';
import { computeExecution } from '../src/core/tradeEngine';
import { AAPL } from './helpers';

const req = (price_mode: any, bid_price?: number) => ({ symbol: 'AAPL', customer_name: 'a', price_mode, bid_price });
// range = 20, lowest = 100, highest = 120

describe('computeExecution', () => {
  test('agent_aggressive spans lowest..lowest+50% of range', () => {
    expect(computeExecution(AAPL, req('agent_aggressive'), () => 0)).toEqual({ executed_price: 100, status_trade: true });
    expect(computeExecution(AAPL, req('agent_aggressive'), () => 1).executed_price).toBe(110);
  });
  test('agent_moderate spans 5%..45%', () => {
    expect(computeExecution(AAPL, req('agent_moderate'), () => 0).executed_price).toBe(101);
    expect(computeExecution(AAPL, req('agent_moderate'), () => 1).executed_price).toBe(109);
  });
  test('agent_conservative spans 10%..40%', () => {
    expect(computeExecution(AAPL, req('agent_conservative'), () => 0).executed_price).toBe(102);
    expect(computeExecution(AAPL, req('agent_conservative'), () => 1).executed_price).toBe(108);
  });
  test('market spans 48%..100% and always succeeds', () => {
    expect(computeExecution(AAPL, req('market'), () => 0)).toEqual({ executed_price: 109.6, status_trade: true });
    expect(computeExecution(AAPL, req('market'), () => 1)).toEqual({ executed_price: 120, status_trade: true });
  });
  test('manual: bid at or above highest succeeds at highest', () => {
    expect(computeExecution(AAPL, req('manual', 130), () => 0)).toEqual({ executed_price: 120, status_trade: true });
  });
  test('manual: bid at or below lowest fails at the bid', () => {
    expect(computeExecution(AAPL, req('manual', 90), () => 1)).toEqual({ executed_price: 90, status_trade: false });
  });
  test('manual: in-range bid succeeds only when random is above the 45% threshold', () => {
    expect(computeExecution(AAPL, req('manual', 110), () => 0.5).status_trade).toBe(true); // 110 > 109
    expect(computeExecution(AAPL, req('manual', 110), () => 0.4).status_trade).toBe(false); // 108 <= 109
    expect(computeExecution(AAPL, req('manual', 110), () => 0.5).executed_price).toBe(110);
  });
});
