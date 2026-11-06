import { Context, Hono } from 'hono';
import { cors } from 'hono/cors';
import { MarketPriceRepository, MarketSymbolRepository } from '../core/ports';
import { SymbolNotAvailableError, TradeService } from '../core/tradeService';
import { validateBuyStockRequest } from '../core/validation';

/**
 * The HTTP routes for the local, Kubernetes and Azure targets.
 *
 * @remarks
 * Route names, status codes and JSON shapes follow `api-contract/openapi.yaml`, the same contract the AWS
 * API Gateway deployment exposes. Errors are returned as `{ "error": message }`.
 *
 * @packageDocumentation
 */

/** What the app needs from the outside. Each target builds these from its own database adapter. */
export interface AppDeps {
  /** Business operations for buying, selling and listing trades. */
  tradeService: TradeService;
  /** Source of market prices for the two price routes and `/listMarketPrices`. */
  prices: MarketPriceRepository;
  /** Source of company data for `/getMarketSymbol`. */
  symbols: MarketSymbolRepository;
}

/**
 * Builds the Hono app with all routes.
 *
 * @remarks
 * Routes: `GET /health`, `GET /listAllTrades`, `POST /listTradesByCustomerName`, `GET /listMarketPrices`,
 * `GET /getMarketPrice`, `GET /getMarketSymbol`, `POST /buyStock` and `POST /sellStock`.
 *
 * Status codes: 400 for a missing or malformed body, a missing field or a missing query parameter; 404 for
 * an unknown symbol; 500 `{ "error": "Internal server error" }` for anything unexpected, with the real error
 * only in the log. A body that is not valid JSON is a 400, which differs from the AWS Lambda handlers (500).
 * `POST /sellStock` answers `{ "success": true }` even when no trade matched.
 *
 * Symbol case differs by route: `/buyStock` and `/getMarketSymbol` upper-case the symbol, but `/getMarketPrice`
 * matches it exactly, so `?symbol=aaon` is a 404 there on every target.
 *
 * @param deps - Services and repositories to serve from.
 * @param options - `cors` adds permissive CORS headers (default true). Pass `false` when a gateway in front,
 * such as Azure API Management, already adds them, so the headers are not duplicated.
 * @returns A Hono app; pass `app.fetch` to a server or adapter.
 */
export function createApp({ tradeService, prices, symbols }: AppDeps, options: { cors?: boolean } = {}) {
  const app = new Hono();
  if (options.cors ?? true) app.use('*', cors());

  const readJson = async (c: Context): Promise<unknown | undefined> => {
    try {
      return await c.req.json();
    } catch {
      return undefined;
    }
  };

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.get('/listAllTrades', async (c) => c.json(await tradeService.listAllTrades()));

  app.post('/listTradesByCustomerName', async (c) => {
    const body = (await readJson(c)) as { customer_name?: string } | undefined;
    if (!body?.customer_name) return c.json({ error: 'customer_name is required' }, 400);
    return c.json(await tradeService.listTradesByCustomer(body.customer_name));
  });

  app.get('/listMarketPrices', async (c) => c.json(await prices.listAll()));

  app.get('/getMarketPrice', async (c) => {
    const symbol = c.req.query('symbol');
    if (!symbol) return c.json({ error: 'Query parameter "symbol" is required' }, 400);
    const price = await prices.getBySymbol(symbol);
    return price ? c.json(price) : c.json({ error: 'Symbol is not available' }, 404);
  });

  app.get('/getMarketSymbol', async (c) => {
    const symbol = c.req.query('symbol');
    if (!symbol) return c.json({ error: 'Query parameter "symbol" is required' }, 400);
    const found = await symbols.getBySymbol(symbol);
    return found ? c.json(found) : c.json({ error: 'Symbol not found' }, 404);
  });

  app.post('/buyStock', async (c) => {
    const body = await readJson(c);
    if (body === undefined) return c.json({ error: 'Request body is required' }, 400);
    const validation = validateBuyStockRequest(body);
    if (!validation.ok) return c.json({ error: validation.error }, 400);
    try {
      return c.json(await tradeService.createTrade(validation.value), 201);
    } catch (error) {
      if (error instanceof SymbolNotAvailableError) return c.json({ error: error.message }, 404);
      throw error;
    }
  });

  app.post('/sellStock', async (c) => {
    const body = (await readJson(c)) as { trade_id?: string; trade_timestamp?: string } | undefined;
    if (body === undefined) return c.json({ error: 'Request body is required' }, 400);
    if (!body.trade_id || !body.trade_timestamp) {
      return c.json({ error: 'trade_id and trade_timestamp are required' }, 400);
    }
    await tradeService.sellTrade(body.trade_id, body.trade_timestamp);
    return c.json({ success: true });
  });

  app.onError((error, c) => {
    console.error(error);
    return c.json({ error: 'Internal server error' }, 500);
  });

  return app;
}
