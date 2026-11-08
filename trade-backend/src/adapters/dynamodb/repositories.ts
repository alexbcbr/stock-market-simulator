import {
  ConditionalCheckFailedException,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Customer, CustomerAlreadyExistsError } from '../../core/models/customer';
import { MarketPrice } from '../../core/models/marketPrice';
import { MarketSymbol } from '../../core/models/marketSymbol';
import { Trade } from '../../core/models/trade';
import { CustomerRepository, MarketPriceRepository, MarketSymbolRepository, TradeRepository } from '../../core/ports';

/**
 * Trades in DynamoDB.
 *
 * @remarks
 * Key: `trade_id` plus `trade_timestamp`. Listing by customer uses the `idx_trade_customer_name` index
 * with the timestamp descending. `create` is a plain put, so an existing key is overwritten without
 * error. `listAll` is a single scan with no paging and returns at most about 1 MB; the same limit
 * applies to the customer query.
 */
export class DynamoTradeRepository implements TradeRepository {
  constructor(
    private client: DynamoDBClient,
    private tableName = process.env.TRADE_TABLE || 'trade',
    private customerIndex = 'idx_trade_customer_name'
  ) {}

  async create(trade: Trade): Promise<void> {
    await this.client.send(new PutItemCommand({ TableName: this.tableName, Item: marshall(trade) }));
  }

  async markSold(tradeId: string, tradeTimestamp: string): Promise<void> {
    await this.client.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: { trade_id: { S: tradeId }, trade_timestamp: { S: tradeTimestamp } },
        UpdateExpression: 'SET status_sell = :val',
        ExpressionAttributeValues: { ':val': { BOOL: true } },
      })
    );
  }

  async listAll(): Promise<Trade[]> {
    const result = await this.client.send(new ScanCommand({ TableName: this.tableName }));
    return (result.Items || []).map((item) => unmarshall(item) as Trade);
  }

  async listByCustomer(customerName: string): Promise<Trade[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: this.customerIndex,
        KeyConditionExpression: 'customer_name = :c',
        ExpressionAttributeValues: { ':c': { S: customerName } },
        ScanIndexForward: false,
      })
    );
    return (result.Items || []).map((item) => unmarshall(item) as Trade);
  }
}

/**
 * Market prices in DynamoDB. Symbol matching is exact and case-sensitive. `listAll` is an unpaged scan
 * (about 1 MB maximum).
 */
export class DynamoMarketPriceRepository implements MarketPriceRepository {
  constructor(
    private client: DynamoDBClient,
    private tableName = process.env.MARKET_PRICE_TABLE || 'market_price'
  ) {}

  async listAll(): Promise<MarketPrice[]> {
    const result = await this.client.send(new ScanCommand({ TableName: this.tableName }));
    return (result.Items || []).map((item) => unmarshall(item) as MarketPrice);
  }

  async getBySymbol(symbol: string): Promise<MarketPrice | null> {
    const result = await this.client.send(
      new GetItemCommand({ TableName: this.tableName, Key: { symbol: { S: symbol } } })
    );
    return result.Item ? (unmarshall(result.Item) as MarketPrice) : null;
  }
}

/**
 * Company data in DynamoDB. The symbol is upper-cased before the lookup, and only the eight contract
 * fields are returned.
 */
export class DynamoMarketSymbolRepository implements MarketSymbolRepository {
  constructor(
    private client: DynamoDBClient,
    private tableName = process.env.MARKET_SYMBOL_TABLE || 'market_symbol'
  ) {}

  async getBySymbol(symbol: string): Promise<MarketSymbol | null> {
    const result = await this.client.send(
      new GetItemCommand({ TableName: this.tableName, Key: { symbol: { S: symbol.toUpperCase() } } })
    );
    if (!result.Item) return null;
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

/**
 * Customers in DynamoDB. Key: `customer_name`. `create` is a conditional put, so an existing name is reported as
 * `CustomerAlreadyExistsError` instead of being overwritten. Reads are point reads, exact and case-sensitive; only
 * the five contract fields are returned, and a missing `fullname` or `email` comes back as `null`.
 */
export class DynamoCustomerRepository implements CustomerRepository {
  constructor(
    private client: DynamoDBClient,
    private tableName = process.env.CUSTOMERS_TABLE || 'customers'
  ) {}

  async create(customer: Customer): Promise<void> {
    try {
      await this.client.send(
        new PutItemCommand({
          TableName: this.tableName,
          Item: marshall(customer),
          ConditionExpression: 'attribute_not_exists(customer_name)',
        })
      );
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) throw new CustomerAlreadyExistsError(customer.customer_name);
      throw error;
    }
  }

  async getByName(customerName: string): Promise<Customer | null> {
    const result = await this.client.send(
      new GetItemCommand({ TableName: this.tableName, Key: { customer_name: { S: customerName } } })
    );
    if (!result.Item) return null;
    const item = unmarshall(result.Item) as any;
    return {
      customer_name: item.customer_name,
      fullname: item.fullname ?? null,
      email: item.email ?? null,
      date_of_birth: item.date_of_birth ?? null,
      state_residence: item.state_residence ?? null,
      allowed_contact: item.allowed_contact,
      crm_managed: item.crm_managed,
    };
  }
}
