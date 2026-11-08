/**
 * AWS Lambda handler for `GET /getCustomer`, behind API Gateway.
 *
 * @packageDocumentation
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createDynamoRepositories } from '../adapters/dynamodb';

const customers = createDynamoRepositories().customers;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

/**
 * Returns one customer by name.
 *
 * @remarks
 * Answers 200 with the customer, 400 without `customer_name`, 404 for an unknown name. The name is matched
 * exactly, case-sensitive.
 *
 * @param event - API Gateway proxy event; only `queryStringParameters.customer_name` is read.
 * @returns A proxy result with CORS headers (`GET,OPTIONS`, any origin).
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const name = event.queryStringParameters?.customer_name;
    if (!name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Query parameter "customer_name" is required' }),
      };
    }
    const customer = await customers.getByName(name);
    if (!customer) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Customer not found' }) };
    return { statusCode: 200, headers, body: JSON.stringify(customer) };
  } catch (error) {
    console.error('Error fetching customer:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
