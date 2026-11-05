import { MarketPrice } from './models/marketPrice';
import { MarketSymbol } from './models/marketSymbol';
import { Trade } from './models/trade';

// Ports: the storage contract the business logic depends on.
// Each database (DynamoDB, SQLite, Cosmos DB) provides one adapter per port.

export interface TradeRepository {
  create(trade: Trade): Promise<void>;
  markSold(tradeId: string, tradeTimestamp: string): Promise<void>;
  listAll(): Promise<Trade[]>;
  /** Newest first by trade_timestamp, like the DynamoDB GSI query. */
  listByCustomer(customerName: string): Promise<Trade[]>;
}

export interface MarketPriceRepository {
  listAll(): Promise<MarketPrice[]>;
  getBySymbol(symbol: string): Promise<MarketPrice | null>;
}

export interface MarketSymbolRepository {
  getBySymbol(symbol: string): Promise<MarketSymbol | null>;
}
