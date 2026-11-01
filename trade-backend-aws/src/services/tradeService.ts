import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Trade, BuyStockRequest } from '../models/trade';
import { MarketPriceService } from './marketPriceService';

export class TradeService {
  private client: DynamoDBClient;
  private tableName: string;
  private marketPriceService: MarketPriceService;

  constructor(client?: DynamoDBClient, tableName?: string) {
    this.client = client || new DynamoDBClient({});
    this.tableName = tableName || process.env.TRADE_TABLE || 'trade';
    this.marketPriceService = new MarketPriceService(this.client);
  }

  async createTrade(request: BuyStockRequest): Promise<Trade> {
    // Look up market price for the symbol
    const marketPrice = await this.marketPriceService.getBySymbol(request.symbol.toUpperCase());
    if (!marketPrice) {
      throw new Error(`Symbol "${request.symbol}" is not available`);
    }

    const { open_price, close_price, highest_price, lowest_price } = marketPrice;

    let executedPrice: number;
    let statusTrade: boolean;

    if (request.price_mode === 'agent_aggressive') {
      // Aggressive: lowest_price to lowest + 50% of range
      const range = highest_price - lowest_price;
      executedPrice = +(lowest_price + Math.random() * 0.5 * range).toFixed(2);
      statusTrade = true;

    } else if (request.price_mode === 'agent_moderate') {
      // Moderate: lowest + 5% to lowest + 45% of range
      const range = highest_price - lowest_price;
      executedPrice = +(lowest_price + (0.05 + Math.random() * 0.40) * range).toFixed(2);
      statusTrade = true;

    } else if (request.price_mode === 'agent_conservative') {
      // Conservative: lowest + 10% to lowest + 40% of range
      const range = highest_price - lowest_price;
      executedPrice = +(lowest_price + (0.10 + Math.random() * 0.30) * range).toFixed(2);
      statusTrade = true;

    } else if (request.price_mode === 'market') {
      // Market: random between 48% and 100% of the interval (highest - lowest)
      const floor = lowest_price + 0.48 * (highest_price - lowest_price);
      executedPrice = +(floor + Math.random() * (highest_price - floor)).toFixed(2);
      statusTrade = true;

    } else {
      // Manual: executed price based on bid vs range, with random chance of failure
      const bidPrice = request.bid_price!;
      if (bidPrice >= highest_price) {
        executedPrice = highest_price;
        statusTrade = true;
      } else if (bidPrice <= lowest_price) {
        executedPrice = bidPrice;
        statusTrade = false;
      } else {
        const randomInInterval = lowest_price + Math.random() * (highest_price - lowest_price);
        const failureThreshold = lowest_price + 0.45 * (highest_price - lowest_price);
        executedPrice = bidPrice;
        statusTrade = randomInInterval > failureThreshold;
      }
    }

    const priceDifference = close_price - executedPrice;
    const tradeId = uuidv4();
    
    // Get current time in Seattle timezone (HH:MM:SS format)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const trade_timestamp = formatter.format(now);

    const trade: Trade = {
      trade_id: tradeId,
      symbol: request.symbol.toUpperCase(),
      customer_name: request.customer_name,
      executed_price: executedPrice,
      open_price,
      close_price,
      price_difference: priceDifference,
      status_trade: statusTrade,
      status_sell: false,
      trade_source: request.price_mode,
      trade_timestamp,
    };

    await this.client.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(trade),
      })
    );

    return trade;
  }
}
