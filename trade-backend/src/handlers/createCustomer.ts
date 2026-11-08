/**
 * AWS Lambda handler for `POST /createCustomer`, behind API Gateway.
 *
 * @remarks
 * Thin wrapper over `validateCreateCustomerRequest`, `newCustomer` and the customer repository. Importing the
 * file creates the DynamoDB client, so `CUSTOMERS_TABLE` must be in the environment before the module loads.
 *
 * @packageDocumentation
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CustomerAlreadyExistsError, newCustomer } from '../core/models/customer';
import { validateCreateCustomerRequest } from '../core/validation';
import { createDynamoRepositories } from '../adapters/dynamodb';

const customers = createDynamoRepositories().customers;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

/**
 * Creates a customer from the request body.
 *
 * @remarks
 * Answers 201 with the stored customer, 400 for a missing body or a failed validation, 409 when the name already
 * exists, and 500 `{ "error": "Internal server error" }` otherwise. A body that is not valid JSON is a 500 here,
 * because the parse error is caught by the general handler; the Hono app answers 400 for the same input.
 *
 * @param event - API Gateway proxy event; only `body` is read.
 * @returns A proxy result with CORS headers (`POST,OPTIONS`, any origin).
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body is required' }) };
    }
    const validation = validateCreateCustomerRequest(JSON.parse(event.body));
    if (!validation.ok) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: validation.error }) };
    }
    const customer = newCustomer(validation.value);
    await customers.create(customer);
    return { statusCode: 201, headers, body: JSON.stringify(customer) };
  } catch (error) {
    if (error instanceof CustomerAlreadyExistsError) {
      return { statusCode: 409, headers, body: JSON.stringify({ error: error.message }) };
    }
    console.error('Error creating customer:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
