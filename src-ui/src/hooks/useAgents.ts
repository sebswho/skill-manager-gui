import { useAppStore } from '@/stores/appStore';
import { useConfig } from './useConfig';
import type { Agent } from '@/types';
import { getTauriMockData, isTauriEnv, safeInvoke } from '@/utils/tauriEnv';

export function useAgents() {
  const { agents } = useAppStore();
  const { addAgent } = useConfig();

  const discoverAgents = async () => {
    try {
      const fallback = isTauriEnv() ? undefined : getTauriMockData('agents');
      const discovered = await safeInvoke<Agent[]>('discover_agents', {}, fallback);
      const existingIds = new Set(useAppStore.getState().agents.map((agent) => agent.id));
      const newAgents = discovered.filter(a => !existingIds.has(a.id));
      
      if (newAgents.length > 0) {
        // Persist each newly discovered agent to config
        // This prevents them from being lost when adding custom agents later
        // Note: addAgent will update the store, so we don't need setAgents here
        for (const agent of newAgents) {
          await addAgent(agent);
        }
      }
      
      return discovered;
    } catch (error) {
      console.error('Failed to discover agents:', error);
      throw error;
    }
  };

  const validateAgentPath = async (path: string): Promise<boolean> => {
    try {
      const fallback = isTauriEnv() ? undefined : !!path.trim();
      return await safeInvoke<boolean>('validate_agent_path', { path }, fallback);
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
