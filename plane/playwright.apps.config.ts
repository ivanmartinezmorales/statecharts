import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: 'apps.spec.ts',
  workers: 1,
  timeout: 60_000,
  use: { channel: 'chromium', launchOptions: { args: ['--enable-unsafe-webgpu'] } },
  webServer: [
    { command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 5354', url: 'http://127.0.0.1:5354' },
    { command: 'npm --prefix ../origami run build && npm --prefix ../origami run preview -- --host 127.0.0.1 --port 5352', url: 'http://127.0.0.1:5352' },
    { command: 'npm --prefix ../underground run build && npm --prefix ../underground run preview -- --host 127.0.0.1 --port 5353', url: 'http://127.0.0.1:5353' },
    { command: 'npm --prefix ../site run build && node ../site/serve.js 5351', url: 'http://127.0.0.1:5351' },
  ].map(server => ({ ...server, timeout: 120_000 })),
})
