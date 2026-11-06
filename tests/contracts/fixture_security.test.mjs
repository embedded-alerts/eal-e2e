import assert from "node:assert/strict";
import test from "node:test";
import { startFixtureServer } from "../support/fixture-server.mjs";

async function withFixture(t) {
  const fixture = await startFixtureServer();
  t.after(() => fixture.close());
  return fixture.baseURL;
}

test("only three exact offline fixture routes return success", async (t) => {
  const base = await withFixture(t);
  for (const path of ["/", "/healthz", "/contracts"]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
  }
  for (const path of ["/admin", "/health", "/contracts/", "/favicon.ico", "/api/auth",
                      "/%2F", "/%2e%2e/contracts", "/admin/../", "/CONTRACTS"]) {
    const response = await fetch(base + path, { redirect: "manual" });
    assert.notEqual(response.status, 200, path);
    assert.doesNotMatch(await response.text(), /data-e2e-ready/);
  }
});

test("credential-shaped query parameters cannot receive a successful fixture response", async (t) => {
  const base = await withFixture(t);
  for (const query of ["?token=test", "?api_key=placeholder", "?session=canary",
                       "?fragment=secret", "?v=1", "?"]) {
    const response = await fetch(base + "/contracts" + query);
    assert.equal(response.status, 400, query);
    const body = await response.text();
    assert.equal(body, "Bad Request");
    assert.doesNotMatch(body, /test|placeholder|canary|secret/);
  }
});

test("write methods do not mutate or impersonate any read-only fixture route", async (t) => {
  const base = await withFixture(t);
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    const response = await fetch(base + "/contracts", { method, body: "canary" });
    assert.equal(response.status, 405, method);
    assert.equal(response.headers.get("allow"), "GET, HEAD");
    assert.equal(await response.text(), "Method Not Allowed");
  }
  assert.deepEqual((await fetch(base + "/healthz").then((r) => r.json())),
                   { ok: true, suite: "eal-e2e" });
});

test("HEAD returns metadata without response bytes", async (t) => {
  const base = await withFixture(t);
  for (const path of ["/", "/healthz", "/contracts"]) {
    const response = await fetch(base + path, { method: "HEAD" });
    assert.equal(response.status, 200, path);
    assert.equal(await response.text(), "");
  }
});

test("every route supplies privacy and browser isolation headers", async (t) => {
  const base = await withFixture(t);
  for (const path of ["/", "/contracts", "/healthz", "/missing"]) {
    const response = await fetch(base + path);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  }
});

test("offline contracts have stable ordering and do not contain host or secret data", async (t) => {
  const base = await withFixture(t);
  const response = await fetch(base + "/contracts");
  assert.equal(response.headers.get("content-type"), "application/json");
  const contract = await response.json();
  assert.deepEqual(contract, {
    suite: "eal-e2e", mode: "offline-fixture",
    scenarios: ["api", "websocket", "provider-adapter", "offline-queue", "accessibility", "embedded-host"],
  });
  const serialized = JSON.stringify(contract);
  assert.doesNotMatch(serialized, /127\.0\.0\.1|localhost|password|bearer|token/i);
});

test("two concurrently running offline fixtures have isolated listener identities", async (t) => {
  const first = await startFixtureServer();
  const second = await startFixtureServer();
  t.after(async () => { await Promise.all([first.close(), second.close()]); });
  assert.notEqual(first.baseURL, second.baseURL);
  const responses = await Promise.all([first, second].map(async (fixture) => {
    const response = await fetch(fixture.baseURL + "/healthz");
    assert.equal(response.status, 200);
    return response.json();
  }));
  assert.deepEqual(responses, [
    { ok: true, suite: "eal-e2e" }, { ok: true, suite: "eal-e2e" },
  ]);
});
