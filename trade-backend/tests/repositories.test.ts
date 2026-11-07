import { openDatabase } from '../src/adapters/sqlite/db';
import { createSqliteRepositories } from '../src/adapters/sqlite/repositories';
import { marketPrice, marketSymbol } from '../src/adapters/sqlite/schema';
import { AAPL, InMemoryCustomerRepository, InMemoryMarketPriceRepository, InMemoryTradeRepository } from './helpers';
import { customerRepositoryContract, marketPriceRepositoryContract, tradeRepositoryContract } from './repositoryContract';
import { describe, expect, test } from 'bun:test';

const sqlite = () => {
  const db = openDatabase(':memory:');
  db.insert(marketPrice).values(AAPL).run();
  db.insert(marketSymbol).values({
    symbol: 'AAPL', name: 'Apple', lastSale: '1', marketCap: '1', ipoYear: '1980',
    sector: 'Tech', industry: 'Hardware', summaryQuote: 'x',
  }).run();
  return createSqliteRepositories(db);
};

tradeRepositoryContract('in-memory', () => new InMemoryTradeRepository());
tradeRepositoryContract('sqlite', () => sqlite().trades);
marketPriceRepositoryContract('in-memory', () => new InMemoryMarketPriceRepository([AAPL]));
marketPriceRepositoryContract('sqlite', () => sqlite().prices);

customerRepositoryContract('in-memory', () => new InMemoryCustomerRepository());
customerRepositoryContract('sqlite', () => sqlite().customers);

describe('SqliteMarketSymbolRepository', () => {
  test('getBySymbol is case-insensitive and returns null when missing', async () => {
    const repo = sqlite().symbols;
    expect((await repo.getBySymbol('aapl'))?.name).toBe('Apple');
    expect(await repo.getBySymbol('NOPE')).toBeNull();
  });
});
