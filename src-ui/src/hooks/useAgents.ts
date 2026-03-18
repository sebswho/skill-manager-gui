import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '@/stores/appStore';
import type { Agent } from '@/types';

export function useAgents() {
  const { agents, setAgents } = useAppStore();

  const discoverAgents = async () => {
    try {
      const discovered = await invoke<Agent[]>('discover_agents');
      const existingIds = new Set(agents.map(a => a.id));
      const newAgents = discovered.filter(a => !existingIds.has(a.id));
      
      if (newAgents.length > 0) {
        const merged = [...agents, ...newAgents];
        setAgents(merged);
      }
      
      return discovered;
    } catch (error) {
      console.error('Failed to discover agents:', error);
      throw error;
    }
  };

  const validateAgentPath = async (path: string): Promise<boolean> => {
    try {
      return await invoke('validate_agent_path', { path });
    } catch (error) {
      console.error('Failed to validate path:', error);
      return false;
    }
  };

  return {
    agents,
    discoverAgents,
    validateAgentPath,
  };
}
