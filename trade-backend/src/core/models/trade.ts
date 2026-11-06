/**
 * Trade models shared by every target.
 *
 * @packageDocumentation
 */
/**
 * How the executed price of a buy is chosen.
 *
 * @remarks
 * `manual` uses the player's bid. `market` and the three `agent_*` strategies pick
 * a random price inside a band of the day's range. The plain `agent` value exists
 * only on old stored trades and is rejected for new buys by `validateBuyStockRequest`.
 */
export type PriceMode = 'manual' | 'market' | 'agent_conservative' | 'agent_moderate' | 'agent_aggressive' | 'agent';

/**
 * A stored trade.
 *
 * @remarks
 * `price_difference` is `close_price - executed_price`: the profit if the trade is
 * sold at the day's close. Selling changes only `status_sell`. The key is
 * `trade_id` together with `trade_timestamp`.
 */
export interface Trade {
  trade_id: string;
  symbol: string;
  customer_name: string;
  executed_price: number;
  open_price: number;
  close_price: number;
  price_difference: number;
  status_trade: boolean;
  status_sell: boolean;
  /** The price mode used to create the trade. */
  trade_source: PriceMode;
  /** Time of day as `HH:MM:SS` in America/Los_Angeles. It has no date, so it sorts correctly only within one day. */
  trade_timestamp: string;
}

/**
 * Body of a buy request, after validation.
 *
 * @remarks
 * `symbol` is case-insensitive and stored in upper case. `bid_price` is read only
 * when `price_mode` is `manual`, where it is required and must not be negative.
 */
export interface BuyStockRequest {
  symbol: string;
  customer_name: string;
  price_mode: PriceMode;
  bid_price?: number;
}
