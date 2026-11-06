import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

const suite = "eal-e2e";
const scenarios = ["api", "websocket", "provider-adapter", "offline-queue", "accessibility", "embedded-host"];
const routes = new Map([
  ["/healthz", { contentType: "application/json", body: JSON.stringify({ ok: true, suite }) }],
  ["/contracts", { contentType: "application/json", body: JSON.stringify({
    suite, mode: "offline-fixture", scenarios,
  }) }],
  ["/", { contentType: "text/html; charset=utf-8",
    body: `<!doctype html><html><body><main data-e2e-ready="true" data-suite="${suite}"><h1>${suite}</h1></main></body></html>` }],
]);

function send(response, method, code, type, body) {
  response.writeHead(code, { "content-type": type });
  response.end(method === "HEAD" ? undefined : body);
}

export async function startFixtureServer(port = 0) {
  const server = createServer((request, response) => {
    response.setHeader("cache-control", "no-store");
    response.setHeader("x-content-type-options", "nosniff");
    response.setHeader("referrer-policy", "no-referrer");
    response.setHeader("x-frame-options", "DENY");
    response.setHeader("content-security-policy", "default-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.setHeader("allow", "GET, HEAD");
      send(response, request.method, 405, "text/plain; charset=utf-8", "Method Not Allowed");
      return;
    }
    // Never treat arbitrary paths, encoded paths, or credential-bearing query
    // strings as successful fixture routes. No user-controlled content is echoed.
    if (typeof request.url !== "string" || request.url.includes("?") ||
        request.url.includes("#")) {
      send(response, request.method, 400, "text/plain; charset=utf-8", "Bad Request");
      return;
    }
    const route = routes.get(request.url);
    if (!route) {
      send(response, request.method, 404, "text/plain; charset=utf-8", "Not Found");
      return;
    }
    send(response, request.method, 200, route.contentType, route.body);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("fixture address unavailable");
  return {
    baseURL: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const fixture = await startFixtureServer(Number(process.env.PORT || 4173));
  console.log(`fixture listening at ${fixture.baseURL}`);
}
