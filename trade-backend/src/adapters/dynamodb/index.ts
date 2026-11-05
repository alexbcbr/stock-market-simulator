import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoMarketPriceRepository,
  DynamoMarketSymbolRepository,
  DynamoTradeRepository,
} from './repositories';

/** Composition for the AWS Lambda handlers. Table names come from env vars. */
export function createDynamoRepositories() {
  const client = new DynamoDBClient({});
  return {
    trades: new DynamoTradeRepository(client),
    prices: new DynamoMarketPriceRepository(client),
    symbols: new DynamoMarketSymbolRepository(client),
  };
}
