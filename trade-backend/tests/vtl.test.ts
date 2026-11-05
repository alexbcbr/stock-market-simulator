import { describe, expect, test } from 'bun:test';
import Velocity from 'velocityjs';
import { itemsToJsonTemplate, queryByCustomerRequestTemplate, TRADE_DEFAULTS } from '../deploy/aws-cdk/lib/dynamodb-vtl';

// Approximation of API Gateway's Velocity runtime: $input.path() returns Java-like maps/lists
// (keySet/get/containsKey) and $util.escapeJavaScript follows Java's escaping (' becomes \').
// This catches template mistakes; the real behavior is only proven once deployed (scripts/smoke.sh).
class JMap {
  constructor(private o: Record<string, unknown>) {}
  keySet() { return Object.keys(this.o); }
  get(k: string) { return wrap(this.o[k]); }
  containsKey(k: string) { return k in this.o; }
}
function wrap(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(wrap);
  if (v && typeof v === 'object') return new JMap(v as Record<string, unknown>);
  return v;
}
// Java strings: replaceAll takes a regex (JavaScript's replaceAll would treat the pattern literally).
class JStr {
  constructor(private s: string) {}
  replaceAll(regex: string, replacement: string) { return new JStr(this.s.replace(new RegExp(regex, 'g'), replacement)); }
  toString() { return this.s; }
}
const util = {
  // Java-style escaping, as in API Gateway: ' becomes \' (which is not valid JSON, hence the replaceAll in the templates)
  escapeJavaScript: (s: string) =>
    new JStr(String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\n/g, '\\n')),
};
const render = (template: string, body: unknown) => {
  const input = { path: (p: string) => wrap(p === '$' ? body : (body as any)[p.replace('$.', '')]) };
  return Velocity.render(template, { input, util });
};

describe('itemsToJsonTemplate', () => {
  test('converts DynamoDB-typed items to plain JSON', () => {
    const out = render(itemsToJsonTemplate(), {
      Items: [
        { symbol: { S: 'AAON' }, open_price: { N: '93.28' }, volume: { N: '721400' }, ok: { BOOL: true } },
        { symbol: { S: "O'Neil \"Q\"" }, open_price: { N: '1' }, volume: { N: '2' }, ok: { BOOL: false } },
      ],
    });
    expect(JSON.parse(out)).toEqual([
      { symbol: 'AAON', open_price: 93.28, volume: 721400, ok: true },
      { symbol: "O'Neil \"Q\"", open_price: 1, volume: 2, ok: false },
    ]);
  });

  test('empty result renders an empty array', () => {
    expect(JSON.parse(render(itemsToJsonTemplate(), { Items: [] }))).toEqual([]);
  });

  test('trade defaults fill attributes missing on older items and never duplicate existing ones', () => {
    const out = render(itemsToJsonTemplate(TRADE_DEFAULTS), {
      Items: [
        { trade_id: { S: 'old' }, status_trade: { BOOL: true } },
        { trade_id: { S: 'new' }, status_sell: { BOOL: true }, trade_source: { S: 'market' } },
      ],
    });
    expect(JSON.parse(out)).toEqual([
      { trade_id: 'old', status_trade: true, status_sell: false, trade_source: 'manual' },
      { trade_id: 'new', status_sell: true, trade_source: 'market' },
    ]);
  });
});

describe('queryByCustomerRequestTemplate', () => {
  test('produces valid JSON even when the name has quotes', () => {
    const out = render(queryByCustomerRequestTemplate, { customer_name: `D'Arcy "DJ"` });
    const parsed = JSON.parse(out);
    expect(parsed.ExpressionAttributeValues[':customer_name'].S).toBe(`D'Arcy "DJ"`);
    expect(parsed.ScanIndexForward).toBe(false);
    expect(parsed.IndexName).toBe('idx_trade_customer_name');
  });
});
