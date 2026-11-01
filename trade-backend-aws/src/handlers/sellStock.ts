import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TRADE_TABLE || 'trade';

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

    await client.send(
      new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: {
          trade_id: { S: trade_id },
          trade_timestamp: { S: trade_timestamp },
        },
        UpdateExpression: 'SET status_sell = :val',
        ExpressionAttributeValues: {
          ':val': { BOOL: true },
        },
      })
    );

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
