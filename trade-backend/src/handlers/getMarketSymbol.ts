/**
 * AWS Lambda handler for `GET /getMarketSymbol`, behind API Gateway.
 *
 * @packageDocumentation
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createDynamoRepositories } from '../adapters/dynamodb';

const marketSymbolService = createDynamoRepositories().symbols;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

/**
 * Returns one symbol's company data.
 *
 * @remarks
 * Answers 200 with the data, 400 without `symbol`, 404 for an unknown symbol. The symbol is upper-cased by the
 * repository, so lower case works here.
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
