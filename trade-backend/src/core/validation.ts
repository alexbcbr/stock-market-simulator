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

/** Two-letter codes accepted for `state_residence`: the 50 US states and DC. */
export const US_STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA',
  'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR',
  'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const;

/** True when `value` is a real calendar date written `YYYY-MM-DD` that is not in the future (UTC). */
function isPastIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10);
}

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
 * not trimmed. `fullname`, `email`, `date_of_birth`, `state_residence` and `allowed_contact` are optional: `null` counts as not sent, and a value of
 * the wrong type is an error (so `"false"` is rejected, not read as false). The email format is not checked.
 * `date_of_birth` must be a real past or present date as `YYYY-MM-DD`; `state_residence` must be a US state code
 * (50 states and DC), accepted in any case and stored in upper case. Any
 * other field, including `crm_managed`, is dropped from the result.
 *
 * @param body - Parsed JSON; `null`, `undefined` or a non-object counts as an empty request.
 * @returns `ok: true` with the request, or `ok: false` with the message to return as a 400.
 */
export function validateCreateCustomerRequest(body: unknown): Validation<CreateCustomerRequest> {
  const raw = (body ?? {}) as Record<string, unknown>;
  const { customer_name, fullname, email, date_of_birth, state_residence, allowed_contact } = raw;

  if (typeof customer_name !== 'string' || customer_name === '') {
    return { ok: false, error: 'customer_name is required' };
  }
  for (const [field, value] of [['fullname', fullname], ['email', email], ['date_of_birth', date_of_birth], ['state_residence', state_residence]] as const) {
    if (value != null && typeof value !== 'string') return { ok: false, error: `${field} must be a string` };
  }
  if (date_of_birth != null && !isPastIsoDate(date_of_birth as string)) {
    return { ok: false, error: 'date_of_birth must be a valid past date in YYYY-MM-DD format' };
  }
  const state = state_residence != null ? (state_residence as string).toUpperCase() : undefined;
  if (state !== undefined && !(US_STATE_CODES as readonly string[]).includes(state)) {
    return { ok: false, error: 'state_residence must be a 2-letter US state code (for example WA or CA)' };
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
      ...(date_of_birth != null && { date_of_birth: date_of_birth as string }),
      ...(state !== undefined && { state_residence: state }),
      ...(allowed_contact != null && { allowed_contact: allowed_contact as boolean }),
    },
  };
}
