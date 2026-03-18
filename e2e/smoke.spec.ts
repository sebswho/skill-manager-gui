import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('app loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that the app title is visible
    await expect(page.locator('text=Agent Skills Manager')).toBeVisible();
  });

  test('skill list section exists', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for Skills section heading
    await expect(page.locator('text=Skills').first()).toBeVisible();
  });

  test('sync matrix section exists', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for sync status text
    await expect(page.locator('text=Sync Status')).toBeVisible();
  });
});
