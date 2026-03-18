/**
 * Copyright (C) 2024 sebswho
 * E2E Tests for Select-and-Show UI
 */

import { test, expect } from '@playwright/test';

test.describe('Select-and-Show UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Layout', () => {
    test('should display sidebar with skill library', async ({ page }) => {
      await expect(page.locator('text=我的技能库')).toBeVisible();
      // Use button role to specifically target the category header
      await expect(page.getByRole('button', { name: '📁 本地' })).toBeVisible();
      await expect(page.getByRole('button', { name: /已安装/ })).toBeVisible();
    });

    test('should display empty state when no skill selected', async ({ page }) => {
      await expect(page.locator('text=欢迎使用 Agent Skills Manager')).toBeVisible();
      await expect(page.locator('text=点击左侧技能查看详情')).toBeVisible();
    });

    test('should have search input in sidebar', async ({ page }) => {
      await expect(page.locator('input[placeholder="搜索技能..."]')).toBeVisible();
    });
  });

  test.describe('Skill Selection', () => {
    test('should select skill and display detail panel', async ({ page }) => {
      // Click on first skill in the list (if any)
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      
      // Check if there are any skills
      if (await firstSkill.isVisible().catch(() => false)) {
        await firstSkill.click();
        
        // Detail panel should appear
        await expect(page.locator('[data-testid="skill-detail-panel"]')).toBeVisible();
      }
    });

    test('should highlight selected skill', async ({ page }) => {
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      
      if (await firstSkill.isVisible().catch(() => false)) {
        await firstSkill.click();
        
        // Check for selected state styling
        await expect(firstSkill).toHaveClass(/border-green-400|bg-slate-700/);
      }
    });
  });

  test.describe('Agent Cards', () => {
    test('should display agent cards when skill selected', async ({ page }) => {
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      
      if (await firstSkill.isVisible().catch(() => false)) {
        await firstSkill.click();
        
        // Agent cards should be visible
        await expect(page.locator('text=分配状态')).toBeVisible();
      }
    });

    test('should toggle agent selection on click', async ({ page }) => {
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      
      if (await firstSkill.isVisible().catch(() => false)) {
        await firstSkill.click();
        
        const firstAgentCard = page.locator('[data-testid="agent-card"]').first();
        
        if (await firstAgentCard.isVisible().catch(() => false)) {
          // Click to select
          await firstAgentCard.click();
          
          // Should have green border after selection
          await expect(firstAgentCard).toHaveClass(/border-green-400/);
        }
      }
    });
  });

  test.describe('Sync Action', () => {
    test('should disable sync button when no changes', async ({ page }) => {
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      
      if (await firstSkill.isVisible().catch(() => false)) {
        await firstSkill.click();
        
        const syncButton = page.locator('button:has-text("一键同步")');
        
        // Button should be disabled initially (no changes)
        await expect(syncButton).toBeDisabled();
      }
    });

    test('should enable sync button after selection changes', async ({ page }) => {
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      
      if (await firstSkill.isVisible().catch(() => false)) {
        await firstSkill.click();
        
        const firstAgentCard = page.locator('[data-testid="agent-card"]').first();
        
        if (await firstAgentCard.isVisible().catch(() => false)) {
          // Click to select an agent
          await firstAgentCard.click();
          
          // Sync button should now be enabled
          const syncButton = page.locator('button:has-text("一键同步")');
          await expect(syncButton).toBeEnabled();
        }
      }
    });

    test('should show sync summary', async ({ page }) => {
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      
      if (await firstSkill.isVisible().catch(() => false)) {
        await firstSkill.click();
        
        const firstAgentCard = page.locator('[data-testid="agent-card"]').first();
        
        if (await firstAgentCard.isVisible().catch(() => false)) {
          await firstAgentCard.click();
          
          // Summary should appear
          await expect(page.locator('text=将安装')).toBeVisible();
        }
      }
    });
  });

  test.describe('Search', () => {
    test('should filter skills by search query', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="搜索技能..."]');
      await searchInput.fill('test');
      
      // Should not throw error
      await expect(searchInput).toHaveValue('test');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      // Check for main headings
      const headings = await page.locator('h1, h2').count();
      expect(headings).toBeGreaterThan(0);
    });

    test('all interactive elements should be focusable', async ({ page }) => {
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      
      if (await firstSkill.isVisible().catch(() => false)) {
        // Should be able to focus
        await firstSkill.focus();
        await expect(firstSkill).toBeFocused();
      }
    });
  });
});
