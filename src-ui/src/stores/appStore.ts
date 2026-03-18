import { create } from 'zustand';
import type { Agent, AppConfig, Conflict, PendingChange, Skill, SyncStatus } from '@/types';

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
  
  // Selection
  selectedSkills: Set<string>;
  setSelectedSkills: (skills: Set<string>) => void;
  toggleSkillSelection: (skillName: string) => void;
  selectedAgents: Set<string>;
  setSelectedAgents: (agents: Set<string>) => void;
  toggleAgentSelection: (agentId: string) => void;
  
  // Actions
  resetSelection: () => void;
  clearPendingChanges: () => void;
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
  
  // Selection
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
  
  // Actions
  resetSelection: () => set({ selectedSkills: new Set(), selectedAgents: new Set() }),
  clearPendingChanges: () => set({ pendingChanges: [] }),
}));
