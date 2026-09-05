import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: [['list'], ['html', {open: 'never'}]],
  use: {baseURL: 'http://127.0.0.1:4173', locale: 'it-IT', timezoneId: 'Europe/Rome', trace: 'retain-on-failure', screenshot: 'only-on-failure'},
  projects: [{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],
  webServer: {command:'npm run preview',url:'http://127.0.0.1:4173',reuseExistingServer:false}
});
