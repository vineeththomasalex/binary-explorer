import { test } from '@playwright/test';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_BIN = join(__dirname, 'test.exe');

test('capture screenshot with loaded binary', async ({ page }) => {
  if (!existsSync(TEST_BIN)) {
    execSync('node tests/generate-test-binary.mjs', { cwd: join(__dirname, '..') });
  }

  await page.goto('/');
  await page.setViewportSize({ width: 1280, height: 800 });

  // Upload the test binary via file chooser
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('.drop-zone').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(TEST_BIN);
  await page.locator('.summary-view').waitFor({ state: 'visible', timeout: 10000 });

  // Switch to hex view for the cool Matrix look
  await page.locator('.tab-btn', { hasText: 'Hex' }).click();
  await page.locator('.hex-viewer').waitFor({ state: 'visible' });

  await page.screenshot({
    path: join(__dirname, '..', 'screenshot.png'),
    fullPage: false,
  });
});
