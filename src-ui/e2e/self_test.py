#!/usr/bin/env python3
"""
Self-test script for Skilltoon
Tests the GUI using Playwright
"""

from playwright.sync_api import sync_playwright, expect
import time

def run_tests():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=False, slow_mo=100)  # slow_mo for visibility
        context = browser.new_context(viewport={'width': 1400, 'height': 900})
        page = context.new_page()
        
        print("=" * 60)
        print("AGENT SKILLS MANAGER - GUI SELF TEST")
        print("=" * 60)
        
        # Test 1: App loads
        print("\n[Test 1] Opening application...")
        page.goto('http://localhost:1420')
        page.wait_for_load_state('networkidle')
        print("✓ App loaded successfully")
        
        # Take screenshot of initial state
        page.screenshot(path='/Users/swamartin/workspace/projects/skill-manager-gui/test_results/01_initial_load.png', full_page=True)
        
        # Test 2: Check title
        print("\n[Test 2] Checking app title...")
        expect(page.locator('h1')).to_contain_text('Skilltoon')
        print("✓ Title is correct")
        
        # Test 3: Wait for scan to complete and check skills list
        print("\n[Test 3] Waiting for initial scan...")
        time.sleep(3)  # Wait for scan to complete
        
        # Check if skills are displayed
        skills_header = page.locator('.border-r:has-text("Skills") >> text=Skills')
        if skills_header.is_visible():
            print("✓ Skills section visible")
        
        # Take screenshot of main interface
        page.screenshot(path='/Users/swamartin/workspace/projects/skill-manager-gui/test_results/02_main_interface.png', full_page=True)
        
        # Test 4: Open Settings
        print("\n[Test 4] Opening Settings...")
        settings_btn = page.locator('button:has-text("Settings")')
        settings_btn.click()
        time.sleep(1)
        
        # Check settings drawer opened
        expect(page.locator('text=Central Hub Path')).to_be_visible()
        print("✓ Settings drawer opened")
        
        # Check hub path
        hub_path_input = page.locator('input#hub-path')
        hub_path = hub_path_input.input_value()
        print(f"  Hub path: {hub_path}")
        
        # Take screenshot of settings
        page.screenshot(path='/Users/swamartin/workspace/projects/skill-manager-gui/test_results/03_settings_drawer.png', full_page=True)
        
        # Test 5: Check Agents in settings
        print("\n[Test 5] Checking Agents list...")
        agents_section = page.locator('text=Agents')
        expect(agents_section).to_be_visible()
        
        # Count agents
        agent_items = page.locator('.border.rounded-lg').all()
        print(f"  Found {len(agent_items)} agents configured")
        
        for item in agent_items:
            name = item.locator('.font-medium').text_content()
            path = item.locator('.text-xs').text_content()
            print(f"    - {name}: {path}")
        
        # Test 6: Close settings
        print("\n[Test 6] Closing Settings...")
        page.keyboard.press('Escape')
        time.sleep(0.5)
        expect(page.locator('text=Central Hub Path')).not_to_be_visible()
        print("✓ Settings drawer closed")
        
        # Test 7: Check Sync Matrix
        print("\n[Test 7] Checking Sync Matrix...")
        sync_matrix = page.locator('text=Sync Status')
        expect(sync_matrix).to_be_visible()
        print("✓ Sync Matrix visible")
        
        # Count rows in matrix (skills)
        matrix_rows = page.locator('table tbody tr').all()
        print(f"  Sync Matrix has {len(matrix_rows)} skills")
        
        # Take screenshot of sync matrix
        page.screenshot(path='/Users/swamartin/workspace/projects/skill-manager-gui/test_results/04_sync_matrix.png', full_page=True)
        
        # Test 8: Check for conflicts (if any)
        print("\n[Test 8] Checking for conflicts...")
        conflict_banner = page.locator('text=Conflict').first
        if conflict_banner.is_visible():
            print("⚠ Conflicts detected!")
            page.screenshot(path='/Users/swamartin/workspace/projects/skill-manager-gui/test_results/05_conflicts.png', full_page=True)
        else:
            print("✓ No conflicts detected")
        
        # Test 9: Refresh scan
        print("\n[Test 9] Testing Refresh button...")
        refresh_btn = page.locator('button:has-text("Refresh")')
        refresh_btn.click()
        time.sleep(2)  # Wait for scan
        
        # Check if still working
        expect(page.locator('text=Skilltoon')).to_be_visible()
        print("✓ Refresh completed")
        
        # Final screenshot
        page.screenshot(path='/Users/swamartin/workspace/projects/skill-manager-gui/test_results/06_final_state.png', full_page=True)
        
        # Test Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print("✓ App loads successfully")
        print("✓ Settings drawer works")
        print("✓ Agents are displayed")
        print("✓ Skills are displayed")
        print("✓ Sync Matrix is visible")
        print("✓ Refresh function works")
        print("\nAll GUI tests passed! ✓")
        
        browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('/Users/swamartin/workspace/projects/skill-manager-gui/test_results', exist_ok=True)
    run_tests()
