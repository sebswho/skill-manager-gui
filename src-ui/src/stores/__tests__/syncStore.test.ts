/**
 * Copyright (C) 2024 sebswho
 * This file is part of Skilltoon.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSyncStore } from '../syncStore';

describe('syncStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSyncStore.setState({
      isSyncing: false,
      syncError: null,
      syncSuccess: false,
    });
  });

  describe('state management', () => {
    it('should have initial state', () => {
      const state = useSyncStore.getState();
      expect(state.isSyncing).toBe(false);
      expect(state.syncError).toBeNull();
      expect(state.syncSuccess).toBe(false);
    });

    it('should set syncing state', () => {
      useSyncStore.getState().setIsSyncing(true);
      expect(useSyncStore.getState().isSyncing).toBe(true);
    });

    it('should set error state', () => {
      useSyncStore.getState().setSyncError('Test error');
      expect(useSyncStore.getState().syncError).toBe('Test error');
    });

    it('should set success state', () => {
      useSyncStore.getState().setSyncSuccess(true);
      expect(useSyncStore.getState().syncSuccess).toBe(true);
    });

    it('should reset state', () => {
      const store = useSyncStore.getState();
      store.setIsSyncing(true);
      store.setSyncError('error');
      store.setSyncSuccess(true);
      
      store.resetSyncState();
      
      expect(useSyncStore.getState().isSyncing).toBe(false);
      expect(useSyncStore.getState().syncError).toBeNull();
      expect(useSyncStore.getState().syncSuccess).toBe(false);
    });
  });

  describe('calculateChanges', () => {
    it('should calculate installs for new selections', () => {
      const store = useSyncStore.getState();
      const currentInstallations = new Set<string>(['agent-1']);
      const selectedAgents = new Set<string>(['agent-1', 'agent-2', 'agent-3']);
      
      const changes = store.calculateChanges('skill-1', selectedAgents, currentInstallations);
      
      expect(changes.skillId).toBe('skill-1');
      expect(changes.installs).toEqual(['agent-2', 'agent-3']);
      expect(changes.removals).toEqual([]);
    });

    it('should calculate removals for unselected agents', () => {
      const store = useSyncStore.getState();
      const currentInstallations = new Set<string>(['agent-1', 'agent-2', 'agent-3']);
      const selectedAgents = new Set<string>(['agent-1']);
      
      const changes = store.calculateChanges('skill-1', selectedAgents, currentInstallations);
      
      expect(changes.removals).toEqual(['agent-2', 'agent-3']);
      expect(changes.installs).toEqual([]);
    });

    it('should handle mixed changes', () => {
      const store = useSyncStore.getState();
      const currentInstallations = new Set<string>(['agent-1', 'agent-2']);
      const selectedAgents = new Set<string>(['agent-2', 'agent-3']);
      
      const changes = store.calculateChanges('skill-1', selectedAgents, currentInstallations);
      
      expect(changes.installs).toEqual(['agent-3']);
      expect(changes.removals).toEqual(['agent-1']);
    });

    it('should handle no changes', () => {
      const store = useSyncStore.getState();
      const currentInstallations = new Set<string>(['agent-1', 'agent-2']);
      const selectedAgents = new Set<string>(['agent-1', 'agent-2']);
      
      const changes = store.calculateChanges('skill-1', selectedAgents, currentInstallations);
      
      expect(changes.installs).toEqual([]);
      expect(changes.removals).toEqual([]);
    });

    it('should handle empty selections', () => {
      const store = useSyncStore.getState();
      const currentInstallations = new Set<string>(['agent-1']);
      const selectedAgents = new Set<string>();
      
      const changes = store.calculateChanges('skill-1', selectedAgents, currentInstallations);
      
      expect(changes.installs).toEqual([]);
      expect(changes.removals).toEqual(['agent-1']);
    });
  });
});
