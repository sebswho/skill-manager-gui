import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '@/stores/appStore';
import type { ScanResult, Skill } from '@/types';

export function useSkills() {
  const { 
    config, 
    setSkills, 
    setAgents, 
    setSyncMatrix, 
    setPendingChanges, 
    setConflicts,
    setIsLoading,
    agents 
  } = useAppStore();

  const scanCentralHub = async () => {
    if (!config) return [];
    
    try {
      const skills = await invoke<Skill[]>('scan_central_hub', { 
        hubPath: config.central_hub_path 
      });
      setSkills(skills);
      return skills;
    } catch (error) {
      console.error('Failed to scan hub:', error);
      throw error;
    }
  };

  const scanAll = async () => {
    if (!config || agents.length === 0) return null;
    
    setIsLoading(true);
    try {
      const result = await invoke<ScanResult>('scan_all', {
        agents,
        hubPath: config.central_hub_path,
      });
      
      setSkills(result.skills);
      setPendingChanges(result.pending_changes);
      setConflicts(result.conflicts);
      
      // Build sync matrix
      const matrix: Record<string, Record<string, string>> = {};
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

  return {
    scanCentralHub,
    scanAll,
  };
}
