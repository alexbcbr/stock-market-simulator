/**
 * Daily market price model.
 *
 * @packageDocumentation
 */
/**
 * One trading day's prices for a symbol, as loaded from the market CSV.
 *
 * @remarks
 * Prices are an immutable snapshot, never updated by trades. Every target returns
 * these field names as plain JSON.
 */
export interface MarketPrice {
  symbol: string;
  open_price: number;
  close_price: number;
  highest_price: number;
  lowest_price: number;
  volume: number;
}
