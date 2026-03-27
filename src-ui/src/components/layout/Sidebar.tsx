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

import { SkillLibrary } from '@/components/skills/SkillLibrary';
import { StreakCounter } from '@/components/ui/streak-counter';

export function Sidebar() {
  return (
    <aside className="w-64 h-full bg-gradient-to-b from-background to-muted/30 border-r border-border/50 flex flex-col shadow-clay">
      {/* Header with Streak Counter */}
      <div className="p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg bg-gradient-to-r from-vibrant-rose to-vibrant-pink bg-clip-text text-transparent">
            我的技能库
          </h2>
          <StreakCounter days={7} size="sm" />
        </div>
      </div>
      
      {/* Skill Library */}
      <div className="flex-1 overflow-hidden">
        <SkillLibrary />
      </div>
    </aside>
  );
}
