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

import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakCounterProps {
  days: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    icon: 'w-4 h-4',
    text: 'text-sm',
    gap: 'gap-1',
  },
  md: {
    icon: 'w-6 h-6',
    text: 'text-lg',
    gap: 'gap-2',
  },
  lg: {
    icon: 'w-8 h-8',
    text: 'text-2xl',
    gap: 'gap-2',
  },
};

export function StreakCounter({
  days,
  className,
  showLabel = false,
  size = 'md',
}: StreakCounterProps) {
  const config = sizeConfig[size];
  const isActive = days > 0;

  return (
    <div
      className={cn(
        'flex items-center',
        config.gap,
        'group',
        className
      )}
      title={`连续使用 ${days} 天`}
    >
      {/* Fire Icon with Glow */}
      <div
        className={cn(
          'relative',
          isActive && 'animate-pulse-glow'
        )}
      >
        <Flame
          className={cn(
            config.icon,
            'transition-all duration-300',
            isActive
              ? 'text-vibrant-amber fill-vibrant-amber/20'
              : 'text-muted-foreground opacity-40',
            'group-hover:scale-110'
          )}
        />
        {/* Glow effect for active streak */}
        {isActive && (
          <div
            className="absolute inset-0 bg-vibrant-amber/30 rounded-full blur-md"
            style={{ transform: 'scale(1.5)' }}
          />
        )}
      </div>

      {/* Day Count */}
      <div className="flex flex-col">
        <span
          className={cn(
            'font-heading font-bold leading-none',
            config.text,
            isActive ? 'text-vibrant-amber' : 'text-muted-foreground'
          )}
        >
          {days}
        </span>
        {showLabel && (
          <span className="text-xs text-muted-foreground">
            {days === 1 ? '天' : '天'}
          </span>
        )}
      </div>
    </div>
  );
}

// Badge variant for achievements
interface StreakBadgeProps {
  days: number;
  className?: string;
}

export function StreakBadge({ days, className }: StreakBadgeProps) {
  const getMilestone = (days: number) => {
    if (days >= 365) return { label: '年度达人', emoji: '🏆', color: 'text-vibrant-purple' };
    if (days >= 100) return { label: '百日坚持', emoji: '💎', color: 'text-vibrant-blue' };
    if (days >= 30) return { label: '月度之星', emoji: '⭐', color: 'text-vibrant-amber' };
    if (days >= 7) return { label: '周冠军', emoji: '🔥', color: 'text-vibrant-rose' };
    return null;
  };

  const milestone = getMilestone(days);

  if (!milestone) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-gradient-to-r from-vibrant-amber/10 to-vibrant-rose/10',
        'border border-vibrant-amber/20',
        'shadow-clay-sm',
        className
      )}
    >
      <span className="text-lg">{milestone.emoji}</span>
      <span className={cn('text-sm font-semibold', milestone.color)}>
        {milestone.label}
      </span>
    </div>
  );
}
