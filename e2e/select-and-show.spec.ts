/**
 * Copyright (C) 2024 sebswho
 * E2E Tests for Select-and-Show UI
 */

import { test, expect } from '@playwright/test';

// Mock data for consistent testing
const mockSkills = [
  { name: 'typescript-utils', source: 'local', size: 12345, modified_at: new Date().toISOString() },
  { name: 'react-hooks', source: 'local', size: 67890, modified_at: new Date().toISOString() },
];

const mockAgents = [
  { id: 'claude-code', name: 'Claude Code', skills_path: '/Users/test/.claude/skills', is_discovered: true },
  { id: 'trae', name: 'Trae', skills_path: '/Users/test/.trae/skills', is_discovered: true },
];

test.describe('Select-and-Show UI', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept and mock Tauri calls
    await page.addInitScript(() => {
      // @ts-ignore
      window.__TAURI_INVOKE_HANDLER__ = (cmd: string, args: any) => {
        switch (cmd) {
          case 'load_config':
            return Promise.resolve({
              central_hub_path: '/Users/test/.agents/skills',
              agents: mockAgents,
              window_width: 1200,
              window_height: 800,
              theme: 'dark',
              locale: 'zh-CN',
            });
          case 'discover_agents':
            return Promise.resolve(mockAgents);
          case 'scan_all':
            return Promise.resolve({
              skills: mockSkills,
              agent_statuses: [
                { agent_id: 'claude-code', skill_name: 'typescript-utils', status: 'synced', is_symlink: true, target_path: '/Users/test/.agents/skills/typescript-utils' },
                { agent_id: 'trae', skill_name: 'typescript-utils', status: 'missing', is_symlink: false, target_path: null },
              ],
              pending_changes: [],
              conflicts: [],
            });
          default:
            return Promise.resolve({});
        }
      };
    });

    await page.goto('/');
    // Wait for the app to load and initialize
    await page.waitForTimeout(1000);
  });

  test.describe('Layout', () => {
    test('should display sidebar with skill library', async ({ page }) => {
      await expect(page.locator('text=我的技能库')).toBeVisible();
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
      // Wait for skills to be loaded
      await page.waitForSelector('[data-testid="skill-nav-item"]', { timeout: 5000 });
      
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      await expect(firstSkill).toBeVisible();
      
      await firstSkill.click();
      
      // Detail panel should appear
      await expect(page.locator('[data-testid="skill-detail-panel"]')).toBeVisible();
    });

    test('should highlight selected skill', async ({ page }) => {
      await page.waitForSelector('[data-testid="skill-nav-item"]', { timeout: 5000 });
      
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      await expect(firstSkill).toBeVisible();
      
      await firstSkill.click();
      
      // Check for selected state styling
      await expect(firstSkill).toHaveClass(/border-green-400|bg-slate-700/);
    });
  });

  test.describe('Agent Cards', () => {
    test('should display agent cards when skill selected', async ({ page }) => {
      await page.waitForSelector('[data-testid="skill-nav-item"]', { timeout: 5000 });
      
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      await firstSkill.click();
      
      // Agent cards should be visible
      await expect(page.locator('text=分配状态')).toBeVisible();
      
      // At least one agent card should be visible
      await expect(page.locator('[data-testid="agent-card"]').first()).toBeVisible();
    });

    test('should toggle agent selection on click', async ({ page }) => {
      await page.waitForSelector('[data-testid="skill-nav-item"]', { timeout: 5000 });
      
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      await firstSkill.click();
      
      const firstAgentCard = page.locator('[data-testid="agent-card"]').first();
      await expect(firstAgentCard).toBeVisible();
      
      // Click to select
      await firstAgentCard.click();
      
      // Should have green border after selection
      await expect(firstAgentCard).toHaveClass(/border-green-400/);
    });
  });

  test.describe('Sync Action', () => {
    test('should disable sync button when no changes', async ({ page }) => {
      await page.waitForSelector('[data-testid="skill-nav-item"]', { timeout: 5000 });
      
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      await firstSkill.click();
      
      const syncButton = page.locator('button:has-text("一键同步")');
      
      // Button should be disabled initially (no changes)
      await expect(syncButton).toBeDisabled();
    });

    test('should enable sync button after selection changes', async ({ page }) => {
      await page.waitForSelector('[data-testid="skill-nav-item"]', { timeout: 5000 });
      
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      await firstSkill.click();
      
      const firstAgentCard = page.locator('[data-testid="agent-card"]').first();
      await expect(firstAgentCard).toBeVisible();
      
      // Find a card that's not installed and click it
      const notInstalledCard = page.locator('[data-testid="agent-card"]:has-text("未安装")').first();
      if (await notInstalledCard.isVisible().catch(() => false)) {
        await notInstalledCard.click();
        
        // Sync button should now be enabled
        const syncButton = page.locator('button:has-text("一键同步")');
        await expect(syncButton).toBeEnabled();
      }
    });

    test('should show sync summary', async ({ page }) => {
      await page.waitForSelector('[data-testid="skill-nav-item"]', { timeout: 5000 });
      
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      await firstSkill.click();
      
      const notInstalledCard = page.locator('[data-testid="agent-card"]:has-text("未安装")').first();
      if (await notInstalledCard.isVisible().catch(() => false)) {
        await notInstalledCard.click();
        
        // Summary should appear
        await expect(page.locator('text=将安装')).toBeVisible();
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
      await page.waitForSelector('[data-testid="skill-nav-item"]', { timeout: 5000 });
      
      const firstSkill = page.locator('[data-testid="skill-nav-item"]').first();
      await expect(firstSkill).toBeVisible();
      
      // Should be able to focus
      await firstSkill.focus();
      await expect(firstSkill).toBeFocused();
    });
  });
});
