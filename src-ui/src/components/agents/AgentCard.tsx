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

import { Square, CheckSquare, AlertTriangle, Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agent } from '@/types';

interface AgentCardProps {
  agent: Agent;
  isInstalled: boolean;
  isSelected: boolean;
  hasConflict?: boolean;
  onToggle: () => void;
  onResolveConflict?: () => void;
}

export function AgentCard({ agent, isInstalled, isSelected, hasConflict, onToggle, onResolveConflict }: AgentCardProps) {
  // Calculate display state
  const willInstall = isSelected && !isInstalled;
  const willRemove = !isSelected && isInstalled;
  
  // Get status text and color
  const getStatusInfo = () => {
    if (hasConflict) return { 
      text: '冲突', 
      variant: 'warning',
      className: 'text-vibrant-amber' 
    };
    if (willInstall) return { 
      text: '将安装', 
      variant: 'info',
      className: 'text-vibrant-blue' 
    };
    if (willRemove) return { 
      text: '将卸载', 
      variant: 'destructive',
      className: 'text-destructive' 
    };
    if (isInstalled) return { 
      text: '已安装', 
      variant: 'success',
      className: 'text-vibrant-green' 
    };
    return { 
      text: '未安装', 
      variant: 'default',
      className: 'text-muted-foreground' 
    };
  };
  
  const statusInfo = getStatusInfo();

  return (
    <div className="relative group">
      <button
        data-testid="agent-card"
        data-selected={isSelected ? 'true' : 'false'}
        data-installed={isInstalled ? 'true' : 'false'}
        data-conflict={hasConflict ? 'true' : 'false'}
        onClick={hasConflict ? undefined : onToggle}
        disabled={hasConflict}
        className={cn(
          'relative w-full p-4 rounded-3xl border-2 text-left',
          'transition-all duration-200 cursor-pointer',
          'active:scale-95',
          // Claymorphism shadow
          'shadow-clay hover:shadow-clay-lg',
          // Conflict state
          hasConflict && 'border-vibrant-amber/50 bg-vibrant-amber/5',
          // Selected state
          !hasConflict && isSelected && [
            'border-vibrant-green/50 bg-gradient-to-br from-vibrant-green/10 to-vibrant-blue/10',
            'hover:border-vibrant-green',
          ],
          // Unselected state
          !hasConflict && !isSelected && [
            'border-border/50 bg-card/50',
            'hover:border-primary/30 hover:bg-accent/50',
          ]
        )}
      >
        {/* Selection indicator */}
        {!hasConflict && (
          <div
            className={cn(
              'absolute top-3 right-3 w-7 h-7 rounded-xl',
              'flex items-center justify-center',
              'transition-all duration-200',
              'shadow-clay-sm',
              isSelected 
                ? 'bg-gradient-to-br from-vibrant-green to-vibrant-blue text-white' 
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </div>
        )}

        {/* Conflict warning */}
        {hasConflict && (
          <div className={cn(
            'absolute top-3 right-3 w-7 h-7 rounded-xl',
            'flex items-center justify-center',
            'bg-vibrant-amber text-white',
            'shadow-clay-sm animate-wiggle'
          )}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        )}

        {/* Agent icon */}
        <div className={cn(
          'w-12 h-12 rounded-2xl mb-3',
          'bg-gradient-to-br',
          hasConflict 
            ? 'from-vibrant-amber/20 to-vibrant-amber/10' 
            : isSelected 
              ? 'from-vibrant-green/20 to-vibrant-blue/20'
              : 'from-muted to-muted/50',
          'flex items-center justify-center',
          'shadow-clay-sm',
          'group-hover:scale-110 transition-transform'
        )}>
          <Bot className={cn(
            'w-6 h-6',
            hasConflict 
              ? 'text-vibrant-amber' 
              : isSelected 
                ? 'text-vibrant-green' 
                : 'text-muted-foreground'
          )} />
        </div>

        {/* Agent name */}
        <div className="font-semibold text-sm truncate pr-8 mb-1.5 font-body">
          {agent.name}
        </div>

        {/* Status text */}
        <div className={cn(
          'text-xs font-semibold flex items-center gap-1',
          statusInfo.className
        )}>
          {statusInfo.variant === 'success' && <Sparkles className="w-3 h-3" />}
          {statusInfo.text}
        </div>
      </button>
      
      {/* Resolve conflict button */}
      {hasConflict && onResolveConflict && (
        <button
          onClick={onResolveConflict}
          className={cn(
            'mt-2 w-full py-2.5 px-3 text-sm',
            'bg-gradient-to-r from-vibrant-amber to-vibrant-rose',
            'text-white rounded-2xl',
            'font-semibold',
            'shadow-clay hover:shadow-clay-lg',
            'active:scale-95',
            'transition-all duration-200',
            'cursor-pointer'
          )}
        >
          解决冲突
        </button>
      )}
    </div>
  );
}
