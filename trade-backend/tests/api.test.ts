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

  test('CORS header is present', async () => {
    const res = await app.request('/listMarketPrices', { headers: { Origin: 'http://x' } });
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });
});
