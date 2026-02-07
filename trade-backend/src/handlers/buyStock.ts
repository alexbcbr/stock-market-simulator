import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TradeService } from '../services/tradeService';
import { BuyStockRequest } from '../models/trade';

const tradeService = new TradeService();

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const request: BuyStockRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.symbol || !request.customer_name || !request.price_mode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: symbol, customer_name, price_mode'
        }),
      };
    }

    if (!['manual', 'market', 'agent'].includes(request.price_mode)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'price_mode must be one of: manual, market, agent'
        }),
      };
    }

    if (request.price_mode === 'manual' && (request.bid_price === undefined || request.bid_price < 0)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'bid_price is required and must be non-negative when price_mode is manual'
        }),
      };
    }

    // Call business logic
    const trade = await tradeService.createTrade(request);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(trade),
    };
  } catch (error) {
    console.error('Error creating trade:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    const isSymbolError = message.includes('is not available');

    return {
      statusCode: isSymbolError ? 404 : 500,
      headers,
      body: JSON.stringify({
        error: isSymbolError ? message : 'Internal server error',
      }),
    };
  }
};
