import { v4 as uuidv4 } from 'uuid';
import { BuyStockRequest, Trade } from './models/trade';
import { MarketPriceRepository, TradeRepository } from './ports';
import { computeExecution, formatTradeTimestamp, Rng } from './tradeEngine';

/**
 * Thrown when a buy names a symbol that has no market price.
 *
 * @remarks
 * The HTTP layers map it to 404 and show its message to the client.
 */
export class SymbolNotAvailableError extends Error {
  constructor(symbol: string) {
    super(`Symbol "${symbol}" is not available`);
    this.name = 'SymbolNotAvailableError';
  }
}

/**
 * Test seams for `TradeService`; production code passes none of them.
 */
export interface TradeServiceOptions {
  /** Random source for pricing; defaults to `Math.random`. */
  rng?: Rng;
  /** Clock used for `trade_timestamp`; defaults to the current time. */
  now?: () => Date;
  /** Trade id generator; defaults to a random UUID. */
  newId?: () => string;
}

/**
 * The business operations on trades, written once and used by every target.
 *
 * @remarks
 * The AWS Lambda handlers and the Hono app (local, Kubernetes, Azure) both call this class, so a rule
 * change is made here only. It holds no state between calls. It does not check that a customer exists or
 * limit how many trades they make.
 */
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

  /**
   * Prices and stores a buy.
   *
   * @remarks
   * The symbol is upper-cased before the lookup. The trade is stored even when it fails
   * (`status_trade` false, for example a manual bid at or below the lowest price); only an unknown symbol
   * prevents storing. `price_difference` is set to `close_price - executed_price`.
   *
   * @param request - A request that already passed `validateBuyStockRequest`; this method does not validate it.
   * @returns The stored trade, with a new `trade_id`.
   * @throws {@link SymbolNotAvailableError} If the symbol has no market price.
   */
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

  /**
   * Marks a trade as sold.
   *
   * @remarks
   * Does not check that the trade exists, that it succeeded, or that it is not already sold. A wrong id or
   * timestamp changes nothing and still resolves normally, so callers report success either way.
   *
   * @param tradeId - Id of the trade.
   * @param tradeTimestamp - Its `trade_timestamp`; both values form the key.
   */
  async sellTrade(tradeId: string, tradeTimestamp: string): Promise<void> {
    await this.trades.markSold(tradeId, tradeTimestamp);
  }

  /**
   * Returns every trade, in no guaranteed order.
   */
  listAllTrades(): Promise<Trade[]> {
    return this.trades.listAll();
  }

  /**
   * Returns one customer's trades, newest first.
   *
   * @param customerName - Exact, case-sensitive customer name.
   */
  listTradesByCustomer(customerName: string): Promise<Trade[]> {
    return this.trades.listByCustomer(customerName);
  }
}
