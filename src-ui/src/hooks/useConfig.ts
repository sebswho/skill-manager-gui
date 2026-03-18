import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '@/stores/appStore';
import type { Agent, AppConfig } from '@/types';

export function useConfig() {
  const { config, setConfig, setAgents } = useAppStore();

  const loadConfig = async () => {
    try {
      const loaded = await invoke<AppConfig>('load_config');
      setConfig(loaded);
      setAgents(loaded.agents);
      return loaded;
    } catch (error) {
      console.error('Failed to load config:', error);
      throw error;
    }
  };

  const saveConfig = async (newConfig: AppConfig) => {
    try {
      await invoke('save_config', { config: newConfig });
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  };

  const exportConfig = async (path: string) => {
    try {
      await invoke('export_config', { path });
    } catch (error) {
      console.error('Failed to export config:', error);
      throw error;
    }
  };

  const importConfig = async (path: string) => {
    try {
      const loaded = await invoke<AppConfig>('import_config', { path });
      setConfig(loaded);
      setAgents(loaded.agents);
      return loaded;
    } catch (error) {
      console.error('Failed to import config:', error);
      throw error;
    }
  };

  const addAgent = async (agent: Agent) => {
    try {
      const updated = await invoke<AppConfig>('add_agent', { agent });
      setConfig(updated);
      setAgents(updated.agents);
      return updated;
    } catch (error) {
      console.error('Failed to add agent:', error);
      throw error;
    }
  };

  const removeAgent = async (agentId: string) => {
    try {
      const updated = await invoke<AppConfig>('remove_agent', { agentId });
      setConfig(updated);
      setAgents(updated.agents);
      return updated;
    } catch (error) {
      console.error('Failed to remove agent:', error);
      throw error;
    }
  };

  const updateCentralHubPath = async (path: string) => {
    try {
      const updated = await invoke<AppConfig>('update_central_hub_path', { path });
      setConfig(updated);
      return updated;
    } catch (error) {
      console.error('Failed to update hub path:', error);
      throw error;
    }
  };

  return {
    config,
    loadConfig,
    saveConfig,
    exportConfig,
    importConfig,
    addAgent,
    removeAgent,
    updateCentralHubPath,
  };
}
