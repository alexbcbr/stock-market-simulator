import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MarketPriceService } from '../services/marketPriceService';

const marketPriceService = new MarketPriceService();

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

    const marketPrice = await marketPriceService.getBySymbol(symbol);

    if (!marketPrice) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Symbol is not available' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(marketPrice),
    };
  } catch (error) {
    console.error('Error fetching market price:', error);

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
