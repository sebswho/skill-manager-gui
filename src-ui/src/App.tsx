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

import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { SkillDetailPanel } from '@/components/skills/SkillDetailPanel';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { ConflictResolutionDialog } from '@/components/conflicts/ConflictResolutionDialog';
import { useConfig } from '@/hooks/useConfig';
import { useAgents } from '@/hooks/useAgents';
import { useSkills } from '@/hooks/useSkills';
import { useAppStore } from '@/stores/appStore';

function App() {
  const { loadConfig } = useConfig();
  const { discoverAgents } = useAgents();
  const { scanAll } = useSkills();
  const { config, theme } = useAppStore();

  // Apply theme class when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const init = async () => {
      // First load config to get any previously saved agents
      await loadConfig();
      
      // Then discover agents and persist any new ones
      // This ensures auto-discovered agents are saved to config
      // and won't be lost when adding custom agents later
      await discoverAgents();
      
      // Reload config to ensure store has the complete list
      await loadConfig();
    };
    init();
  }, []);

  useEffect(() => {
    if (config) {
      // Scan all skills from hub and agents
      scanAll();
    }
  }, [config]);

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

export default App;
