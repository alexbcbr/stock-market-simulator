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

    if (request.price_mode === 'agent') {
      // Agent: random between 70% and 100% of highest_price
      executedPrice = +(highest_price * (0.7 + Math.random() * 0.3)).toFixed(2);
      statusTrade = true;
    } else if (request.price_mode === 'market') {
      // Market: random between lowest_price and 72% of highest_price
      const ceiling = highest_price * 0.72;
      executedPrice = +(lowest_price + Math.random() * (ceiling - lowest_price)).toFixed(2);
      statusTrade = true;
    } else {
      // Manual: adjust price and status based on thresholds
      const bidPrice = request.bid_price!;
      const threshold = lowest_price + 0.45 * (highest_price - lowest_price);
      if (bidPrice < lowest_price) {
        executedPrice = lowest_price;
        statusTrade = true;
      } else if (bidPrice <= threshold) {
        executedPrice = bidPrice;
        statusTrade = true;
      } else {
        executedPrice = bidPrice;
        statusTrade = false;
      }
    }

    const priceDifference = executedPrice - open_price;
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
