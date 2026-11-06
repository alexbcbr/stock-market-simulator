/**
 * AWS Lambda handler for listing market prices.
 *
 * @remarks
 * Not deployed. The CDK stack serves `GET /listMarketPrices` straight from DynamoDB through a mapping template,
 * with no Lambda. The file is kept as the equivalent code path.
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
 * Returns every market price.
 *
 * @remarks
 * Answers 200 with an array, or 500 with the error `message` included. The DynamoDB scan is unpaged (about 1 MB maximum).
 *
 * @param event - API Gateway proxy event; not read.
 * @returns A proxy result with CORS headers (`GET,OPTIONS`, any origin).
 */
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
