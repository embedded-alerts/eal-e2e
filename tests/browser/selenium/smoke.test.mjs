import assert from "node:assert/strict";
import test from "node:test";
import { Builder, By } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import { startFixtureServer } from "../../support/fixture-server.mjs";

test("eal-e2e Selenium smoke", async (t) => {
  const fixture = process.env.E2E_BASE_URL ? null : await startFixtureServer();
  const baseURL = process.env.E2E_BASE_URL || fixture.baseURL;
  if (fixture) t.after(() => fixture.close());
  const options = new chrome.Options().addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage");
  const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
  t.after(() => driver.quit());
  await driver.get(baseURL);
  assert.equal(await driver.findElement(By.css("main")).getAttribute("data-suite"), "eal-e2e");
  const health = await fetch(`${baseURL}/healthz`).then((response) => response.json());
  assert.equal(health.ok, true);
});
