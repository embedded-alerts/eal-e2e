import { readFileSync } from "node:fs";
import { access } from "node:fs/promises";

const prefix = "eal";
const org = "embedded-alerts";
const repo = "eal-e2e";
const requiredPaths = [
  ".zpkg.toml", "package.json", "contracts/scenarios.json",
  "tests/browser/playwright/smoke.spec.mjs",
  "tests/browser/puppeteer/smoke.test.mjs",
  "tests/browser/selenium/smoke.test.mjs",
];
await Promise.all(requiredPaths.map((path) => access(path)));
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
if (packageJson.name !== `@${org}/${repo}`) throw new Error("package identity drift");
for (const [name, version] of Object.entries({"@playwright/test":"1.62.1","puppeteer":"25.5.0","selenium-webdriver":"4.46.0"})) {
  if (packageJson.devDependencies?.[name] !== version) throw new Error(`unreviewed ${name} version`);
}
const manifest = readFileSync(".zpkg.toml", "utf8");
for (const suffix of ["clients", "interfaces", "libs", "cli"]) {
  const identity = `"${org}/${prefix}-${suffix}"`;
  if (!manifest.includes(identity)) throw new Error(`missing Zed dependency ${identity}`);
}
if (manifest.includes(`${org}-${repo}`)) throw new Error("long-name duplicate identity detected");
const scenarios = JSON.parse(readFileSync("contracts/scenarios.json", "utf8"));
if (scenarios.suite !== repo || scenarios.scenarios.length < 4) throw new Error("scenario contract drift");
if (scenarios.scenarios.some((entry) => entry.live_credentials_required !== false)) throw new Error("offline defaults weakened");
console.log(`validated ${org}/${repo} structure`);
