import { v4 as uuidv4 } from 'uuid';
import { BuyStockRequest, Trade } from './models/trade';
import { MarketPriceRepository, TradeRepository } from './ports';
import { computeExecution, formatTradeTimestamp, Rng } from './tradeEngine';

export class SymbolNotAvailableError extends Error {
  constructor(symbol: string) {
    super(`Symbol "${symbol}" is not available`);
    this.name = 'SymbolNotAvailableError';
  }
}

export interface TradeServiceOptions {
  rng?: Rng;
  now?: () => Date;
  newId?: () => string;
}

export class TradeService {
  private rng: Rng;
  private now: () => Date;
  private newId: () => string;

  constructor(
    private trades: TradeRepository,
    private prices: MarketPriceRepository,
    options: TradeServiceOptions = {}
  ) {
    this.rng = options.rng ?? Math.random;
    this.now = options.now ?? (() => new Date());
    this.newId = options.newId ?? uuidv4;
  }

  async createTrade(request: BuyStockRequest): Promise<Trade> {
    const symbol = request.symbol.toUpperCase();
    const marketPrice = await this.prices.getBySymbol(symbol);
    if (!marketPrice) {
      throw new SymbolNotAvailableError(request.symbol);
    }

    const { executed_price, status_trade } = computeExecution(marketPrice, request, this.rng);

    const trade: Trade = {
      trade_id: this.newId(),
      symbol,
      customer_name: request.customer_name,
      executed_price,
      open_price: marketPrice.open_price,
      close_price: marketPrice.close_price,
      price_difference: marketPrice.close_price - executed_price,
      status_trade,
      status_sell: false,
      trade_source: request.price_mode,
      trade_timestamp: formatTradeTimestamp(this.now()),
    };

    await this.trades.create(trade);
    return trade;
  }

  async sellTrade(tradeId: string, tradeTimestamp: string): Promise<void> {
    await this.trades.markSold(tradeId, tradeTimestamp);
  }

  listAllTrades(): Promise<Trade[]> {
    return this.trades.listAll();
  }

  listTradesByCustomer(customerName: string): Promise<Trade[]> {
    return this.trades.listByCustomer(customerName);
  }
}
