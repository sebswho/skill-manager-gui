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

export interface SyncChange {
  skillId: string;
  installs: string[]; // agentIds to install to
  removals: string[]; // agentIds to remove from
}

interface SyncState {
  // Current sync operation
  isSyncing: boolean;
  syncError: string | null;
  syncSuccess: boolean;
  
  // Actions
  setIsSyncing: (syncing: boolean) => void;
  setSyncError: (error: string | null) => void;
  setSyncSuccess: (success: boolean) => void;
  resetSyncState: () => void;
  
  // Calculate changes for a skill based on current selection
  calculateChanges: (
    skillId: string,
    selectedAgents: Set<string>,
    currentInstallations: Set<string>
  ) => SyncChange;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  syncError: null,
  syncSuccess: false,
  
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  setSyncError: (syncError) => set({ syncError }),
  setSyncSuccess: (syncSuccess) => set({ syncSuccess }),
  resetSyncState: () => set({ isSyncing: false, syncError: null, syncSuccess: false }),
  
  calculateChanges: (skillId, selectedAgents, currentInstallations) => {
    const installs: string[] = [];
    const removals: string[] = [];
    
    // Agents to install: selected but not currently installed
    selectedAgents.forEach((agentId) => {
      if (!currentInstallations.has(agentId)) {
        installs.push(agentId);
      }
    });
    
    // Agents to remove: currently installed but not selected
    currentInstallations.forEach((agentId) => {
      if (!selectedAgents.has(agentId)) {
        removals.push(agentId);
      }
    });
    
    return { skillId, installs, removals };
  },
}));
