// Runs the repository contract against a real Cosmos DB API: the local emulator
//   docker run -d --rm --name cosmos-emu -p 8083:8081 -e PROTOCOL=http mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview
//   COSMOS_EMULATOR_URL=http://localhost:8083 bun test tests/cosmos.contract.test.ts
// Skipped when COSMOS_EMULATOR_URL is not set.
import { CosmosClient } from '@azure/cosmos';
import { createCosmosRepositories } from '../src/adapters/cosmos/repositories';
import { AAPL } from './helpers';
import { marketPriceRepositoryContract, tradeRepositoryContract } from './repositoryContract';

const url = process.env.COSMOS_EMULATOR_URL;
// Well-known, public key of the Cosmos DB emulator (not a secret).
const EMULATOR_KEY = 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';

async function freshRepositories() {
  const client = new CosmosClient({ endpoint: url!, key: EMULATOR_KEY });
  const { database } = await client.databases.create({ id: `test-${crypto.randomUUID()}` });
  await database.containers.createIfNotExists({ id: 'trade', partitionKey: { paths: ['/trade_id'] } });
  await database.containers.createIfNotExists({ id: 'market_price', partitionKey: { paths: ['/symbol'] } });
  await database.containers.createIfNotExists({ id: 'market_symbol', partitionKey: { paths: ['/symbol'] } });
  await database.container('market_price').items.create({ id: AAPL.symbol, ...AAPL });
  return createCosmosRepositories(database);
}

if (url) {
  tradeRepositoryContract('cosmos emulator', async () => (await freshRepositories()).trades);
  marketPriceRepositoryContract('cosmos emulator', async () => (await freshRepositories()).prices);
}
