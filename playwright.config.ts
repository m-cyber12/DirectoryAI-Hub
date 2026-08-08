import { defineConfig, devices } from '@playwright/test';

/**
 * E2E smoke suite (critique §6 — "0 E2E tests" for a site with 200+ pages).
 *
 * Run locally:
 *   npm run build && npm run test:e2e
 *
 * The suite starts the production build (`next start`) and walks the most
 * important user paths: discovery, tool detail, compare, stack builder,
 * deals and the verification labels.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx next start -p 3100 -H 127.0.0.1',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
