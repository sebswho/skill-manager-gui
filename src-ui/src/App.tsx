import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SkillList } from '@/components/skills/SkillList';
import { SyncMatrix } from '@/components/sync/SyncMatrix';
import { SyncActions } from '@/components/sync/SyncActions';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { ConflictList } from '@/components/conflicts/ConflictList';
import { ConflictResolutionDialog } from '@/components/conflicts/ConflictResolutionDialog';
import { useConfig } from '@/hooks/useConfig';
import { useAgents } from '@/hooks/useAgents';
import { useSkills } from '@/hooks/useSkills';
import { useAppStore } from '@/stores/appStore';

function App() {
  const { loadConfig } = useConfig();
  const { discoverAgents } = useAgents();
  const { scanAll } = useSkills();
  const { config } = useAppStore();

  useEffect(() => {
    const init = async () => {
      await loadConfig();
      await discoverAgents();
    };
    init();
  }, []);

  useEffect(() => {
    if (config) {
      scanAll();
    }
  }, [config?.agents.length]);

  return (
    <MainLayout>
      <div className="flex h-full">
        <div className="w-64 flex-shrink-0">
          <SkillList />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden p-4">
            <ConflictList />
            <SyncMatrix />
          </div>
          <SyncActions />
        </div>
      </div>
      <SettingsDrawer />
      <ConflictResolutionDialog />
    </MainLayout>
  );
}

export default App;
