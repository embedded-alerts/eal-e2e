# eal-e2e

Canonical end-to-end and cross-repository contract harness for **Embedded Alerts**.

This repository is intentionally offline-safe by default. Playwright, Puppeteer, and Selenium exercise the same local fixture contract. Live endpoints are opt-in through `E2E_BASE_URL` and must use isolated test tenants and ephemeral secrets.

## Canonical composition

Zed materializes `eal-clients`, `eal-interfaces`, `eal-libs`, and `eal-cli` under `.vendor/.zed`. Do not model those same repositories as gitlinks, and do not fabricate `.zpkg.lock`; create the lock only from a successful resolver run.

## Commands

```bash
npm ci
npm run test:offline
npx playwright install --with-deps chromium
npm run test:playwright
npm run test:puppeteer
npm run test:selenium
```

## Planning

- Canonical creation issue: https://github.com/embedded-alerts/eal-monorepo/issues/7
- Linear project: https://linear.app/denman/project/githubcomembedded-alerts-2fb7392497ab
- GitHub Project: https://github.com/orgs/embedded-alerts/projects/1

The publication helper generates a real npm lockfile before creating the repository. A Zed lock remains deferred until a real successful Zed resolver run can certify all published dependencies.
