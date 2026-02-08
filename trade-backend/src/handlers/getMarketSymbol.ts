import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MarketSymbolService } from '../services/marketSymbolService';

const marketSymbolService = new MarketSymbolService();

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const symbol = event.queryStringParameters?.symbol;

    if (!symbol) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Query parameter "symbol" is required' }),
      };
    }

    const marketSymbol = await marketSymbolService.getBySymbol(symbol);

    if (!marketSymbol) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Symbol not found' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(marketSymbol),
    };
  } catch (error) {
    console.error('Error fetching market symbol:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
