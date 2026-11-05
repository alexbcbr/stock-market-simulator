import { describe, expect, test } from 'bun:test';
import { SymbolNotAvailableError, TradeService } from '../src/core/tradeService';
import { AAPL, InMemoryMarketPriceRepository, InMemoryTradeRepository } from './helpers';

function setup() {
  const trades = new InMemoryTradeRepository();
  const service = new TradeService(trades, new InMemoryMarketPriceRepository([AAPL]), {
    rng: () => 0,
    now: () => new Date('2026-01-15T20:30:45Z'), // 12:30:45 in Los Angeles
    newId: () => 'id-1',
  });
  return { trades, service };
}

describe('TradeService', () => {
  test('creates and persists a trade with derived fields', async () => {
    const { trades, service } = setup();
    const trade = await service.createTrade({ symbol: 'aapl', customer_name: 'alex', price_mode: 'agent_aggressive' });
    expect(trade).toEqual({
      trade_id: 'id-1', symbol: 'AAPL', customer_name: 'alex', executed_price: 100,
      open_price: 100, close_price: 110, price_difference: 10, status_trade: true,
      status_sell: false, trade_source: 'agent_aggressive', trade_timestamp: '12:30:45',
    });
    expect(trades.trades).toHaveLength(1);
  });

  test('unknown symbol throws SymbolNotAvailableError and stores nothing', async () => {
    const { trades, service } = setup();
    const p = service.createTrade({ symbol: 'ZZZ', customer_name: 'alex', price_mode: 'market' });
    await expect(p).rejects.toBeInstanceOf(SymbolNotAvailableError);
    await expect(p).rejects.toThrow('Symbol "ZZZ" is not available');
    expect(trades.trades).toHaveLength(0);
  });

  test('sellTrade marks the trade as sold', async () => {
    const { trades, service } = setup();
    const t = await service.createTrade({ symbol: 'AAPL', customer_name: 'alex', price_mode: 'market' });
    await service.sellTrade(t.trade_id, t.trade_timestamp);
    expect(trades.trades[0].status_sell).toBe(true);
  });

  test('listTradesByCustomer filters by customer', async () => {
    const { service } = setup();
    await service.createTrade({ symbol: 'AAPL', customer_name: 'alex', price_mode: 'market' });
    await service.createTrade({ symbol: 'AAPL', customer_name: 'bob', price_mode: 'market' });
    expect(await service.listAllTrades()).toHaveLength(2);
    expect((await service.listTradesByCustomer('bob')).map((t) => t.customer_name)).toEqual(['bob']);
  });
});
