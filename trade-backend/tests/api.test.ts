import { beforeEach, describe, expect, test } from 'bun:test';
import { openDatabase } from '../src/adapters/sqlite/db';
import { createSqliteRepositories } from '../src/adapters/sqlite/repositories';
import { marketPrice } from '../src/adapters/sqlite/schema';
import { createApp } from '../src/api/app';
import { TradeService } from '../src/core/tradeService';
import { AAPL } from './helpers';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  const db = openDatabase(':memory:');
  db.insert(marketPrice).values(AAPL).run();
  const repos = createSqliteRepositories(db);
  app = createApp({
    tradeService: new TradeService(repos.trades, repos.prices, { rng: () => 0 }),
    prices: repos.prices,
    symbols: repos.symbols,
    customers: repos.customers,
  });
});

const post = (path: string, body: unknown) =>
  app.request(`/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });

describe('API contract', () => {
  test('buyStock returns 201 and a plain-JSON trade', async () => {
    const res = await post('buyStock', { symbol: 'aapl', customer_name: 'alex', price_mode: 'agent_aggressive' });
    expect(res.status).toBe(201);
    const trade = await res.json();
    expect(trade).toMatchObject({ symbol: 'AAPL', executed_price: 100, status_trade: true, status_sell: false });
  });

  test.each([
    [{ symbol: 'AAPL' }, 'Missing required fields'],
    [{ symbol: 'AAPL', customer_name: 'a', price_mode: 'nope' }, 'price_mode must be one of'],
    [{ symbol: 'AAPL', customer_name: 'a', price_mode: 'agent' }, 'price_mode must be one of'],
    [{ symbol: 'AAPL', customer_name: 'a', price_mode: 'manual' }, 'bid_price is required'],
  ])('buyStock %j -> 400', async (body, message) => {
    const res = await post('buyStock', body);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain(message);
  });

  test('buyStock malformed JSON -> 400, unknown symbol -> 404', async () => {
    expect((await post('buyStock', '{oops')).status).toBe(400);
    const res = await post('buyStock', { symbol: 'ZZZ', customer_name: 'a', price_mode: 'market' });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Symbol "ZZZ" is not available' });
  });

  test('buy, list by customer, sell round trip', async () => {
    const trade = await (await post('buyStock', { symbol: 'AAPL', customer_name: 'alex', price_mode: 'market' })).json();
    const list = await (await post('listTradesByCustomerName', { customer_name: 'alex' })).json();
    expect(list.map((t: any) => t.trade_id)).toEqual([trade.trade_id]);
    expect((await post('listTradesByCustomerName', {})).status).toBe(400);

    const sold = await post('sellStock', { trade_id: trade.trade_id, trade_timestamp: trade.trade_timestamp });
    expect(await sold.json()).toEqual({ success: true });
    const all = await (await app.request('/listAllTrades')).json();
    expect(all[0].status_sell).toBe(true);
    expect((await post('sellStock', {})).status).toBe(400);
  });

  test('market price and symbol lookups', async () => {
    expect((await app.request('/getMarketPrice?symbol=AAPL')).status).toBe(200);
    expect((await app.request('/getMarketPrice?symbol=NOPE')).status).toBe(404);
    expect((await app.request('/getMarketPrice')).status).toBe(400);
    expect((await app.request('/getMarketSymbol?symbol=NOPE')).status).toBe(404);
    expect(await (await app.request('/listMarketPrices')).json()).toEqual([AAPL]);
  });

  test('createCustomer applies defaults and getCustomer returns the stored customer', async () => {
    const res = await post('createCustomer', { customer_name: 'alex' });
    expect(res.status).toBe(201);
    const expected = { customer_name: 'alex', fullname: null, email: null, allowed_contact: false, crm_managed: false };
    expect(await res.json()).toEqual(expected);
    const found = await app.request('/getCustomer?customer_name=alex');
    expect(found.status).toBe(200);
    expect(await found.json()).toEqual(expected);
  });

  test('createCustomer stores the optional fields and always sets crm_managed to false', async () => {
    const res = await post('createCustomer', {
      customer_name: 'bob', fullname: 'Bob B', email: 'bob@example.com', allowed_contact: true, crm_managed: true,
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      customer_name: 'bob', fullname: 'Bob B', email: 'bob@example.com', allowed_contact: true, crm_managed: false,
    });
  });

  test.each([
    [{}, 'customer_name is required'],
    [{ customer_name: '' }, 'customer_name is required'],
    [{ customer_name: 5 }, 'customer_name is required'],
    [{ customer_name: 'a', allowed_contact: 'false' }, 'allowed_contact must be a boolean'],
    [{ customer_name: 'a', email: 1 }, 'email must be a string'],
    [{ customer_name: 'a', fullname: true }, 'fullname must be a string'],
  ])('createCustomer %j -> 400', async (body, message) => {
    const res = await post('createCustomer', body);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(message);
  });

  test('createCustomer malformed JSON -> 400, duplicate -> 409 and the stored customer is kept', async () => {
    expect((await post('createCustomer', '{oops')).status).toBe(400);
    await post('createCustomer', { customer_name: 'alex', allowed_contact: true });
    const dup = await post('createCustomer', { customer_name: 'alex', fullname: 'Other' });
    expect(dup.status).toBe(409);
    expect((await dup.json()).error).toContain('already exists');
    expect((await (await app.request('/getCustomer?customer_name=alex')).json()).fullname).toBeNull();
  });

  test('getCustomer: 404 for an unknown name, 400 without the parameter', async () => {
    expect((await app.request('/getCustomer?customer_name=nobody')).status).toBe(404);
    expect((await app.request('/getCustomer')).status).toBe(400);
  });

  test('customers and trades are independent: a trade needs no customer', async () => {
    const res = await post('buyStock', { symbol: 'AAPL', customer_name: 'ghost', price_mode: 'market' });
    expect(res.status).toBe(201);
    expect((await app.request('/getCustomer?customer_name=ghost')).status).toBe(404);
  });

  test('CORS header is present', async () => {
    const res = await app.request('/listMarketPrices', { headers: { Origin: 'http://x' } });
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });
});
