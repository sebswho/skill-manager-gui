import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '@/stores/appStore';
import type { Agent, AppConfig, Theme, Locale } from '@/types';

export function useConfig() {
  const { config, setConfig, setAgents, setTheme, setLocale } = useAppStore();

  const loadConfig = async () => {
    try {
      const loaded = await invoke<AppConfig>('load_config');
      setConfig(loaded);
      setAgents(loaded.agents);
      // Load theme and locale if saved
      if (loaded.theme) {
        setTheme(loaded.theme);
      }
      if (loaded.locale) {
        setLocale(loaded.locale);
      }
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

  const updateTheme = async (theme: Theme) => {
    try {
      const updated = await invoke<AppConfig>('update_theme', { theme });
      setConfig(updated);
      setTheme(theme);
      return updated;
    } catch (error) {
      console.error('Failed to update theme:', error);
      throw error;
    }
  };

  const updateLocale = async (locale: Locale) => {
    try {
      const updated = await invoke<AppConfig>('update_locale', { locale });
      setConfig(updated);
      setLocale(locale);
      return updated;
    } catch (error) {
      console.error('Failed to update locale:', error);
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
    updateTheme,
    updateLocale,
  };
}
