// Mapping templates for the API Gateway -> DynamoDB integrations (no Lambda).
// They make these routes answer in plain JSON, like the Lambda routes and the other deployments
// (see api-contract/openapi.yaml). Without them API Gateway would return DynamoDB-typed JSON
// such as {"symbol":{"S":"AAPL"}}.

/**
 * Response template: turns the DynamoDB `Items` list into a plain JSON array.
 * Handles the scalar types stored in these tables: S (string), N (number), BOOL.
 * `defaults` adds attributes that older items may lack (rendered only when missing).
 */
export function itemsToJsonTemplate(defaults: Record<string, string | boolean> = {}): string {
  const defaultLines = Object.entries(defaults)
    .map(([key, value]) => {
      const literal = typeof value === 'boolean' ? String(value) : `"${value}"`;
      return `#if(!$item.containsKey("${key}")),"${key}": ${literal}#end`;
    })
    .join('\n');

  return `#set($items = $input.path('$.Items'))
[
#foreach($item in $items)
{
#foreach($key in $item.keySet())
#set($v = $item.get($key))
"$key": #if($v.containsKey("S"))"$util.escapeJavaScript($v.get("S")).replaceAll("\\\\'","'")"#elseif($v.containsKey("N"))$v.get("N")#elseif($v.containsKey("BOOL"))$v.get("BOOL")#{else}null#end#if($foreach.hasNext),#end

#end
${defaultLines}
}#if($foreach.hasNext),#end

#end
]`;
}

/** Request template for listTradesByCustomerName: queries the customer GSI, newest first. */
export const queryByCustomerRequestTemplate = `{
  "TableName": "trade",
  "IndexName": "idx_trade_customer_name",
  "KeyConditionExpression": "customer_name = :customer_name",
  "ExpressionAttributeValues": {
    ":customer_name": { "S": "$util.escapeJavaScript($input.path('$.customer_name')).replaceAll("\\\\'","'")" }
  },
  "ScanIndexForward": false
}`;

export const TRADE_DEFAULTS = { status_sell: false, trade_source: 'manual' };
