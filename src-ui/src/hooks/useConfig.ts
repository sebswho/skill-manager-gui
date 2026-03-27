/**
 * Copyright (C) 2024 sebswho
 * This file is part of Agent Skills Manager.
 * 
 * Config Hook with Tauri Environment Detection
 * Issue: P0 - Tauri environment detection missing
 */

import { useAppStore } from '@/stores/appStore';
import type { Agent, AppConfig, Theme, Locale } from '@/types';
import { safeInvoke, isTauriEnv, getTauriMockData } from '@/utils/tauriEnv';

export function useConfig() {
  const { config, setConfig, setAgents, setTheme, setLocale } = useAppStore();

  const loadConfig = async () => {
    try {
      // Use fallback mock data in non-Tauri environment
      const fallbackConfig = isTauriEnv() ? undefined : getTauriMockData('config');
      const loaded = await safeInvoke<AppConfig>('load_config', {}, fallbackConfig);
      
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
      await safeInvoke('save_config', { config: newConfig });
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  };

  const exportConfig = async (path: string) => {
    try {
      await safeInvoke('export_config', { path });
    } catch (error) {
      console.error('Failed to export config:', error);
      throw error;
    }
  };

  const importConfig = async (path: string) => {
    try {
      const fallbackConfig = isTauriEnv() ? undefined : getTauriMockData('config');
      const loaded = await safeInvoke<AppConfig>('import_config', { path }, fallbackConfig);
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
      const fallbackConfig = isTauriEnv() ? undefined : getTauriMockData('config');
      const updated = await safeInvoke<AppConfig>('add_agent', { agent }, fallbackConfig);
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
      const fallbackConfig = isTauriEnv() ? undefined : getTauriMockData('config');
      const updated = await safeInvoke<AppConfig>('remove_agent', { agentId }, fallbackConfig);
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
      const fallbackConfig = isTauriEnv() ? undefined : getTauriMockData('config');
      const updated = await safeInvoke<AppConfig>('update_central_hub_path', { path }, fallbackConfig);
      setConfig(updated);
      return updated;
    } catch (error) {
      console.error('Failed to update hub path:', error);
      throw error;
    }
  };

  const updateTheme = async (theme: Theme) => {
    try {
      const fallbackConfig = isTauriEnv() ? undefined : getTauriMockData('config');
      const updated = await safeInvoke<AppConfig>('update_theme', { theme }, fallbackConfig);
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
      const fallbackConfig = isTauriEnv() ? undefined : getTauriMockData('config');
      const updated = await safeInvoke<AppConfig>('update_locale', { locale }, fallbackConfig);
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
