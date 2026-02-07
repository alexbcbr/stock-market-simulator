import { DynamoDBClient, ScanCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { MarketPrice } from '../models/marketPrice';

export class MarketPriceService {
  private client: DynamoDBClient;
  private tableName: string;

  constructor(client?: DynamoDBClient, tableName?: string) {
    this.client = client || new DynamoDBClient({});
    this.tableName = tableName || process.env.MARKET_PRICE_TABLE || 'market_price';
  }

  async listAll(): Promise<MarketPrice[]> {
    const result = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
      })
    );

    return (result.Items || []).map(
      (item) => unmarshall(item) as MarketPrice
    );
  }

  async getBySymbol(symbol: string): Promise<MarketPrice | null> {
    const result = await this.client.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: {
          symbol: { S: symbol },
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    return unmarshall(result.Item) as MarketPrice;
  }
}
