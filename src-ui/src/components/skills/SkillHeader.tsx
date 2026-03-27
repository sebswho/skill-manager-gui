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
import { Edit2, ChevronDown, ChevronUp, MapPin, FileCode, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

interface SkillHeaderProps {
  skill: Skill;
}

export function SkillHeader({ skill }: SkillHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { locale } = useAppStore();
  
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr || '-';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const description = `Path: ${skill.path}`;
  const shouldTruncate = description.length > 120;
  const displayDescription = isExpanded ? description : description.slice(0, 120);

  return (
    <header className="pb-6 border-b border-border/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Skill Name */}
          <h1 className="text-2xl font-heading font-bold truncate mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {skill.name}
          </h1>
          
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="info" 
              className="gap-1.5"
            >
              <MapPin className="w-3 h-3" />
              本地
            </Badge>
            <Badge 
              variant="secondary"
              className="gap-1.5"
            >
              <FileCode className="w-3 h-3" />
              {formatSize(skill.size)}
            </Badge>
            <Badge 
              variant="outline"
              className="gap-1.5"
            >
              <Calendar className="w-3 h-3" />
              {formatDate(skill.modified_at)}
            </Badge>
          </div>
        </div>
        
        {/* Edit Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="shrink-0 gap-2 rounded-xl active:scale-95 transition-transform"
        >
          <Edit2 className="w-4 h-4" />
          <span className="font-semibold">编辑</span>
        </Button>
      </div>
      
      {/* Description */}
      <div className="mt-4 p-4 rounded-2xl bg-muted/30 border border-border/30">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {displayDescription}
          {shouldTruncate && !isExpanded && '...'}
        </p>
        
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "mt-2 text-sm font-semibold",
              "text-primary hover:text-primary/80",
              "inline-flex items-center gap-1",
              "transition-colors"
            )}
          >
            {isExpanded ? (
              <>
                收起 <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                展开全部 <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
