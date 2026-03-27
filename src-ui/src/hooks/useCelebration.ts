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

import { useState, useCallback } from 'react';

interface UseCelebrationOptions {
  duration?: number;
  particleCount?: number;
}

export function useCelebration(options: UseCelebrationOptions = {}) {
  const { duration = 2000, particleCount = 50 } = options;
  const [isActive, setIsActive] = useState(false);

  const trigger = useCallback(() => {
    setIsActive(true);
    
    // Auto-stop after duration
    setTimeout(() => {
      setIsActive(false);
    }, duration);
  }, [duration]);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    trigger,
    stop,
    duration,
    particleCount,
  };
}

// Hook for managing streaks
interface StreakData {
  currentStreak: number;
  lastActiveDate: string;
}

const STREAK_STORAGE_KEY = 'skill-manager-streak';

export function useStreak() {
  const getStreak = useCallback((): number => {
    try {
      const stored = localStorage.getItem(STREAK_STORAGE_KEY);
      if (!stored) return 0;
      
      const data: StreakData = JSON.parse(stored);
      const lastActive = new Date(data.lastActiveDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastActive.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // If more than 1 day has passed, streak is broken
      if (diffDays > 1) {
        return 0;
      }
      
      return data.currentStreak;
    } catch {
      return 0;
    }
  }, []);

  const updateStreak = useCallback(() => {
    try {
      const stored = localStorage.getItem(STREAK_STORAGE_KEY);
      const today = new Date().toISOString().split('T')[0];
      
      if (!stored) {
        // First time
        const data: StreakData = {
          currentStreak: 1,
          lastActiveDate: today,
        };
        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
        return 1;
      }
      
      const data: StreakData = JSON.parse(stored);
      const lastActive = new Date(data.lastActiveDate);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate.getTime() - lastActive.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Same day, no change
        return data.currentStreak;
      } else if (diffDays === 1) {
        // Consecutive day
        const newStreak = data.currentStreak + 1;
        const newData: StreakData = {
          currentStreak: newStreak,
          lastActiveDate: today,
        };
        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(newData));
        return newStreak;
      } else {
        // Streak broken
        const newData: StreakData = {
          currentStreak: 1,
          lastActiveDate: today,
        };
        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(newData));
        return 1;
      }
    } catch {
      return 0;
    }
  }, []);

  return {
    getStreak,
    updateStreak,
  };
}

// Hook for managing achievements
export type AchievementType = 
  | 'first_sync'
  | 'skill_master'
  | 'agent_connector'
  | 'streak_week'
  | 'streak_month'
  | 'early_adopter';

const ACHIEVEMENTS_STORAGE_KEY = 'skill-manager-achievements';

export function useAchievements() {
  const getUnlockedAchievements = useCallback((): AchievementType[] => {
    try {
      const stored = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      if (!stored) return [];
      
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }, []);

  const unlockAchievement = useCallback((type: AchievementType): boolean => {
    try {
      const unlocked = getUnlockedAchievements();
      
      if (unlocked.includes(type)) {
        return false; // Already unlocked
      }
      
      const newUnlocked = [...unlocked, type];
      localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(newUnlocked));
      
      return true; // Newly unlocked
    } catch {
      return false;
    }
  }, [getUnlockedAchievements]);

  return {
    getUnlockedAchievements,
    unlockAchievement,
  };
}
