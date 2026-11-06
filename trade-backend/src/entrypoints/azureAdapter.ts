import type { HttpRequest, HttpResponseInit } from '@azure/functions';

/**
 * Bridges an Azure Functions HTTP trigger to a Hono app, or to any fetch handler.
 *
 * @remarks
 * Copies method, URL, headers and body in, and status, headers and body out. The request body is read whole (and
 * skipped for GET and HEAD), and the response body is always read as text, so streaming and binary responses are
 * not supported.
 *
 * @param fetchHandler - A standard fetch handler, such as `hono.fetch`.
 * @returns A function with the signature Azure Functions expects for an HTTP trigger.
 */
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
