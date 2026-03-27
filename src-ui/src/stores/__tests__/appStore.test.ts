/**
 * Copyright (C) 2024 sebswho
 * This file is part of Skilltoon.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../appStore';

describe('appStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAppStore.setState({
      selectedSkillId: null,
      selectedAgentsForSync: new Set(),
    });
  });

  describe('skill selection', () => {
    it('should have null selected skill initially', () => {
      expect(useAppStore.getState().selectedSkillId).toBeNull();
    });

    it('should set selected skill', () => {
      useAppStore.getState().setSelectedSkillId('skill-1');
      expect(useAppStore.getState().selectedSkillId).toBe('skill-1');
    });

    it('should clear selected skill', () => {
      useAppStore.getState().setSelectedSkillId('skill-1');
      useAppStore.getState().setSelectedSkillId(null);
      expect(useAppStore.getState().selectedSkillId).toBeNull();
    });
  });

  describe('agent selection for sync', () => {
    it('should have empty selected agents initially', () => {
      expect(useAppStore.getState().selectedAgentsForSync.size).toBe(0);
    });

    it('should toggle agent selection', () => {
      useAppStore.getState().toggleAgentForSync('agent-1');
      expect(useAppStore.getState().selectedAgentsForSync.has('agent-1')).toBe(true);
    });

    it('should toggle off selected agent', () => {
      useAppStore.getState().toggleAgentForSync('agent-1');
      useAppStore.getState().toggleAgentForSync('agent-1');
      expect(useAppStore.getState().selectedAgentsForSync.has('agent-1')).toBe(false);
    });

    it('should select all agents', () => {
      useAppStore.getState().selectAllAgentsForSync(['agent-1', 'agent-2', 'agent-3']);
      const selected = useAppStore.getState().selectedAgentsForSync;
      expect(selected.has('agent-1')).toBe(true);
      expect(selected.has('agent-2')).toBe(true);
      expect(selected.has('agent-3')).toBe(true);
    });

    it('should deselect all agents', () => {
      useAppStore.getState().selectAllAgentsForSync(['agent-1', 'agent-2']);
      useAppStore.getState().deselectAllAgentsForSync();
      expect(useAppStore.getState().selectedAgentsForSync.size).toBe(0);
    });

    it('should set selected agents directly', () => {
      const newSet = new Set(['agent-1', 'agent-2']);
      useAppStore.getState().setSelectedAgentsForSync(newSet);
      expect(useAppStore.getState().selectedAgentsForSync).toEqual(newSet);
    });
  });

  describe('reset functionality', () => {
    it('should reset skill selection', () => {
      const store = useAppStore.getState();
      store.setSelectedSkillId('skill-1');
      store.selectAllAgentsForSync(['agent-1']);
      
      store.resetSkillSelection();
      
      expect(useAppStore.getState().selectedSkillId).toBeNull();
      expect(useAppStore.getState().selectedAgentsForSync.size).toBe(0);
    });
  });
});
