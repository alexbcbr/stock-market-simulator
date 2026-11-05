import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createDynamoRepositories } from '../adapters/dynamodb';

const marketPriceService = createDynamoRepositories().prices;

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
    const marketPrices = await marketPriceService.listAll();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(marketPrices),
    };
  } catch (error) {
    console.error('Error listing market prices:', error);

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
