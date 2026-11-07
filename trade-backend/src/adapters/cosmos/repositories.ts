import { Container, CosmosClient, Database } from '@azure/cosmos';
import { Customer, CustomerAlreadyExistsError } from '../../core/models/customer';
import { MarketPrice } from '../../core/models/marketPrice';
import { MarketSymbol } from '../../core/models/marketSymbol';
import { Trade } from '../../core/models/trade';
import { CustomerRepository, MarketPriceRepository, MarketSymbolRepository, TradeRepository } from '../../core/ports';

/**
 * Cosmos DB (NoSQL API) adapter.
 *
 * @remarks
 * Containers are created by `deploy/azure-terraform`:
 *
 * - `market_price`: partition key `/symbol`, `id` = symbol
 * - `market_symbol`: partition key `/symbol`, `id` = symbol
 * - `trade`: partition key `/trade_id`, `id` = trade_id
 * - `customers`: partition key `/customer_name`, `id` = the URL-encoded customer_name
 *
 * Trades are partitioned by `trade_id` so that create and sell are point operations. Listing by customer is a
 * cross-partition query, which is fine at demo scale but costs more request units as the data grows.
 *
 * @packageDocumentation
 */

const SYSTEM_FIELDS = ['id', '_rid', '_self', '_etag', '_attachments', '_ts'];

/** Removes `id` and the `_`-prefixed system fields Cosmos adds, so documents match the API contract exactly. */
function clean<T>(doc: Record<string, unknown>): T {
  const copy = { ...doc };
  for (const field of SYSTEM_FIELDS) delete copy[field];
  return copy as T;
}

/**
 * Trades in Cosmos DB.
 *
 * @remarks
 * `create` fails with a conflict error if the `trade_id` already exists. `markSold` is a conditional patch
 * that matches on the timestamp too; an unknown id or a wrong timestamp is swallowed (HTTP 404 or 412), as in
 * the other adapters, and any other error is rethrown.
 */
export class CosmosTradeRepository implements TradeRepository {
  constructor(private container: Container) {}

  async create(trade: Trade): Promise<void> {
    await this.container.items.create({ id: trade.trade_id, ...trade });
  }

  async markSold(tradeId: string, tradeTimestamp: string): Promise<void> {
    try {
      // Patch conditions cannot take parameters, so the client-supplied timestamp is escaped into the string.
      const ts = tradeTimestamp.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      await this.container.item(tradeId, tradeId).patch({
        condition: `FROM c WHERE c.trade_timestamp = '${ts}'`,
        operations: [{ op: 'set', path: '/status_sell', value: true }],
      });
    } catch (error: any) {
      // Unknown trade or timestamp mismatch: nothing to update (same as the SQLite adapter).
      if (error?.code !== 404 && error?.code !== 412) throw error;
    }
  }

  async listAll(): Promise<Trade[]> {
    const { resources } = await this.container.items.query('SELECT * FROM c').fetchAll();
    return resources.map((doc) => clean<Trade>(doc));
  }

  async listByCustomer(customerName: string): Promise<Trade[]> {
    const { resources } = await this.container.items
      .query({
        query: 'SELECT * FROM c WHERE c.customer_name = @customer ORDER BY c.trade_timestamp DESC',
        parameters: [{ name: '@customer', value: customerName }],
      })
      .fetchAll();
    return resources.map((doc) => clean<Trade>(doc));
  }
}

/**
 * Market prices in Cosmos DB. Reads are point reads by symbol, exact and case-sensitive.
 */
export class CosmosMarketPriceRepository implements MarketPriceRepository {
  constructor(private container: Container) {}

  async listAll(): Promise<MarketPrice[]> {
    const { resources } = await this.container.items.query('SELECT * FROM c').fetchAll();
    return resources.map((doc) => clean<MarketPrice>(doc));
  }

  async getBySymbol(symbol: string): Promise<MarketPrice | null> {
    const { resource } = await this.container.item(symbol, symbol).read();
    return resource ? clean<MarketPrice>(resource) : null;
  }
}

/**
 * Company data in Cosmos DB. The symbol is upper-cased before the point read.
 */
export class CosmosMarketSymbolRepository implements MarketSymbolRepository {
  constructor(private container: Container) {}

  async getBySymbol(symbol: string): Promise<MarketSymbol | null> {
    const key = symbol.toUpperCase();
    const { resource } = await this.container.item(key, key).read();
    return resource ? clean<MarketSymbol>(resource) : null;
  }
}

/**
 * Customers in Cosmos DB.
 *
 * @remarks
 * Reads are point reads. Cosmos forbids `/`, `\`, `?` and `#` in an `id`, so `id` is the URL-encoded name while
 * the partition key stays the raw name; the encoded `id` is removed from results. `create` reports an existing
 * name (HTTP 409) as `CustomerAlreadyExistsError`.
 */
export class CosmosCustomerRepository implements CustomerRepository {
  constructor(private container: Container) {}

  async create(customer: Customer): Promise<void> {
    try {
      await this.container.items.create({ id: encodeURIComponent(customer.customer_name), ...customer });
    } catch (error: any) {
      if (error?.code === 409) throw new CustomerAlreadyExistsError(customer.customer_name);
      throw error;
    }
  }

  async getByName(customerName: string): Promise<Customer | null> {
    const { resource } = await this.container.item(encodeURIComponent(customerName), customerName).read();
    return resource ? clean<Customer>(resource) : null;
  }
}

/**
 * Builds the four repositories on one database.
 *
 * @param database - Handle from `openCosmosDatabase`; the `trade`, `market_price`, `market_symbol` and
 * `customers` containers must already exist.
 */
export function createCosmosRepositories(database: Database) {
  return {
    trades: new CosmosTradeRepository(database.container('trade')),
    prices: new CosmosMarketPriceRepository(database.container('market_price')),
    symbols: new CosmosMarketSymbolRepository(database.container('market_symbol')),
    customers: new CosmosCustomerRepository(database.container('customers')),
  };
}

/**
 * Connects to a Cosmos DB database.
 *
 * @remarks
 * Passwordless by default: `DefaultAzureCredential` uses the Function App's managed identity, or your
 * `az login` on a developer machine. The account has key access switched off, so a key works only against the
 * local emulator. The connection is lazy: nothing is sent until the first query, so a wrong endpoint or a
 * missing role shows up then (a 403 can last a few minutes after a role assignment).
 *
 * @param endpoint - Account URL, such as `https://name.documents.azure.com:443/`.
 * @param databaseName - Database holding the four containers.
 * @param key - Emulator key; omit it everywhere else.
 */
export async function openCosmosDatabase(endpoint: string, databaseName: string, key?: string): Promise<Database> {
  if (key) return new CosmosClient({ endpoint, key }).database(databaseName);
  const { DefaultAzureCredential } = await import('@azure/identity');
  return new CosmosClient({ endpoint, aadCredentials: new DefaultAzureCredential() }).database(databaseName);
}
