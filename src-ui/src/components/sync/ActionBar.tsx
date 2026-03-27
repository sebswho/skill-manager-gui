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

import { useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useSyncStore } from '@/stores/syncStore';
import { SyncSummary } from './SyncSummary';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useSync } from '@/hooks/useSync';
import { useSkills } from '@/hooks/useSkills';

interface ActionBarProps {
  skillName: string;
}

export function ActionBar({ skillName }: ActionBarProps) {
  const {
    agents,
    syncMatrix,
    selectedAgentsForSync,
    updateSyncStatus,
  } = useAppStore();
  const { isSyncing, syncError, syncSuccess, setIsSyncing, setSyncError, setSyncSuccess, resetSyncState } = useSyncStore();
  const { syncToAgent, deleteSkillLocal } = useSync();
  const { scanAll } = useSkills();

  // Calculate if there are changes
  const hasChanges = useMemo(() => {
    const statusMap = syncMatrix[skillName] || {};
    
    // Check for installs
    for (const agentId of selectedAgentsForSync) {
      if (statusMap[agentId] !== 'synced') return true;
    }
    
    // Check for removals
    for (const agent of agents) {
      if (statusMap[agent.id] === 'synced' && !selectedAgentsForSync.has(agent.id)) {
        return true;
      }
    }
    
    return false;
  }, [syncMatrix, skillName, selectedAgentsForSync, agents]);

  const handleSync = async () => {
    if (!hasChanges || isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);

    try {
      const statusMap = syncMatrix[skillName] || {};
      const installs: string[] = [];
      const removals: string[] = [];

      // Calculate changes
      selectedAgentsForSync.forEach((agentId) => {
        if (statusMap[agentId] !== 'synced') {
          installs.push(agentId);
        }
      });

      agents.forEach((agent) => {
        if (statusMap[agent.id] === 'synced' && !selectedAgentsForSync.has(agent.id)) {
          removals.push(agent.id);
        }
      });

      // Execute sync for each install
      for (const agentId of installs) {
        const agent = agents.find((item) => item.id === agentId);
        if (!agent) {
          throw new Error(`Agent not found: ${agentId}`);
        }

        const result = await syncToAgent(skillName, agent);
        if (!result.success) {
          throw new Error(result.message);
        }
        updateSyncStatus(skillName, agentId, 'synced');
      }

      // Execute removal for each removal
      for (const agentId of removals) {
        const result = await deleteSkillLocal(skillName, agentId);
        if (!result.success) {
          throw new Error(result.message);
        }
        updateSyncStatus(skillName, agentId, 'missing');
      }

      // Always re-scan after mutation to keep UI state aligned with filesystem truth.
      await scanAll();
      setSyncSuccess(true);
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        resetSyncState();
      }, 3000);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : '同步失败');
    } finally {
      setIsSyncing(false);
    }
  };

  const getButtonContent = () => {
    if (isSyncing) {
      return (
        <>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          同步中...
        </>
      );
    }
    if (syncSuccess) {
      return (
        <>
          <Check className="w-4 h-4 mr-2" />
          同步成功
        </>
      );
    }
    if (syncError) {
      return (
        <>
          <AlertCircle className="w-4 h-4 mr-2" />
          同步失败
        </>
      );
    }
    return (
      <>
        <RefreshCw className="w-4 h-4 mr-2" />
        一键同步选中状态
      </>
    );
  };

  const getButtonVariant = () => {
    if (syncSuccess) return 'default';
    if (syncError) return 'destructive';
    return 'default';
  };

  return (
    <footer className="pt-4 border-t border-slate-700 shrink-0">
      <SyncSummary skillName={skillName} />
      
      <Button
        data-testid="sync-action-button"
        size="lg"
        disabled={!hasChanges || isSyncing}
        onClick={handleSync}
        variant={getButtonVariant()}
        className={`w-full mt-4 ${!hasChanges ? 'bg-slate-700' : 'bg-green-500 hover:bg-green-600'}`}
      >
        {getButtonContent()}
      </Button>
      
      {syncError && (
        <p className="text-red-400 text-sm mt-2 text-center">{syncError}</p>
      )}
    </footer>
  );
}
