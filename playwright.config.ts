import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:4179',
    headless: true,
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4179',
    port: 4179,
    reuseExistingServer: false,
  },
});
