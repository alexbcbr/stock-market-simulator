import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoMarketPriceRepository,
  DynamoMarketSymbolRepository,
  DynamoTradeRepository,
} from './repositories';

/**
 * Builds the three DynamoDB repositories for the AWS Lambda handlers.
 *
 * @remarks
 * Table names come from the environment variables `TRADE_TABLE`, `MARKET_PRICE_TABLE` and
 * `MARKET_SYMBOL_TABLE`, falling back to `trade`, `market_price` and `market_symbol`. Region and
 * credentials come from the Lambda environment. Nothing is checked here: a wrong table name shows up
 * as an error on the first request.
 */
export function createDynamoRepositories() {
  const client = new DynamoDBClient({});
  return {
    trades: new DynamoTradeRepository(client),
    prices: new DynamoMarketPriceRepository(client),
    symbols: new DynamoMarketSymbolRepository(client),
  };
}
