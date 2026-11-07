import { Customer } from './models/customer';
import { MarketPrice } from './models/marketPrice';
import { MarketSymbol } from './models/marketSymbol';
import { Trade } from './models/trade';

/**
 * Storage ports: the contract the business logic depends on.
 *
 * Each database (DynamoDB, SQLite, Cosmos DB) provides one adapter per port. All
 * adapters must pass the same repository contract tests, which is what keeps the
 * four deployment targets answering alike.
 *
 * @packageDocumentation
 */

/** Storage for trades. */
export interface TradeRepository {
  /**
   * Stores a new trade.
   *
   * @param trade - The trade to store. The caller supplies `trade_id` and `trade_timestamp`.
   * @throws If the database rejects the write. A duplicate key is an error on SQLite and Cosmos, and
   * silently replaces the item on DynamoDB.
   */
  create(trade: Trade): Promise<void>;
  /**
   * Sets `status_sell` to true on one trade.
   *
   * @remarks
   * Does nothing, and does not throw, when no trade matches both `tradeId` and
   * `tradeTimestamp`. The caller cannot tell a sale from a miss.
   *
   * @param tradeId - Id of the trade.
   * @param tradeTimestamp - Its `trade_timestamp`; part of the key, so a wrong value matches nothing.
   */
  markSold(tradeId: string, tradeTimestamp: string): Promise<void>;
  /**
   * Returns every trade.
   *
   * @remarks
   * No guaranteed order. The DynamoDB adapter uses an unpaged scan, which returns at most about 1 MB.
   */
  listAll(): Promise<Trade[]>;
  /**
   * Returns one customer's trades, newest first by `trade_timestamp`.
   *
   * @remarks
   * Matches the customer name exactly, case-sensitive. Because the timestamp has no date, "newest" is
   * only meaningful within one day.
   *
   * @param customerName - Exact customer name.
   * @returns The customer's trades; empty when there are none.
   */
  listByCustomer(customerName: string): Promise<Trade[]>;
}

/** Read-only storage for daily market prices; loaded by the seed scripts, never written by the API. */
export interface MarketPriceRepository {
  /** Returns every price. The DynamoDB adapter uses an unpaged scan (about 1 MB maximum). */
  listAll(): Promise<MarketPrice[]>;
  /**
   * Finds one symbol's price.
   *
   * @remarks
   * Every adapter matches the symbol exactly, so case matters. Callers that accept user input should
   * upper-case it first, as `TradeService.createTrade` does.
   *
   * @param symbol - Symbol such as `AAON`.
   * @returns The price, or `null` when the symbol is not loaded.
   */
  getBySymbol(symbol: string): Promise<MarketPrice | null>;
}

/** Read-only storage for company reference data. */
export interface MarketSymbolRepository {
  /**
   * Finds one symbol's company data.
   *
   * @param symbol - Symbol in any case; every adapter upper-cases it.
   * @returns The data, or `null` when the symbol is unknown.
   */
  getBySymbol(symbol: string): Promise<MarketSymbol | null>;
}

/** Storage for customers. Nothing links it to `TradeRepository`: no foreign key, no check on either side. */
export interface CustomerRepository {
  /**
   * Stores a new customer.
   *
   * @param customer - The customer to store.
   * @throws CustomerAlreadyExistsError If `customer_name` is already stored; the stored customer is left as it was.
   * Every adapter does this, unlike `TradeRepository.create`.
   */
  create(customer: Customer): Promise<void>;
  /**
   * Finds one customer.
   *
   * @remarks
   * Matches the name exactly, case-sensitive, like `TradeRepository.listByCustomer`.
   *
   * @param customerName - Exact customer name.
   * @returns The customer, or `null` when there is none.
   */
  getByName(customerName: string): Promise<Customer | null>;
}
