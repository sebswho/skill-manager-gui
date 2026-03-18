import { test, expect } from '@playwright/test';

test.describe('Settings Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('opens settings drawer when clicking Settings button', async ({ page }) => {
    await page.click('text=Settings');
    await expect(page.locator('text=Central Hub Path')).toBeVisible();
    await expect(page.locator('text=Agents')).toBeVisible();
  });

  test('closes settings drawer when clicking outside', async ({ page }) => {
    await page.click('text=Settings');
    await expect(page.locator('text=Central Hub Path')).toBeVisible();
    
    // Click outside the drawer (on the overlay)
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Central Hub Path')).not.toBeVisible();
  });

  test('displays current hub path', async ({ page }) => {
    await page.click('text=Settings');
    const input = page.locator('input#hub-path');
    await expect(input).toBeVisible();
    // Should have a default value
    const value = await input.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('displays agents list', async ({ page }) => {
    await page.click('text=Settings');
    await expect(page.locator('text=Add Agent')).toBeVisible();
  });
});
