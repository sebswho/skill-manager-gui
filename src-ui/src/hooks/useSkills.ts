/**
 * Copyright (C) 2024 sebswho
 * This file is part of Skilltoon.
 * 
 * Skills Hook with Tauri Environment Detection
 * Issue: P0 - Tauri environment detection missing
 */

import { useAppStore } from '@/stores/appStore';
import type { ScanResult, Skill, SkillVersion, SyncStatus } from '@/types';
import { safeInvoke, isTauriEnv, getTauriMockData } from '@/utils/tauriEnv';

// Default scan result for non-Tauri environment
const getDefaultScanResult = (): ScanResult => ({
  skills: getTauriMockData('skills'),
  agent_statuses: [],
  pending_changes: [],
  conflicts: [],
});

export function useSkills() {
  const { 
    config, 
    setSkills, 
    setSyncMatrix, 
    setPendingChanges, 
    setConflicts,
    setIsLoading,
    agents 
  } = useAppStore();

  const scanCentralHub = async () => {
    if (!config) return [];
    
    try {
      const fallback = isTauriEnv() ? undefined : getTauriMockData('skills');
      const skills = await safeInvoke<Skill[]>(
        'scan_central_hub',
        { hubPath: config.central_hub_path },
        fallback
      );
      setSkills(skills);
      return skills;
    } catch (error) {
      console.error('Failed to scan hub:', error);
      throw error;
    }
  };

  const scanAll = async () => {
    if (!config) return null;
    
    setIsLoading(true);
    try {
      const fallback = isTauriEnv() ? undefined : getDefaultScanResult();
      const result = await safeInvoke<ScanResult>(
        'scan_all',
        {
          agents,
          hubPath: config.central_hub_path,
        },
        fallback
      );
      
      setSkills(result.skills);
      setPendingChanges(result.pending_changes);
      setConflicts(result.conflicts);
      
      // Build sync matrix
      const matrix: Record<string, Record<string, SyncStatus>> = {};
      result.skills.forEach(skill => {
        matrix[skill.name] = {};
        agents.forEach(agent => {
          matrix[skill.name][agent.id] = 'missing';
        });
      });
      
      result.agent_statuses.forEach(status => {
        if (!matrix[status.skill_name]) {
          matrix[status.skill_name] = {};
        }
        matrix[status.skill_name][status.agent_id] = status.status;
      });
      
      setSyncMatrix(matrix);
      
      return result;
    } catch (error) {
      console.error('Failed to scan all:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getSkillVersions = async (skillName: string): Promise<SkillVersion[]> => {
    if (!config) return [];

    try {
      const fallback = isTauriEnv()
        ? undefined
        : agents.map((agent) => ({
            agent_id: agent.id,
            agent_name: agent.name,
            size: 0,
            modified_at: new Date(0).toISOString(),
            path: `${agent.skills_path}/${skillName}`,
            hash: '',
          }));

      return await safeInvoke<SkillVersion[]>(
        'get_skill_versions',
        {
          skillName,
          agents,
          hubPath: config.central_hub_path,
        },
        fallback
      );
    } catch (error) {
      console.error('Failed to get skill versions:', error);
      throw error;
    }
  };

  return {
    scanCentralHub,
    scanAll,
    getSkillVersions,
  };
}
