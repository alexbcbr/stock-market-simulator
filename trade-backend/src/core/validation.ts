import { BuyStockRequest } from './models/trade';

// Request validation shared by every target (Lambda, Hono server, Azure Function),
// so the same input gets the same answer everywhere.

// 'agent' is a legacy value that only appears on old stored trades; new trades must use a specific mode.
export const BUY_PRICE_MODES = ['manual', 'market', 'agent_conservative', 'agent_moderate', 'agent_aggressive'] as const;

export type Validation<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateBuyStockRequest(body: unknown): Validation<BuyStockRequest> {
  const request = (body ?? {}) as Partial<BuyStockRequest>;

  if (!request.symbol || !request.customer_name || !request.price_mode) {
    return { ok: false, error: 'Missing required fields: symbol, customer_name, price_mode' };
  }
  if (!(BUY_PRICE_MODES as readonly string[]).includes(request.price_mode)) {
    return { ok: false, error: `price_mode must be one of: ${BUY_PRICE_MODES.join(', ')}` };
  }
  if (request.price_mode === 'manual' && (typeof request.bid_price !== 'number' || request.bid_price < 0)) {
    return { ok: false, error: 'bid_price is required and must be non-negative when price_mode is manual' };
  }
  return { ok: true, value: request as BuyStockRequest };
}
