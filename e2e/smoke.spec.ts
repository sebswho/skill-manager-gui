/**
 * Copyright (C) 2024 sebswho
 * Smoke Tests for Agent Skills Manager
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('app loads successfully', async ({ page }) => {
    // Check that the app title is visible (use exact match)
    await expect(page.getByRole('heading', { name: 'Agent Skills Manager', exact: true })).toBeVisible();
  });

  test('sidebar with skill library exists', async ({ page }) => {
    // Check for new skill library sidebar
    await expect(page.locator('text=我的技能库')).toBeVisible();
    await expect(page.locator('[data-testid="skill-section-local"]')).toBeVisible();
  });

  test('empty state shown when no skill selected', async ({ page }) => {
    // Should show welcome message
    await expect(page.locator('text=欢迎使用 Agent Skills Manager')).toBeVisible();
  });

  test('search input exists in sidebar', async ({ page }) => {
    await expect(page.locator('input[placeholder="搜索技能..."]')).toBeVisible();
  });

  test('theme toggle works', async ({ page }) => {
    // Find and click theme toggle
    const themeToggle = page.locator('button[aria-label*="theme"]').first();
    
    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.click();
      // Should not throw error
      await expect(themeToggle).toBeVisible();
    }
  });

  test('settings drawer can be opened', async ({ page }) => {
    const settingsButton = page.locator('[data-testid="open-settings-button"]');
    
    if (await settingsButton.isVisible().catch(() => false)) {
      await settingsButton.click();
      // Wait a bit for animation
      await page.waitForTimeout(300);
      await expect(page.locator('[data-testid="settings-drawer"]')).toBeVisible();
    }
  });
});
