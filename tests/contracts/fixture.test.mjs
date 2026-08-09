import assert from "node:assert/strict";
import test from "node:test";
import { startFixtureServer } from "../support/fixture-server.mjs";

test("offline fixture exposes bounded health and contract surfaces", async (t) => {
  const fixture = await startFixtureServer();
  t.after(() => fixture.close());
  const health = await fetch(`${fixture.baseURL}/healthz`).then((response) => response.json());
  assert.equal(health.ok, true);
  const contracts = await fetch(`${fixture.baseURL}/contracts`).then((response) => response.json());
  assert.equal(contracts.mode, "offline-fixture");
});
