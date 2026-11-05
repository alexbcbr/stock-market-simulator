import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TradeService, SymbolNotAvailableError } from '../core/tradeService';
import { validateBuyStockRequest } from '../core/validation';
import { createDynamoRepositories } from '../adapters/dynamodb';

const repos = createDynamoRepositories();
const tradeService = new TradeService(repos.trades, repos.prices);

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

    const validation = validateBuyStockRequest(JSON.parse(event.body));
    if (!validation.ok) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: validation.error }),
      };
    }
    const request = validation.value;

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
    const isSymbolError = error instanceof SymbolNotAvailableError;

    return {
      statusCode: isSymbolError ? 404 : 500,
      headers,
      body: JSON.stringify({
        error: isSymbolError ? message : 'Internal server error',
      }),
    };
  }
};
