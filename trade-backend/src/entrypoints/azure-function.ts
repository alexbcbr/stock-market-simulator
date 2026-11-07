/**
 * Azure Functions (Node v4 model) entrypoint: Hono behind an HTTP trigger, Cosmos DB for storage.
 *
 * @remarks
 * One catch-all function named `api` (routes `{*path}`, anonymous; API Management is the public front).
 * `host.json` sets `routePrefix` to an empty string so paths match `api-contract/openapi.yaml`. Needs
 * `COSMOS_ENDPOINT` (required) and `COSMOS_DATABASE` (default `trade`), and the app's managed identity must
 * have a Cosmos data role.
 *
 * @packageDocumentation
 */
import { app } from '@azure/functions';
import { createCosmosRepositories, openCosmosDatabase } from '../adapters/cosmos/repositories';
import { createApp } from '../api/app';
import { TradeService } from '../core/tradeService';
import { toAzureHandler } from './azureAdapter';

let handler: ReturnType<typeof toAzureHandler> | undefined;

/**
 * Builds the app on first use and reuses it afterwards.
 *
 * @remarks
 * Initialization is lazy so a cold start pays for it once per instance. If it fails, nothing is cached and every
 * request retries it, so a missing `COSMOS_ENDPOINT` makes each request fail with a 500.
 *
 * @throws If `COSMOS_ENDPOINT` is not set, or the Cosmos client cannot be created.
 */
async function getHandler() {
  if (!handler) {
    const endpoint = process.env.COSMOS_ENDPOINT;
    if (!endpoint) throw new Error('COSMOS_ENDPOINT is not set');
    const database = await openCosmosDatabase(endpoint, process.env.COSMOS_DATABASE ?? 'trade');
    const repos = createCosmosRepositories(database);
    // API Management adds the CORS headers, so the app must not add them a second time.
    const hono = createApp(
      { tradeService: new TradeService(repos.trades, repos.prices), prices: repos.prices, symbols: repos.symbols, customers: repos.customers },
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
