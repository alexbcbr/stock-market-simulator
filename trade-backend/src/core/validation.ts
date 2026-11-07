import { CreateCustomerRequest } from './models/customer';
import { BuyStockRequest } from './models/trade';

/**
 * Request validation shared by every target (Lambda, Hono server, Azure Function),
 * so the same input gets the same answer everywhere.
 *
 * @packageDocumentation
 */

// 'agent' is a legacy value that only appears on old stored trades; new trades must use a specific mode.
/**
 * The price modes a new buy may use. The legacy `agent` mode is left out on purpose.
 */
export const BUY_PRICE_MODES = ['manual', 'market', 'agent_conservative', 'agent_moderate', 'agent_aggressive'] as const;

/**
 * Result of a validation: either the typed value, or one error message.
 */
export type Validation<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Checks the body of a buy request.
 *
 * @remarks
 * Shared by the Lambda handler, the Hono app and the Azure Function, so the same input gets the same
 * answer everywhere. It stops at the first problem and reports one message. It checks presence and
 * type only: it does not trim, change case, or look the symbol up, and a `bid_price` sent with a
 * non-manual mode is ignored.
 *
 * @param body - Parsed JSON; `null`, `undefined` or a non-object counts as an empty request.
 * @returns `ok: true` with the request, or `ok: false` with the message to return as a 400.
 */
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

/**
 * Checks the body of a create-customer request.
 *
 * @remarks
 * Shared by the Lambda handler and the Hono app. Only `customer_name` is required, as a non-empty string; it is
 * not trimmed. `fullname`, `email` and `allowed_contact` are optional: `null` counts as not sent, and a value of
 * the wrong type is an error (so `"false"` is rejected, not read as false). The email format is not checked. Any
 * other field, including `crm_managed`, is dropped from the result.
 *
 * @param body - Parsed JSON; `null`, `undefined` or a non-object counts as an empty request.
 * @returns `ok: true` with the request, or `ok: false` with the message to return as a 400.
 */
export function validateCreateCustomerRequest(body: unknown): Validation<CreateCustomerRequest> {
  const raw = (body ?? {}) as Record<string, unknown>;
  const { customer_name, fullname, email, allowed_contact } = raw;

  if (typeof customer_name !== 'string' || customer_name === '') {
    return { ok: false, error: 'customer_name is required' };
  }
  for (const [field, value] of [['fullname', fullname], ['email', email]] as const) {
    if (value != null && typeof value !== 'string') return { ok: false, error: `${field} must be a string` };
  }
  if (allowed_contact != null && typeof allowed_contact !== 'boolean') {
    return { ok: false, error: 'allowed_contact must be a boolean' };
  }
  return {
    ok: true,
    value: {
      customer_name,
      ...(fullname != null && { fullname: fullname as string }),
      ...(email != null && { email: email as string }),
      ...(allowed_contact != null && { allowed_contact: allowed_contact as boolean }),
    },
  };
}
