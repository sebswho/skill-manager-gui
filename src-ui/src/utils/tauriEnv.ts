/**
 * Copyright (C) 2024 sebswho
 * This file is part of Agent Skills Manager.
 * 
 * Tauri Environment Detection and Safe API Wrapper
 * Issue: P0 - Tauri environment detection missing
 */

import type { AppConfig, Skill, Agent } from '@/types';

/**
 * Check if running inside Tauri environment
 */
export function isTauriEnv(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return '__TAURI__' in window;
}

/**
 * Safely invoke Tauri commands with fallback for non-Tauri environments
 * @param command - The Tauri command to invoke
 * @param args - Arguments to pass to the command
 * @param fallback - Optional fallback value when not in Tauri environment
 * @returns Promise with the result or fallback
 */
export async function safeInvoke<T>(
  command: string,
  args: Record<string, unknown> = {},
  fallback?: T
): Promise<T> {
  if (!isTauriEnv()) {
    if (fallback !== undefined) {
      console.warn(
        `[TauriEnv] Using fallback for command "${command}" - not in Tauri environment`
      );
      return fallback;
    }
    throw new Error(
      `Tauri API not available: ${command} called outside Tauri environment`
    );
  }

  // Dynamic import to avoid errors in non-Tauri environments
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}

/**
 * Check if running in development mode (browser without Tauri)
 */
export function isDevMode(): boolean {
  // Check for Vite's DEV flag
  const isDev = typeof import.meta !== 'undefined' && 
    // @ts-expect-error - Vite specific property
    typeof import.meta.env !== 'undefined' && 
    // @ts-expect-error - Vite specific property
    import.meta.env.DEV === true;
  
  return !isTauriEnv() && isDev;
}

/**
 * Get mock data for development/testing in non-Tauri environments
 */
export function getTauriMockData(type: 'config'): AppConfig;
export function getTauriMockData(type: 'skills'): Skill[];
export function getTauriMockData(type: 'agents'): Agent[];
export function getTauriMockData(type: 'config' | 'skills' | 'agents'): unknown {
  const mockConfig: AppConfig = {
    central_hub_path: '~/.workbuddy/skills',
    agents: [
      {
        id: 'cursor',
        name: 'Cursor',
        skills_path: '~/.cursor/skills',
        is_discovered: true,
      },
      {
        id: 'windsurf',
        name: 'Windsurf',
        skills_path: '~/.windsurf/skills',
        is_discovered: true,
      },
      {
        id: 'claude-code',
        name: 'Claude Code',
        skills_path: '~/.claude/skills',
        is_discovered: true,
      },
    ],
    window_width: 1200,
    window_height: 800,
    theme: undefined,
    locale: 'en',
  };

  const mockSkills: Skill[] = [
    {
      name: 'example-skill',
      path: mockConfig.central_hub_path + '/example-skill',
      size: 1024,
      modified_at: new Date().toISOString(),
      hash: 'abc123',
    },
  ];

  const mockAgents: Agent[] = mockConfig.agents;

  switch (type) {
    case 'config':
      return mockConfig;
    case 'skills':
      return mockSkills;
    case 'agents':
      return mockAgents;
    default:
      throw new Error(`Unknown mock data type: ${type}`);
  }
}

/**
 * Create a safe wrapper for Tauri hooks
 * This provides consistent error handling and fallback behavior
 */
export function createSafeTauriHook<TArgs extends unknown[], TResult>(
  tauriCall: (...args: TArgs) => Promise<TResult>,
  fallbackResult?: () => TResult | Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    if (!isTauriEnv()) {
      if (fallbackResult) {
        console.warn('[TauriEnv] Using fallback result - not in Tauri environment');
        return fallbackResult();
      }
      throw new Error('Tauri API not available in this environment');
    }
    return tauriCall(...args);
  };
}
