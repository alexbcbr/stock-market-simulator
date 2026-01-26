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
    if (!request.symbol || !request.customer_name ||
        request.executed_price === undefined ||
        request.open_price === undefined ||
        request.close_price === undefined) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: symbol, customer_name, executed_price, open_price, close_price'
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

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
