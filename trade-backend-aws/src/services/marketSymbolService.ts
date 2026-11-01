import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { MarketSymbol } from '../models/marketSymbol';

export class MarketSymbolService {
  private client: DynamoDBClient;
  private tableName: string;

  constructor(client?: DynamoDBClient, tableName?: string) {
    this.client = client || new DynamoDBClient({});
    this.tableName = tableName || process.env.MARKET_SYMBOL_TABLE || 'market_symbol';
  }

  async getBySymbol(symbol: string): Promise<MarketSymbol | null> {
    const result = await this.client.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: {
          symbol: { S: symbol.toUpperCase() },
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    const item = unmarshall(result.Item) as any;
    return {
      symbol: item.symbol,
      name: item.name,
      lastSale: item.lastSale,
      marketCap: item.marketCap,
      ipoYear: item.ipoYear,
      sector: item.sector,
      industry: item.industry,
      summaryQuote: item.summaryQuote,
    };
  }
}
