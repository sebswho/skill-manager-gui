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

import { create } from 'zustand';
import type { Agent, AppConfig, Conflict, PendingChange, Skill, SyncStatus, Theme, Locale } from '@/types';

interface AppState {
  // Config
  config: AppConfig | null;
  setConfig: (config: AppConfig) => void;
  
  // Skills
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;
  
  // Agents
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  
  // Sync State
  syncMatrix: Record<string, Record<string, SyncStatus>>;
  setSyncMatrix: (matrix: Record<string, Record<string, SyncStatus>>) => void;
  updateSyncStatus: (skillName: string, agentId: string, status: SyncStatus) => void;
  
  // Pending & Conflicts
  pendingChanges: PendingChange[];
  setPendingChanges: (changes: PendingChange[]) => void;
  conflicts: Conflict[];
  setConflicts: (conflicts: Conflict[]) => void;
  
  // Conflict Resolution
  selectedConflict: Conflict | null;
  setSelectedConflict: (conflict: Conflict | null) => void;
  resolvedConflicts: Set<string>;
  markConflictResolved: (skillName: string) => void;
  
  // Loading State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Settings UI State
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Locale
  locale: Locale;
  setLocale: (locale: Locale) => void;
  
  // Selection (legacy batch mode)
  selectedSkills: Set<string>;
  setSelectedSkills: (skills: Set<string>) => void;
  toggleSkillSelection: (skillName: string) => void;
  selectedAgents: Set<string>;
  setSelectedAgents: (agents: Set<string>) => void;
  toggleAgentSelection: (agentId: string) => void;
  
  // New: Select-and-Show mode
  selectedSkillId: string | null;
  setSelectedSkillId: (skillId: string | null) => void;
  selectedAgentsForSync: Set<string>; // Agents selected for current skill sync
  setSelectedAgentsForSync: (agents: Set<string>) => void;
  toggleAgentForSync: (agentId: string) => void;
  selectAllAgentsForSync: (agentIds: string[]) => void;
  deselectAllAgentsForSync: () => void;
  
  // Actions
  resetSelection: () => void;
  clearPendingChanges: () => void;
  resetSkillSelection: () => void; // Reset when switching skills
}

export const useAppStore = create<AppState>((set) => ({
  // Config
  config: null,
  setConfig: (config) => set({ config }),
  
  // Skills
  skills: [],
  setSkills: (skills) => set({ skills }),
  
  // Agents
  agents: [],
  setAgents: (agents) => set({ agents }),
  addAgent: (agent) => set((state) => ({ 
    agents: [...state.agents.filter(a => a.id !== agent.id), agent] 
  })),
  removeAgent: (agentId) => set((state) => ({ 
    agents: state.agents.filter(a => a.id !== agentId) 
  })),
  
  // Sync State
  syncMatrix: {},
  setSyncMatrix: (syncMatrix) => set({ syncMatrix }),
  updateSyncStatus: (skillName, agentId, status) => set((state) => ({
    syncMatrix: {
      ...state.syncMatrix,
      [skillName]: {
        ...state.syncMatrix[skillName],
        [agentId]: status,
      },
    },
  })),
  
  // Pending & Conflicts
  pendingChanges: [],
  setPendingChanges: (pendingChanges) => set({ pendingChanges }),
  conflicts: [],
  setConflicts: (conflicts) => set({ conflicts }),
  
  // Conflict Resolution
  selectedConflict: null,
  setSelectedConflict: (selectedConflict) => set({ selectedConflict }),
  resolvedConflicts: new Set(),
  markConflictResolved: (skillName) => set((state) => ({
    resolvedConflicts: new Set([...state.resolvedConflicts, skillName]),
  })),
  
  // Loading State
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  
  // Settings UI State
  isSettingsOpen: false,
  setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  
  // Theme
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  
  // Locale
  locale: 'zh-CN',
  setLocale: (locale) => set({ locale }),
  
  // Selection (legacy batch mode)
  selectedSkills: new Set(),
  setSelectedSkills: (selectedSkills) => set({ selectedSkills }),
  toggleSkillSelection: (skillName) => set((state) => {
    const newSet = new Set(state.selectedSkills);
    if (newSet.has(skillName)) {
      newSet.delete(skillName);
    } else {
      newSet.add(skillName);
    }
    return { selectedSkills: newSet };
  }),
  selectedAgents: new Set(),
  setSelectedAgents: (selectedAgents) => set({ selectedAgents }),
  toggleAgentSelection: (agentId) => set((state) => {
    const newSet = new Set(state.selectedAgents);
    if (newSet.has(agentId)) {
      newSet.delete(agentId);
    } else {
      newSet.add(agentId);
    }
    return { selectedAgents: newSet };
  }),
  
  // New: Select-and-Show mode
  selectedSkillId: null,
  setSelectedSkillId: (selectedSkillId) => set({ selectedSkillId }),
  selectedAgentsForSync: new Set(),
  setSelectedAgentsForSync: (selectedAgentsForSync) => set({ selectedAgentsForSync }),
  toggleAgentForSync: (agentId) => set((state) => {
    const newSet = new Set(state.selectedAgentsForSync);
    if (newSet.has(agentId)) {
      newSet.delete(agentId);
    } else {
      newSet.add(agentId);
    }
    return { selectedAgentsForSync: newSet };
  }),
  selectAllAgentsForSync: (agentIds) => set({ selectedAgentsForSync: new Set(agentIds) }),
  deselectAllAgentsForSync: () => set({ selectedAgentsForSync: new Set() }),
  
  // Actions
  resetSelection: () => set({ selectedSkills: new Set(), selectedAgents: new Set() }),
  clearPendingChanges: () => set({ pendingChanges: [] }),
  resetSkillSelection: () => set({ selectedSkillId: null, selectedAgentsForSync: new Set() }),
}));
