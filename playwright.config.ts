import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: './tests/playwright-report' }]],
  outputDir: './tests/test-results',
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      teardown: 'teardown',
    },
    {
      name: 'teardown',
      testMatch: /global\.teardown\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
      testMatch: /.*\.spec\.ts/,
    },
  ],
}); 