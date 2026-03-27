/**
 * Copyright (C) 2024 sebswho
 * This file is part of Skilltoon.
 * Skilltoon is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Skilltoon is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Skilltoon.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react';
import { Trophy, Star, Zap, Target, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AchievementType = 
  | 'first_sync' // 首次同步
  | 'skill_master' // 技能大师 (同步10个技能)
  | 'agent_connector' // 智能体连接者 (连接5个智能体)
  | 'streak_week' // 周冠军 (连续使用7天)
  | 'streak_month' // 月度之星 (连续使用30天)
  | 'early_adopter'; // 早期采用者

interface Achievement {
  id: AchievementType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const ACHIEVEMENTS: Record<AchievementType, Achievement> = {
  first_sync: {
    id: 'first_sync',
    title: '首次同步',
    description: '完成第一次技能同步',
    icon: <Zap className="w-5 h-5" />,
    color: 'text-vibrant-amber',
    bgColor: 'from-vibrant-amber/20 to-vibrant-rose/20',
  },
  skill_master: {
    id: 'skill_master',
    title: '技能大师',
    description: '成功同步10个技能',
    icon: <Trophy className="w-5 h-5" />,
    color: 'text-vibrant-purple',
    bgColor: 'from-vibrant-purple/20 to-vibrant-blue/20',
  },
  agent_connector: {
    id: 'agent_connector',
    title: '智能体连接者',
    description: '连接5个AI智能体',
    icon: <Target className="w-5 h-5" />,
    color: 'text-vibrant-blue',
    bgColor: 'from-vibrant-blue/20 to-vibrant-cyan/20',
  },
  streak_week: {
    id: 'streak_week',
    title: '周冠军',
    description: '连续使用7天',
    icon: <Star className="w-5 h-5" />,
    color: 'text-vibrant-rose',
    bgColor: 'from-vibrant-rose/20 to-vibrant-pink/20',
  },
  streak_month: {
    id: 'streak_month',
    title: '月度之星',
    description: '连续使用30天',
    icon: <Award className="w-5 h-5" />,
    color: 'text-vibrant-green',
    bgColor: 'from-vibrant-green/20 to-vibrant-blue/20',
  },
  early_adopter: {
    id: 'early_adopter',
    title: '早期采用者',
    description: '在产品早期加入',
    icon: <Star className="w-5 h-5" />,
    color: 'text-vibrant-amber',
    bgColor: 'from-vibrant-amber/20 to-vibrant-green/20',
  },
};

interface AchievementBadgeProps {
  type: AchievementType;
  unlocked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    container: 'w-10 h-10',
    icon: 'w-4 h-4',
    text: 'text-xs',
  },
  md: {
    container: 'w-14 h-14',
    icon: 'w-5 h-5',
    text: 'text-sm',
  },
  lg: {
    container: 'w-20 h-20',
    icon: 'w-7 h-7',
    text: 'text-base',
  },
};

export function AchievementBadge({
  type,
  unlocked = false,
  size = 'md',
  showLabel = false,
  className,
}: AchievementBadgeProps) {
  const achievement = ACHIEVEMENTS[type];
  const config = sizeConfig[size];

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      {/* Badge Circle */}
      <div
        className={cn(
          'relative rounded-full',
          config.container,
          'flex items-center justify-center',
          'transition-all duration-300',
          unlocked
            ? [
                'bg-gradient-to-br',
                achievement.bgColor,
                'shadow-clay',
                'animate-pulse-glow',
              ]
            : [
                'bg-muted/30',
                'border-2 border-dashed border-border',
                'opacity-50',
              ]
        )}
        title={`${achievement.title} - ${achievement.description}`}
      >
        {/* Icon */}
        <div
          className={cn(
            config.icon,
            unlocked ? achievement.color : 'text-muted-foreground'
          )}
        >
          {achievement.icon}
        </div>

        {/* Unlock indicator */}
        {unlocked && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-vibrant-green text-white flex items-center justify-center shadow-clay-sm">
            <Star className="w-2.5 h-2.5 fill-current" />
          </div>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <div className="text-center">
          <div
            className={cn(
              'font-semibold',
              config.text,
              unlocked ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {achievement.title}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {achievement.description}
          </div>
        </div>
      )}
    </div>
  );
}

// Achievement Grid for displaying multiple badges
interface AchievementGridProps {
  unlockedIds: AchievementType[];
  className?: string;
}

export function AchievementGrid({ unlockedIds, className }: AchievementGridProps) {
  const allAchievements = Object.values(ACHIEVEMENTS);

  return (
    <div className={cn('grid grid-cols-3 gap-4', className)}>
      {allAchievements.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          type={achievement.id}
          unlocked={unlockedIds.includes(achievement.id)}
          showLabel
        />
      ))}
    </div>
  );
}
