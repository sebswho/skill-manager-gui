/**
 * Copyright (C) 2024 sebswho
 * This file is part of Agent Skills Manager.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAchievements, useCelebration } from '../useCelebration';

describe('useCelebration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('activates then auto-stops after duration', () => {
    const { result } = renderHook(() => useCelebration({ duration: 300 }));

    expect(result.current.isActive).toBe(false);

    act(() => {
      result.current.trigger();
    });
    expect(result.current.isActive).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.isActive).toBe(false);
  });
});

describe('useAchievements', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty achievements and avoids duplicates', () => {
    const { result } = renderHook(() => useAchievements());

    expect(result.current.getUnlockedAchievements()).toEqual([]);

    act(() => {
      expect(result.current.unlockAchievement('first_sync')).toBe(true);
    });

    expect(result.current.getUnlockedAchievements()).toEqual(['first_sync']);

    act(() => {
      expect(result.current.unlockAchievement('first_sync')).toBe(false);
    });
    expect(result.current.getUnlockedAchievements()).toEqual(['first_sync']);
  });
});
