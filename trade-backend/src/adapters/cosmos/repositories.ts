import { Container, CosmosClient, Database } from '@azure/cosmos';
import { MarketPrice } from '../../core/models/marketPrice';
import { MarketSymbol } from '../../core/models/marketSymbol';
import { Trade } from '../../core/models/trade';
import { MarketPriceRepository, MarketSymbolRepository, TradeRepository } from '../../core/ports';

// Cosmos DB (NoSQL API) containers, created by deploy/azure-terraform:
//   market_price  partition key /symbol      (id = symbol)
//   market_symbol partition key /symbol      (id = symbol)
//   trade         partition key /trade_id    (id = trade_id)
// Trades are partitioned by trade_id so that create and sell are point operations.
// Listing by customer is a cross-partition query, which is fine at demo scale.

const SYSTEM_FIELDS = ['id', '_rid', '_self', '_etag', '_attachments', '_ts'];

/** Removes the fields Cosmos adds, so documents match the API contract exactly. */
function clean<T>(doc: Record<string, unknown>): T {
  const copy = { ...doc };
  for (const field of SYSTEM_FIELDS) delete copy[field];
  return copy as T;
}

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

export class CosmosMarketSymbolRepository implements MarketSymbolRepository {
  constructor(private container: Container) {}

  async getBySymbol(symbol: string): Promise<MarketSymbol | null> {
    const key = symbol.toUpperCase();
    const { resource } = await this.container.item(key, key).read();
    return resource ? clean<MarketSymbol>(resource) : null;
  }
}

export function createCosmosRepositories(database: Database) {
  return {
    trades: new CosmosTradeRepository(database.container('trade')),
    prices: new CosmosMarketPriceRepository(database.container('market_price')),
    symbols: new CosmosMarketSymbolRepository(database.container('market_symbol')),
  };
}

/**
 * Passwordless by default: DefaultAzureCredential uses the Function App's managed identity (or `az login` locally).
 * A key is only for the local emulator.
 */
export async function openCosmosDatabase(endpoint: string, databaseName: string, key?: string): Promise<Database> {
  if (key) return new CosmosClient({ endpoint, key }).database(databaseName);
  const { DefaultAzureCredential } = await import('@azure/identity');
  return new CosmosClient({ endpoint, aadCredentials: new DefaultAzureCredential() }).database(databaseName);
}
