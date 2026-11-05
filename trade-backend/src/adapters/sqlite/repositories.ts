import { and, desc, eq } from 'drizzle-orm';
import { MarketPrice } from '../../core/models/marketPrice';
import { MarketSymbol } from '../../core/models/marketSymbol';
import { Trade } from '../../core/models/trade';
import { MarketPriceRepository, MarketSymbolRepository, TradeRepository } from '../../core/ports';
import { SqliteDb } from './db';
import { marketPrice, marketSymbol, trade } from './schema';

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

export class SqliteMarketPriceRepository implements MarketPriceRepository {
  constructor(private db: SqliteDb) {}

  async listAll(): Promise<MarketPrice[]> {
    return this.db.select().from(marketPrice).all();
  }

  async getBySymbol(symbol: string): Promise<MarketPrice | null> {
    return this.db.select().from(marketPrice).where(eq(marketPrice.symbol, symbol)).get() ?? null;
  }
}

export class SqliteMarketSymbolRepository implements MarketSymbolRepository {
  constructor(private db: SqliteDb) {}

  async getBySymbol(symbol: string): Promise<MarketSymbol | null> {
    return this.db.select().from(marketSymbol).where(eq(marketSymbol.symbol, symbol.toUpperCase())).get() ?? null;
  }
}

export function createSqliteRepositories(db: SqliteDb) {
  return {
    trades: new SqliteTradeRepository(db),
    prices: new SqliteMarketPriceRepository(db),
    symbols: new SqliteMarketSymbolRepository(db),
  };
}
