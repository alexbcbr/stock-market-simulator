import { MarketPrice } from './models/marketPrice';
import { BuyStockRequest } from './models/trade';

/** Source of randomness: returns a number from 0 up to, but not including, 1. Tests pass a fixed sequence. */
export type Rng = () => number;

/** Outcome of pricing a buy. */
export interface Execution {
  executed_price: number;
  status_trade: boolean;
}

/**
 * Decides the executed price and whether the trade succeeds.
 *
 * @remarks
 * Pure: no I/O, so a fixed `rng` gives a repeatable result. With range = highest minus lowest price:
 *
 * - `market`: a random price from `lowest + 48%` of the range up to `highest`; always succeeds.
 * - `agent_aggressive`, `agent_moderate`, `agent_conservative`: a random price within
 *   `lowest + 0-50%`, `5-45%` or `10-40%` of the range; always succeed.
 * - `manual`: a bid at or above `highest` executes at `highest` and succeeds; a bid at or below `lowest`
 *   is recorded at the bid and fails; a bid in between executes at the bid and succeeds only if a random
 *   point in the range lands above `lowest + 45%` of the range.
 *
 * Random prices are rounded to 2 decimals; the two manual edge cases return `highest` or the bid as given.
 * Any other `price_mode`, including the legacy `agent`, falls through to the manual rules, so callers
 * must validate the request first.
 *
 * @param marketPrice - The symbol's price for the day.
 * @param request - The validated buy request.
 * @param rng - Random source; defaults to `Math.random`.
 * @returns The executed price and the success flag.
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

/**
 * Formats the time of day used as `trade_timestamp`.
 *
 * @remarks
 * Uses the America/Los_Angeles time zone (Seattle) and 24-hour time. The date is not included, so two
 * trades at the same time on different days get the same value.
 *
 * @param now - The moment to format.
 * @returns Text such as `14:05:09`.
 */
export function formatTradeTimestamp(now: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);
}
