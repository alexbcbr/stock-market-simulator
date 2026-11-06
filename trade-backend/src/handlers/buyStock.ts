/**
 * AWS Lambda handler for `POST /buyStock`, behind API Gateway.
 *
 * @remarks
 * Thin wrapper over `TradeService`. Importing the file creates the DynamoDB client, so table names must be in
 * the environment before the module loads.
 *
 * @packageDocumentation
 */
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

/**
 * Creates a trade from the request body.
 *
 * @remarks
 * Answers 201 with the stored trade, 400 for a missing body or a failed validation, 404 for an unknown symbol, and
 * 500 `{ "error": "Internal server error" }` otherwise. A body that is not valid JSON is a 500 here, because the parse
 * error is caught by the general handler; the Hono app answers 400 for the same input, so the targets differ.
 *
 * @param event - API Gateway proxy event; only `body` is read.
 * @returns A proxy result with CORS headers (`POST,OPTIONS`, any origin).
 */
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
