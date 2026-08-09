import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

const suite = "eal-e2e";

export async function startFixtureServer(port = 0) {
  const server = createServer((request, response) => {
    response.setHeader("cache-control", "no-store");
    if (request.url === "/healthz") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true, suite }));
      return;
    }
    if (request.url === "/contracts") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ suite, mode: "offline-fixture" }));
      return;
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(`<!doctype html><html><body><main data-e2e-ready="true" data-suite="${suite}"><h1>${suite}</h1></main></body></html>`);
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
