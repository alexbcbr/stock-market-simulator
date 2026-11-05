// Azure Functions (Node v4 model) entrypoint: Hono behind an HTTP trigger, Cosmos DB for storage.
// host.json sets routePrefix to "" so paths match api-contract/openapi.yaml (/buyStock, ...).
import { app } from '@azure/functions';
import { createCosmosRepositories, openCosmosDatabase } from '../adapters/cosmos/repositories';
import { createApp } from '../api/app';
import { TradeService } from '../core/tradeService';
import { toAzureHandler } from './azureAdapter';

let handler: ReturnType<typeof toAzureHandler> | undefined;

async function getHandler() {
  if (!handler) {
    const endpoint = process.env.COSMOS_ENDPOINT;
    if (!endpoint) throw new Error('COSMOS_ENDPOINT is not set');
    const database = await openCosmosDatabase(endpoint, process.env.COSMOS_DATABASE ?? 'trade');
    const repos = createCosmosRepositories(database);
    // API Management adds the CORS headers, so the app must not add them a second time.
    const hono = createApp(
      { tradeService: new TradeService(repos.trades, repos.prices), prices: repos.prices, symbols: repos.symbols },
      { cors: false }
    );
    handler = toAzureHandler(hono.fetch);
  }
  return handler;
}

app.http('api', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: '{*path}',
  handler: async (request) => (await getHandler())(request),
});
