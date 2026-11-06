/**
 * AWS Lambda handler for `GET /getMarketPrice`, behind API Gateway.
 *
 * @packageDocumentation
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createDynamoRepositories } from '../adapters/dynamodb';

const marketPriceService = createDynamoRepositories().prices;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

/**
 * Returns one symbol's market price.
 *
 * @remarks
 * Answers 200 with the price, 400 without `symbol`, 404 for an unknown symbol. The symbol is matched exactly, so
 * lower case is a 404. On a 500 the response includes the error `message`, unlike `buyStock` and `sellStock`, which
 * hide it.
 *
 * @param event - API Gateway proxy event; only `queryStringParameters.symbol` is read.
 * @returns A proxy result with CORS headers (`GET,OPTIONS`, any origin).
 */
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
