import assert from "node:assert/strict";
import test from "node:test";
import puppeteer from "puppeteer";
import { startFixtureServer } from "../../support/fixture-server.mjs";

test("eal-e2e Puppeteer smoke", async (t) => {
  const fixture = process.env.E2E_BASE_URL ? null : await startFixtureServer();
  const baseURL = process.env.E2E_BASE_URL || fixture.baseURL;
  if (fixture) t.after(() => fixture.close());
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  assert.equal(await page.$eval("main", (node) => node.dataset.suite), "eal-e2e");
  const health = await fetch(`${baseURL}/healthz`).then((response) => response.json());
  assert.equal(health.ok, true);
});
