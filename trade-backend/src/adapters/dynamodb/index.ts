import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoCustomerRepository,
  DynamoMarketPriceRepository,
  DynamoMarketSymbolRepository,
  DynamoTradeRepository,
} from './repositories';

/**
 * Builds the four DynamoDB repositories for the AWS Lambda handlers.
 *
 * @remarks
 * Table names come from the environment variables `TRADE_TABLE`, `MARKET_PRICE_TABLE` and
 * `MARKET_SYMBOL_TABLE` and `CUSTOMERS_TABLE`, falling back to `trade`, `market_price`, `market_symbol` and
 * `customers`. Region and
 * credentials come from the Lambda environment. Nothing is checked here: a wrong table name shows up
 * as an error on the first request.
 */
export function createDynamoRepositories() {
  const client = new DynamoDBClient({});
  return {
    trades: new DynamoTradeRepository(client),
    prices: new DynamoMarketPriceRepository(client),
    symbols: new DynamoMarketSymbolRepository(client),
    customers: new DynamoCustomerRepository(client),
  };
}
