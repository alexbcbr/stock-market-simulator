import { MarketPrice } from './models/marketPrice';
import { BuyStockRequest } from './models/trade';

export type Rng = () => number;

export interface Execution {
  executed_price: number;
  status_trade: boolean;
}

/**
 * Pure pricing rules: decides executed price and success for a trade.
 * No I/O. Pass a seeded `rng` to make it deterministic in tests.
 */
export function computeExecution(
  marketPrice: MarketPrice,
  request: BuyStockRequest,
  rng: Rng = Math.random
): Execution {
  const { highest_price, lowest_price } = marketPrice;
  const range = highest_price - lowest_price;

  if (request.price_mode === 'agent_aggressive') {
    // Aggressive: lowest_price to lowest + 50% of range
    return { executed_price: +(lowest_price + rng() * 0.5 * range).toFixed(2), status_trade: true };
  }

  if (request.price_mode === 'agent_moderate') {
    // Moderate: lowest + 5% to lowest + 45% of range
    return { executed_price: +(lowest_price + (0.05 + rng() * 0.40) * range).toFixed(2), status_trade: true };
  }

  if (request.price_mode === 'agent_conservative') {
    // Conservative: lowest + 10% to lowest + 40% of range
    return { executed_price: +(lowest_price + (0.10 + rng() * 0.30) * range).toFixed(2), status_trade: true };
  }

  if (request.price_mode === 'market') {
    // Market: random between 48% and 100% of the interval (highest - lowest)
    const floor = lowest_price + 0.48 * range;
    return { executed_price: +(floor + rng() * (highest_price - floor)).toFixed(2), status_trade: true };
  }

  // Manual: executed price based on bid vs range, with random chance of failure
  const bidPrice = request.bid_price!;
  if (bidPrice >= highest_price) {
    return { executed_price: highest_price, status_trade: true };
  }
  if (bidPrice <= lowest_price) {
    return { executed_price: bidPrice, status_trade: false };
  }
  const randomInInterval = lowest_price + rng() * range;
  const failureThreshold = lowest_price + 0.45 * range;
  return { executed_price: bidPrice, status_trade: randomInInterval > failureThreshold };
}

/** Time of day in Seattle (HH:MM:SS), used as the trade sort key. */
export function formatTradeTimestamp(now: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);
}
