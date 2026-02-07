import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Trade, BuyStockRequest } from '../models/trade';

export class TradeService {
  private client: DynamoDBClient;
  private tableName: string;

  constructor(client?: DynamoDBClient, tableName?: string) {
    this.client = client || new DynamoDBClient({});
    this.tableName = tableName || process.env.TRADE_TABLE || 'trade';
  }

  async createTrade(request: BuyStockRequest): Promise<Trade> {
    // Business logic: calculate price difference
    const priceDifference = request.executed_price - request.open_price;

    // Generate unique trade ID
    const tradeId = uuidv4();

    // Create trade object
    const trade: Trade = {
      trade_id: tradeId,
      symbol: request.symbol.toUpperCase(),
      customer_name: request.customer_name,
      executed_price: request.executed_price,
      open_price: request.open_price,
      close_price: request.close_price,
      price_difference: priceDifference,
      status_trade: request.status_trade,
    };

    // Persist to DynamoDB
    await this.client.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(trade),
      })
    );

    return trade;
  }
}
