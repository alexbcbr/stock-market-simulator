/**
 * AWS Lambda handler for `POST /sellStock`, behind API Gateway.
 *
 * @packageDocumentation
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TradeService } from '../core/tradeService';
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
 * Marks a trade as sold.
 *
 * @remarks
 * Answers 200 `{ "success": true }` even when no trade matched, 400 for a missing body or missing `trade_id` or
 * `trade_timestamp`, and 500 for anything else. Invalid JSON is a 500 (the Hono app answers 400). It does not check
 * that the trade succeeded or is not already sold.
 *
 * @param event - API Gateway proxy event; only `body` is read.
 * @returns A proxy result with CORS headers (`POST,OPTIONS`, any origin).
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { trade_id, trade_timestamp } = JSON.parse(event.body);

    if (!trade_id || !trade_timestamp) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'trade_id and trade_timestamp are required' }),
      };
    }

    await tradeService.sellTrade(trade_id, trade_timestamp);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error selling stock:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
