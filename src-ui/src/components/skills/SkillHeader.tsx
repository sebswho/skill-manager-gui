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

import { useState } from 'react';
import type { Skill } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, ChevronDown, ChevronUp } from 'lucide-react';

interface SkillHeaderProps {
  skill: Skill;
}

export function SkillHeader({ skill }: SkillHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Mock description - in real app would come from skill metadata
  const description = `自定义 React Hooks 集合，包含 useDebounce、useLocalStorage、useFetch 等常用 Hooks。这个技能包提供了开发 React 应用时最常用的工具函数，可以帮助你快速构建应用。`;
  const shouldTruncate = description.length > 120;
  const displayDescription = isExpanded ? description : description.slice(0, 120);

  return (
    <header className="pb-4 border-b border-slate-700">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-mono font-semibold truncate">{skill.name}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
              📍 本地
            </Badge>
            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
              📏 {formatSize(skill.size)}
            </Badge>
            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
              📅 {formatDate(skill.modified_at)}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="shrink-0 ml-2">
          <Edit2 className="w-4 h-4 mr-1" />
          编辑
        </Button>
      </div>
      
      <div className="mt-3 text-slate-300 text-sm leading-relaxed">
        {displayDescription}
        {shouldTruncate && !isExpanded && '...'}
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 text-green-400 hover:text-green-300 inline-flex items-center gap-0.5"
          >
            {isExpanded ? (
              <>收起 <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>展开 <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
