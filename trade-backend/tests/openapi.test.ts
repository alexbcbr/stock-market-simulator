import SwaggerParser from '@apidevtools/swagger-parser';
import { expect, test } from 'bun:test';
import { join } from 'node:path';

// Azure API Management imports this file, and a malformed contract fails the whole deploy
// (e.g. an unquoted comma in a flow-style description). Validate it against the OpenAPI schema.
test('api-contract/openapi.yaml is a valid OpenAPI document', async () => {
  const api = await SwaggerParser.validate(join(__dirname, '../api-contract/openapi.yaml'));
  const routes = Object.keys((api as { paths: object }).paths).sort();
  expect(routes).toEqual([
    '/buyStock', '/createCustomer', '/getCustomer', '/getMarketPrice', '/getMarketSymbol', '/listAllTrades',
    '/listMarketPrices', '/listTradesByCustomerName', '/sellStock',
  ]);
});
