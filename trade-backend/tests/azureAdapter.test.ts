import { describe, expect, test } from 'bun:test';
import { toAzureHandler } from '../src/entrypoints/azureAdapter';

// Stand-in for Azure's HttpRequest (same members the adapter uses), built on the standard Request.
const azureRequest = (url: string, init: RequestInit = {}) => {
  const r = new Request(url, init);
  return { method: r.method, url: r.url, headers: r.headers, arrayBuffer: () => r.arrayBuffer() } as any;
};

describe('toAzureHandler', () => {
  test('passes method, path, query, headers and JSON body to the app and maps the response back', async () => {
    const handler = toAzureHandler(async (req) => {
      const body = await req.json();
      return Response.json(
        { path: new URL(req.url).pathname + new URL(req.url).search, method: req.method, ct: req.headers.get('content-type'), body },
        { status: 201 }
      );
    });
    const res = await handler(
      azureRequest('https://fn.example/buyStock?x=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'AAON' }),
      })
    );
    expect(res.status).toBe(201);
    expect(JSON.parse(res.body as string)).toEqual({
      path: '/buyStock?x=1', method: 'POST', ct: 'application/json', body: { symbol: 'AAON' },
    });
    expect((res.headers as Record<string, string>)['content-type']).toContain('application/json');
  });

  test('GET requests are sent without a body', async () => {
    const handler = toAzureHandler(async (req) => new Response(req.body === null ? 'no-body' : 'body'));
    expect((await handler(azureRequest('https://fn.example/listAllTrades'))).body).toBe('no-body');
  });
});
