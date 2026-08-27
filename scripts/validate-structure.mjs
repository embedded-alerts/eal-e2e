import { readFileSync } from "node:fs";
import { access } from "node:fs/promises";

const prefix = "eal";
const org = "embedded-alerts";
const repo = "eal-e2e";
const requiredPaths = [
  ".zpkg.toml",
  "package.json",
  "contracts/scenarios.json",
  "tests/browser/playwright/smoke.spec.mjs",
  "tests/browser/puppeteer/smoke.test.mjs",
  "tests/browser/selenium/smoke.test.mjs",
];
await Promise.all(requiredPaths.map((path) => access(path)));
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
if (packageJson.name !== `@${org}/${repo}`) throw new Error("package identity drift");
for (const [name, version] of Object.entries({
  "@playwright/test": "1.62.1",
  puppeteer: "25.5.0",
  "selenium-webdriver": "4.46.0",
})) {
  if (packageJson.devDependencies?.[name] !== version) throw new Error(`unreviewed ${name} version`);
}
const manifest = readFileSync(".zpkg.toml", "utf8");
if (!manifest.includes(`org = "${org}"`)) throw new Error("missing Zed package org");
if (!manifest.includes(`name = "${repo}"`)) throw new Error("missing Zed package name");
if (!manifest.includes('dir = ".vendor/.zed"')) throw new Error("Zed vendor dir drift");
if (!manifest.includes('".vendor/.zed/**"')) throw new Error("generated vendor path must be unpublished");
for (const suffix of ["clients", "interfaces", "libs", "cli"]) {
  const identity = `"${org}/${prefix}-${suffix}"`;
  if (!manifest.includes(identity)) throw new Error(`missing Zed dependency ${identity}`);
}
if (manifest.includes(`${org}-${repo}`)) throw new Error("long-name duplicate identity detected");
if (manifest.includes("gitlink") || manifest.includes("[submodule")) {
  throw new Error("Zed graph must not model product packages as gitlinks");
}
const scenarios = JSON.parse(readFileSync("contracts/scenarios.json", "utf8"));
if (scenarios.suite !== repo || scenarios.scenarios.length < 4) throw new Error("scenario contract drift");
if (scenarios.scenarios.some((entry) => entry.live_credentials_required !== false)) {
  throw new Error("offline defaults weakened");
}
const gitignore = readFileSync(".gitignore", "utf8");
if (!gitignore.split("\n").some((line) => line.trim() === ".vendor/" || line.trim() === ".vendor/.zed/")) {
  throw new Error("vendor directory must be gitignored");
}
console.log(`validated ${org}/${repo} structure`);
