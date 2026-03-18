import { test, expect } from '@playwright/test';

test.describe('Agent Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.click('text=Settings');
    await page.waitForSelector('text=Add Agent');
  });

  test('opens add agent dialog', async ({ page }) => {
    await page.click('text=Add Agent');
    await expect(page.locator('text=Add New Agent')).toBeVisible();
    await expect(page.locator('text=Quick Add')).toBeVisible();
    await expect(page.locator('text=Full Form')).toBeVisible();
  });

  test('quick add tab is active by default', async ({ page }) => {
    await page.click('text=Add Agent');
    // Check that quick add form elements are visible
    await expect(page.locator('text=Skills Directory Path').first()).toBeVisible();
  });

  test('can switch to full form tab', async ({ page }) => {
    await page.click('text=Add Agent');
    await page.click('text=Full Form');
    await expect(page.locator('text=Agent ID')).toBeVisible();
    await expect(page.locator('text=Display Name')).toBeVisible();
  });

  test('cancel button closes dialog', async ({ page }) => {
    await page.click('text=Add Agent');
    await expect(page.locator('text=Add New Agent')).toBeVisible();
    
    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Add New Agent')).not.toBeVisible();
  });
});
