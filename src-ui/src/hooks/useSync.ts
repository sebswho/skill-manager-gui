/**
 * Copyright (C) 2024 sebswho
 * This file is part of Agent Skills Manager.
 * 
 * Sync Hook with Tauri Environment Detection
 * Issue: P0 - Tauri environment detection missing
 */

import { useAppStore } from '@/stores/appStore';
import type { Agent, PendingChange, SyncResult } from '@/types';
import { safeInvoke, isTauriEnv } from '@/utils/tauriEnv';

// Default sync result for non-Tauri environment
const defaultSyncResult: SyncResult = {
  success: true,
  message: 'Mock sync result (not in Tauri environment)',
};

export function useSync() {
  const { config, agents } = useAppStore();

  const syncToHub = async (skillName: string, sourceAgent: Agent) => {
    if (!config) throw new Error('No config');
    
    try {
      const fallback = isTauriEnv() ? undefined : defaultSyncResult;
      const result = await safeInvoke<SyncResult>(
        'sync_to_hub',
        {
          skillName,
          sourceAgent,
          hubPath: config.central_hub_path,
        },
        fallback
      );
      
      return result;
    } catch (error) {
      console.error('Failed to sync to hub:', error);
      throw error;
    }
  };

  const syncToAgent = async (skillName: string, agent: Agent) => {
    if (!config) throw new Error('No config');
    
    try {
      const fallback = isTauriEnv() ? undefined : defaultSyncResult;
      const result = await safeInvoke<SyncResult>(
        'sync_to_agent',
        {
          skillName,
          agent,
          hubPath: config.central_hub_path,
        },
        fallback
      );
      
      return result;
    } catch (error) {
      console.error('Failed to sync to agent:', error);
      throw error;
    }
  };

  const batchSync = async (skillNames: string[], targetAgents: Agent[]) => {
    if (!config) throw new Error('No config');
    
    try {
      const fallback = isTauriEnv() ? undefined : [defaultSyncResult];
      const results = await safeInvoke<SyncResult[]>(
        'batch_sync',
        {
          skills: skillNames,
          agents: targetAgents,
          hubPath: config.central_hub_path,
        },
        fallback
      );
      
      return results;
    } catch (error) {
      console.error('Failed to batch sync:', error);
      throw error;
    }
  };

  const executeChanges = async (changes: PendingChange[]) => {
    if (!config) throw new Error('No config');
    
    try {
      const fallback = isTauriEnv() ? undefined : [defaultSyncResult];
      const results = await safeInvoke<SyncResult[]>(
        'execute_changes',
        {
          changes,
          agents,
          hubPath: config.central_hub_path,
        },
        fallback
      );
      
      return results;
    } catch (error) {
      console.error('Failed to execute changes:', error);
      throw error;
    }
  };

  const deleteSkillLocal = async (skillName: string, agentId: string) => {
    if (!config) throw new Error('No config');
    
    try {
      const fallback = isTauriEnv() ? undefined : defaultSyncResult;
      const result = await safeInvoke<SyncResult>(
        'delete_skill_local',
        {
          skillName,
          agentId,
          agents,
          hubPath: config.central_hub_path,
        },
        fallback
      );
      
      return result;
    } catch (error) {
      console.error('Failed to delete skill locally:', error);
      throw error;
    }
  };

  const deleteSkillGlobal = async (skillName: string) => {
    if (!config) throw new Error('No config');
    
    try {
      const fallback = isTauriEnv() ? undefined : defaultSyncResult;
      const result = await safeInvoke<SyncResult>(
        'delete_skill_global',
        {
          skillName,
          agents,
          hubPath: config.central_hub_path,
        },
        fallback
      );
      
      return result;
    } catch (error) {
      console.error('Failed to delete skill globally:', error);
      throw error;
    }
  };

  return {
    syncToHub,
    syncToAgent,
    batchSync,
    executeChanges,
    deleteSkillLocal,
    deleteSkillGlobal,
  };
}
