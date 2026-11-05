import { MarketPrice } from '../src/core/models/marketPrice';
import { Trade } from '../src/core/models/trade';
import { MarketPriceRepository, TradeRepository } from '../src/core/ports';

export class InMemoryTradeRepository implements TradeRepository {
  trades: Trade[] = [];
  async create(trade: Trade) { this.trades.push({ ...trade }); }
  async markSold(tradeId: string, tradeTimestamp: string) {
    const t = this.trades.find((x) => x.trade_id === tradeId && x.trade_timestamp === tradeTimestamp);
    if (t) t.status_sell = true;
  }
  async listAll() { return this.trades.map((t) => ({ ...t })); }
  async listByCustomer(customerName: string) {
    return this.trades
      .filter((t) => t.customer_name === customerName)
      .sort((a, b) => b.trade_timestamp.localeCompare(a.trade_timestamp));
  }
}

export class InMemoryMarketPriceRepository implements MarketPriceRepository {
  constructor(private items: MarketPrice[]) {}
  async listAll() { return this.items; }
  async getBySymbol(symbol: string) { return this.items.find((p) => p.symbol === symbol) ?? null; }
}

export const AAPL: MarketPrice = {
  symbol: 'AAPL', open_price: 100, close_price: 110, highest_price: 120, lowest_price: 100, volume: 1000,
};
