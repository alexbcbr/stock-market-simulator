import { and, desc, eq } from 'drizzle-orm';
import { Customer, CustomerAlreadyExistsError } from '../../core/models/customer';
import { MarketPrice } from '../../core/models/marketPrice';
import { MarketSymbol } from '../../core/models/marketSymbol';
import { Trade } from '../../core/models/trade';
import { CustomerRepository, MarketPriceRepository, MarketSymbolRepository, TradeRepository } from '../../core/ports';
import { SqliteDb } from './db';
import { customers, marketPrice, marketSymbol, trade } from './schema';

/**
 * Trades in SQLite, through Drizzle.
 *
 * @remarks
 * Calls are synchronous underneath (`bun:sqlite`) and wrapped in promises to match the port.
 */
export class SqliteTradeRepository implements TradeRepository {
  constructor(private db: SqliteDb) {}

  async create(t: Trade): Promise<void> {
    this.db.insert(trade).values(t).run();
  }

  async markSold(tradeId: string, tradeTimestamp: string): Promise<void> {
    this.db
      .update(trade)
      .set({ status_sell: true })
      .where(and(eq(trade.trade_id, tradeId), eq(trade.trade_timestamp, tradeTimestamp)))
      .run();
  }

  async listAll(): Promise<Trade[]> {
    return this.db.select().from(trade).all() as Trade[];
  }

  async listByCustomer(customerName: string): Promise<Trade[]> {
    return this.db
      .select()
      .from(trade)
      .where(eq(trade.customer_name, customerName))
      .orderBy(desc(trade.trade_timestamp))
      .all() as Trade[];
  }
}

/**
 * Market prices in SQLite. Symbol matching is exact and case-sensitive.
 */
export class SqliteMarketPriceRepository implements MarketPriceRepository {
  constructor(private db: SqliteDb) {}

  async listAll(): Promise<MarketPrice[]> {
    return this.db.select().from(marketPrice).all();
  }

  async getBySymbol(symbol: string): Promise<MarketPrice | null> {
    return this.db.select().from(marketPrice).where(eq(marketPrice.symbol, symbol)).get() ?? null;
  }
}

/**
 * Company data in SQLite. The symbol is upper-cased before the lookup.
 */
export class SqliteMarketSymbolRepository implements MarketSymbolRepository {
  constructor(private db: SqliteDb) {}

  async getBySymbol(symbol: string): Promise<MarketSymbol | null> {
    return this.db.select().from(marketSymbol).where(eq(marketSymbol.symbol, symbol.toUpperCase())).get() ?? null;
  }
}

/**
 * Customers in SQLite. A duplicate name is detected by the primary key and reported as `CustomerAlreadyExistsError`.
 */
export class SqliteCustomerRepository implements CustomerRepository {
  constructor(private db: SqliteDb) {}

  async create(customer: Customer): Promise<void> {
    const inserted = this.db.insert(customers).values(customer).onConflictDoNothing().returning().all();
    if (inserted.length === 0) throw new CustomerAlreadyExistsError(customer.customer_name);
  }

  async getByName(customerName: string): Promise<Customer | null> {
    return this.db.select().from(customers).where(eq(customers.customer_name, customerName)).get() ?? null;
  }
}

/**
 * Builds the four repositories on one database.
 *
 * @param db - Handle from `openDatabase`.
 */
export function createSqliteRepositories(db: SqliteDb) {
  return {
    trades: new SqliteTradeRepository(db),
    prices: new SqliteMarketPriceRepository(db),
    symbols: new SqliteMarketSymbolRepository(db),
    customers: new SqliteCustomerRepository(db),
  };
}
