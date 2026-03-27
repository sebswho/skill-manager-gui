/**
 * Copyright (C) 2024 sebswho
 * This file is part of Agent Skills Manager.
 * Agent Skills Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Agent Skills Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Agent Skills Manager.  If not, see <https://www.gnu.org/licenses/>.
 */

import { useEffect, useMemo, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { SkillDetailPanel } from '@/components/skills/SkillDetailPanel';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { ConflictResolutionDialog } from '@/components/conflicts/ConflictResolutionDialog';
import { ErrorBoundary, NonTauriFallback } from '@/components/ErrorBoundary';
import { useConfig } from '@/hooks/useConfig';
import { useAgents } from '@/hooks/useAgents';
import { useSkills } from '@/hooks/useSkills';
import { useAppStore } from '@/stores/appStore';
import { isTauriEnv, isDevMode } from '@/utils/tauriEnv';
import { useI18n } from '@/i18n';

function AppContent() {
  const { loadConfig } = useConfig();
  const { discoverAgents } = useAgents();
  const { scanAll } = useSkills();
  const { config, theme, locale, agents } = useAppStore();
  const { locale: i18nLocale, setLocale: setI18nLocale } = useI18n();
  
  // Use ref to track initialization state and prevent duplicate calls
  const initRef = useRef(false);
  const scanTrigger = useMemo(() => {
    if (!config) return null;
    const agentIds = agents.map((agent) => agent.id).sort().join(',');
    return `${config.central_hub_path}|${agentIds}`;
  }, [config, agents]);

  // Apply theme class when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Keep i18n provider locale in sync with app store locale.
  useEffect(() => {
    if (i18nLocale !== locale) {
      setI18nLocale(locale);
    }
  }, [locale, i18nLocale, setI18nLocale]);

  // Initialize app only once (fix for React Strict Mode double call)
  useEffect(() => {
    // Skip if already initialized
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        // First load config to get any previously saved agents
        await loadConfig();
        
        // Then discover agents and persist any new ones
        // This ensures auto-discovered agents are saved to config
        // and won't be lost when adding custom agents later
        await discoverAgents();
        
        // Reload config to ensure store has the complete list
        await loadConfig();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    init();
  }, []); // Intentionally empty - using ref pattern to prevent double calls

  // Re-scan when hub path or agent set changes.
  useEffect(() => {
    if (!scanTrigger) return;

    // Scan all skills from hub and agents
    scanAll().catch(error => {
      console.error('Failed to scan skills:', error);
    });
  }, [scanTrigger]); // Intentionally tied to trigger key, not function identity

  return (
    <MainLayout>
      <div className="flex h-full">
        <Sidebar />
        <div className="flex-1 overflow-hidden">
          <SkillDetailPanel />
        </div>
      </div>
      <SettingsDrawer />
      <ConflictResolutionDialog />
    </MainLayout>
  );
}

function App() {
  // Show non-Tauri fallback in production browser mode
  if (!isTauriEnv() && !isDevMode()) {
    return <NonTauriFallback />;
  }

  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
