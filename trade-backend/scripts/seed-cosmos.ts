// Loads market prices and symbols into Cosmos DB (the containers must already exist: terraform creates them).
// Usage: COSMOS_ENDPOINT=https://<account>.documents.azure.com:443/ bun scripts/seed-cosmos.ts [prices.csv] [symbols.csv]
// Auth: your `az login` identity (needs the Cosmos DB data contributor role; terraform grants it to the deployer).
// For the local emulator set COSMOS_KEY too.
import { openCosmosDatabase } from '../src/adapters/cosmos/repositories';
import { loadSeedData } from './seedData';

const endpoint = process.env.COSMOS_ENDPOINT;
if (!endpoint) throw new Error('COSMOS_ENDPOINT is not set');
async function main() {
  const database = await openCosmosDatabase(endpoint!, process.env.COSMOS_DATABASE ?? 'trade', process.env.COSMOS_KEY);
  const { prices, symbols } = loadSeedData(process.argv[2], process.argv[3]);

  async function upsertAll(containerId: string, docs: { symbol: string }[]) {
    const container = database.container(containerId);
    for (let i = 0; i < docs.length; i += 100) {
      const batch = docs.slice(i, i + 100).map((d) => ({
        operationType: 'Upsert' as const,
        partitionKey: d.symbol,
        resourceBody: { id: d.symbol, ...d },
      }));
      const results = await container.items.executeBulkOperations(batch);
      const failed = results.filter((r) => r.response && (r.response.statusCode ?? 200) >= 400);
      if (failed.length) throw new Error(`${containerId}: ${failed.length} operations failed in batch starting at ${i}`);
    }
  }

  await upsertAll('market_price', prices);
  await upsertAll('market_symbol', symbols);
  console.log(`Seeded ${prices.length} market prices and ${symbols.length} symbols into ${endpoint}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
