import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_BIN = join(__dirname, 'test.exe');

test.beforeAll(() => {
  if (!existsSync(TEST_BIN)) {
    execSync('node tests/generate-test-binary.mjs', { cwd: join(__dirname, '..') });
  }
});

test.describe('Binary Explorer', () => {
  test('page loads with heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Binary Explorer');
  });

  test('drop zone is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.drop-zone')).toBeVisible();
    await expect(page.locator('.drop-zone')).toContainText('Drop a binary file here');
  });

  test.describe('after loading PE file', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      // Click drop zone to trigger file chooser, then set our test binary
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.locator('.drop-zone').click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(TEST_BIN);
      // Wait for the summary view to appear
      await expect(page.locator('.summary-view')).toBeVisible({ timeout: 10000 });
    });

    test('summary shows AMD64 architecture', async ({ page }) => {
      await expect(page.locator('.summary-view')).toContainText('AMD64');
    });

    test('sections table shows .text section', async ({ page }) => {
      await page.locator('.tab-btn', { hasText: 'Sections' }).click();
      await expect(page.locator('.sections-table')).toBeVisible();
      await expect(page.locator('.sections-table')).toContainText('.text');
    });

    test('hex viewer renders with offsets', async ({ page }) => {
      await page.locator('.tab-btn', { hasText: 'Hex' }).click();
      await expect(page.locator('.hex-viewer')).toBeVisible();
      await expect(page.locator('.hex-offset').first()).toBeVisible();
      await expect(page.locator('.hex-offset').first()).toContainText('00000000');
    });

    test('strings view shows embedded strings', async ({ page }) => {
      await page.locator('.tab-btn', { hasText: 'Strings' }).click();
      await expect(page.locator('.strings-view')).toBeVisible();
      // Our test binary has "Hello World Test Binary" and "TestString123"
      const stringsTable = page.locator('.strings-view');
      await expect(stringsTable).toContainText(/Hello World|TestString/);
    });

    test('tab navigation works', async ({ page }) => {
      // Default tab is Summary
      await expect(page.locator('.summary-view')).toBeVisible();

      // Click Sections tab
      await page.locator('.tab-btn', { hasText: 'Sections' }).click();
      await expect(page.locator('.sections-table')).toBeVisible();

      // Click Hex tab
      await page.locator('.tab-btn', { hasText: 'Hex' }).click();
      await expect(page.locator('.hex-viewer')).toBeVisible();

      // Click Strings tab
      await page.locator('.tab-btn', { hasText: 'Strings' }).click();
      await expect(page.locator('.strings-view')).toBeVisible();

      // Click back to Summary
      await page.locator('.tab-btn', { hasText: 'Summary' }).click();
      await expect(page.locator('.summary-view')).toBeVisible();
    });
  });
});
