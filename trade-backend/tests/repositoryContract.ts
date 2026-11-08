import { describe, expect, test } from 'bun:test';
import { Customer, CustomerAlreadyExistsError } from '../src/core/models/customer';
import { Trade } from '../src/core/models/trade';
import { CustomerRepository, MarketPriceRepository, TradeRepository } from '../src/core/ports';

export const sampleTrade = (over: Partial<Trade> = {}): Trade => ({
  trade_id: 'id-1', symbol: 'AAPL', customer_name: 'alex', executed_price: 101.5, open_price: 100,
  close_price: 110, price_difference: 8.5, status_trade: true, status_sell: false,
  trade_source: 'market', trade_timestamp: '10:00:00', ...over,
});

/** Behavior every TradeRepository (in-memory, SQLite, DynamoDB, Cosmos) must have. */
export function tradeRepositoryContract(name: string, make: () => TradeRepository | Promise<TradeRepository>) {
  describe(`TradeRepository contract: ${name}`, () => {
    test('create then listAll returns the trade unchanged', async () => {
      const repo = await make();
      await repo.create(sampleTrade());
      expect(await repo.listAll()).toEqual([sampleTrade()]);
    });

    test('listByCustomer filters and sorts newest first', async () => {
      const repo = await make();
      await repo.create(sampleTrade({ trade_id: 'a', trade_timestamp: '09:00:00' }));
      await repo.create(sampleTrade({ trade_id: 'b', trade_timestamp: '11:00:00' }));
      await repo.create(sampleTrade({ trade_id: 'c', trade_timestamp: '10:00:00' }));
      await repo.create(sampleTrade({ trade_id: 'd', customer_name: 'bob' }));
      expect((await repo.listByCustomer('alex')).map((t) => t.trade_id)).toEqual(['b', 'c', 'a']);
      expect(await repo.listByCustomer('nobody')).toEqual([]);
    });

    test('markSold flips status_sell only for the matching key', async () => {
      const repo = await make();
      await repo.create(sampleTrade({ trade_id: 'a' }));
      await repo.create(sampleTrade({ trade_id: 'b' }));
      await repo.markSold('a', '10:00:00');
      const byId = Object.fromEntries((await repo.listAll()).map((t) => [t.trade_id, t.status_sell]));
      expect(byId).toEqual({ a: true, b: false });
    });

    test('markSold with the wrong timestamp or an unknown id changes nothing and does not throw', async () => {
      const repo = await make();
      await repo.create(sampleTrade({ trade_id: 'a' }));
      await repo.markSold('a', '23:59:59');
      await repo.markSold('missing', '10:00:00');
      expect((await repo.listAll()).map((t) => [t.trade_id, t.status_sell])).toEqual([['a', false]]);
    });
  });
}

export function marketPriceRepositoryContract(name: string, make: () => MarketPriceRepository | Promise<MarketPriceRepository>) {
  describe(`MarketPriceRepository contract: ${name}`, () => {
    test('getBySymbol returns the price or null', async () => {
      const repo = await make();
      const found = await repo.getBySymbol('AAPL');
      expect(found?.symbol).toBe('AAPL');
      expect(typeof found?.highest_price).toBe('number');
      expect(await repo.getBySymbol('NOPE')).toBeNull();
    });
    test('listAll returns every price', async () => {
      expect((await (await make()).listAll()).length).toBeGreaterThan(0);
    });
  });
}

export const sampleCustomer = (over: Partial<Customer> = {}): Customer => ({
  customer_name: 'alex', fullname: 'Alex Coqueiro', email: 'alex@example.com', company: 'Contoso',
  date_of_birth: '1990-04-12', state_residence: 'WA',
  allowed_contact: true, crm_managed: false, ...over,
});

/** Behavior every CustomerRepository (in-memory, SQLite, DynamoDB, Cosmos) must have. */
export function customerRepositoryContract(name: string, make: () => CustomerRepository | Promise<CustomerRepository>) {
  describe(`CustomerRepository contract: ${name}`, () => {
    test('create then getByName returns the customer unchanged', async () => {
      const repo = await make();
      await repo.create(sampleCustomer());
      expect(await repo.getByName('alex')).toEqual(sampleCustomer());
    });

    test('optional text fields come back as null', async () => {
      const repo = await make();
      await repo.create(sampleCustomer({ fullname: null, email: null, company: null, date_of_birth: null, state_residence: null, allowed_contact: false }));
      expect(await repo.getByName('alex')).toEqual(
        sampleCustomer({ fullname: null, email: null, company: null, date_of_birth: null, state_residence: null, allowed_contact: false })
      );
    });

    test('getByName is exact and case-sensitive, and returns null when missing', async () => {
      const repo = await make();
      await repo.create(sampleCustomer());
      expect(await repo.getByName('Alex')).toBeNull();
      expect(await repo.getByName('nobody')).toBeNull();
    });

    test('create with an existing name throws and keeps the stored customer', async () => {
      const repo = await make();
      await repo.create(sampleCustomer());
      await expect(repo.create(sampleCustomer({ fullname: 'Other', allowed_contact: false }))).rejects.toBeInstanceOf(
        CustomerAlreadyExistsError
      );
      expect(await repo.getByName('alex')).toEqual(sampleCustomer());
    });

    test('names with slashes, spaces and accents round-trip', async () => {
      const repo = await make();
      const odd = sampleCustomer({ customer_name: 'ana/maría #1?' });
      await repo.create(odd);
      expect(await repo.getByName('ana/maría #1?')).toEqual(odd);
    });
  });
}
