import type { HttpRequest, HttpResponseInit } from '@azure/functions';

// Minimal bridge between an Azure Functions HTTP trigger and a Hono app (or any fetch handler).
export function toAzureHandler(fetchHandler: (request: Request) => Response | Promise<Response>) {
  return async (req: HttpRequest): Promise<HttpResponseInit> => {
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const response = await fetchHandler(
      new Request(req.url, {
        method: req.method,
        headers: Object.fromEntries(req.headers.entries()),
        body: hasBody ? await req.arrayBuffer() : undefined,
      })
    );
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text(),
    };
  };
}
