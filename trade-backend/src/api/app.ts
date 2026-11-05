import { Context, Hono } from 'hono';
import { cors } from 'hono/cors';
import { MarketPriceRepository, MarketSymbolRepository } from '../core/ports';
import { SymbolNotAvailableError, TradeService } from '../core/tradeService';
import { validateBuyStockRequest } from '../core/validation';

export interface AppDeps {
  tradeService: TradeService;
  prices: MarketPriceRepository;
  symbols: MarketSymbolRepository;
}

// Route names, status codes and JSON shapes follow api-contract/openapi.yaml
// (the same contract the AWS API Gateway deployment exposes).
// `cors: false` when a gateway in front (Azure API Management) already adds the CORS headers.
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
