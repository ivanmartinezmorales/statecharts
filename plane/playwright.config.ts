import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: 'rendering.spec.ts',
  workers: 1,
  timeout: 60_000,
  // Full Chromium supports worker GPU presentation; headless-shell can lose the device.
  use: { baseURL: 'http://127.0.0.1:5331', channel: 'chromium', launchOptions: { args: ['--enable-unsafe-webgpu'] } },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5331',
    url: 'http://127.0.0.1:5331',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
