// Runs the repository contract against a real Cosmos DB API: the local emulator
//   docker run -d --rm --name cosmos-emu -p 8083:8081 -e PROTOCOL=http mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview
//   COSMOS_EMULATOR_URL=http://localhost:8083 COSMOS_EMULATOR_KEY=<emulator key> bun test tests/cosmos.contract.test.ts
// The emulator key is the fixed, public one Microsoft documents for the Cosmos DB emulator
// (learn.microsoft.com, "Azure Cosmos DB emulator", authentication section). It is read from the
// environment so the repository does not contain a Cosmos-key-shaped string that secret scanners flag.
// Skipped unless both COSMOS_EMULATOR_URL and COSMOS_EMULATOR_KEY are set.
import { CosmosClient } from '@azure/cosmos';
import { createCosmosRepositories } from '../src/adapters/cosmos/repositories';
import { AAPL } from './helpers';
import { customerRepositoryContract, marketPriceRepositoryContract, tradeRepositoryContract } from './repositoryContract';

const url = process.env.COSMOS_EMULATOR_URL;
const key = process.env.COSMOS_EMULATOR_KEY;

async function freshRepositories() {
  const client = new CosmosClient({ endpoint: url!, key: key! });
  const { database } = await client.databases.create({ id: `test-${crypto.randomUUID()}` });
  await database.containers.createIfNotExists({ id: 'trade', partitionKey: { paths: ['/trade_id'] } });
  await database.containers.createIfNotExists({ id: 'market_price', partitionKey: { paths: ['/symbol'] } });
  await database.containers.createIfNotExists({ id: 'market_symbol', partitionKey: { paths: ['/symbol'] } });
  await database.containers.createIfNotExists({ id: 'customers', partitionKey: { paths: ['/customer_name'] } });
  await database.container('market_price').items.create({ id: AAPL.symbol, ...AAPL });
  return createCosmosRepositories(database);
}

if (url && key) {
  tradeRepositoryContract('cosmos emulator', async () => (await freshRepositories()).trades);
  marketPriceRepositoryContract('cosmos emulator', async () => (await freshRepositories()).prices);
  customerRepositoryContract('cosmos emulator', async () => (await freshRepositories()).customers);
}
