/**
 * Copyright (C) 2024 sebswho
 * This file is part of Agent Skills Manager.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSkills } from '../useSkills';
import { useAppStore } from '@/stores/appStore';

const mockSafeInvoke = vi.fn();

vi.mock('@/utils/tauriEnv', () => ({
  isTauriEnv: () => true,
  getTauriMockData: () => [],
  safeInvoke: (...args: unknown[]) => mockSafeInvoke(...args),
}));

describe('useSkills', () => {
  beforeEach(() => {
    mockSafeInvoke.mockReset();
    useAppStore.setState({
      config: {
        central_hub_path: '/tmp/hub',
        agents: [],
        window_width: 1200,
        window_height: 800,
        theme: 'light',
        locale: 'zh-CN',
      },
      agents: [],
      skills: [],
      syncMatrix: {},
      pendingChanges: [],
      conflicts: [],
      isLoading: false,
    });
  });

  it('scans hub skills even when no agents are configured', async () => {
    mockSafeInvoke.mockResolvedValue({
      skills: [
        {
          name: 'demo-skill',
          path: '/tmp/hub/demo-skill',
          size: 1,
          modified_at: new Date().toISOString(),
          hash: 'hash',
        },
      ],
      agent_statuses: [],
      pending_changes: [],
      conflicts: [],
    });

    const { result } = renderHook(() => useSkills());
    await act(async () => {
      await result.current.scanAll();
    });

    expect(mockSafeInvoke).toHaveBeenCalledWith(
      'scan_all',
      { agents: [], hubPath: '/tmp/hub' },
      undefined
    );
    expect(useAppStore.getState().skills.map((skill) => skill.name)).toEqual(['demo-skill']);
  });
});
