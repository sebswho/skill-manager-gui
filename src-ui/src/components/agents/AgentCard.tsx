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

import { Square, CheckSquare, AlertTriangle } from 'lucide-react';
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
    if (hasConflict) return { text: '⚠️ 冲突', className: 'text-yellow-400' };
    if (willInstall) return { text: '☑️ 将安装', className: 'text-blue-400' };
    if (willRemove) return { text: '🗑️ 将卸载', className: 'text-red-400' };
    if (isInstalled) return { text: '✅ 已安装', className: 'text-green-400' };
    return { text: '⬜ 未安装', className: 'text-slate-500' };
  };
  
  const statusInfo = getStatusInfo();

  return (
    <div className="relative">
      <button
        data-testid="agent-card"
        onClick={hasConflict ? undefined : onToggle}
        disabled={hasConflict}
        className={cn(
          'relative w-full p-3 rounded-lg border text-left transition-all duration-150',
          'hover:scale-[1.02] active:scale-[0.98]',
          hasConflict && 'border-yellow-500 bg-yellow-500/10',
          !hasConflict && isSelected && 'border-green-400 bg-green-400/10',
          !hasConflict && !isSelected && 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
        )}
      >
        {/* Selection indicator */}
        {!hasConflict && (
          <div
            className={cn(
              'absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center',
              isSelected ? 'bg-green-400 text-slate-900' : 'bg-slate-700 text-slate-400'
            )}
          >
            {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
          </div>
        )}

        {/* Conflict warning */}
        {hasConflict && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center bg-yellow-500 text-slate-900">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Agent icon */}
        <div className="text-3xl mb-2">🤖</div>

        {/* Agent name */}
        <div className="font-medium text-sm truncate pr-6">{agent.name}</div>

        {/* Status text */}
        <div className={cn('text-xs mt-1.5', statusInfo.className)}>{statusInfo.text}</div>
      </button>
      
      {/* Resolve conflict button */}
      {hasConflict && onResolveConflict && (
        <button
          onClick={onResolveConflict}
          className="mt-2 w-full py-1.5 px-2 text-xs bg-yellow-500 text-slate-900 rounded hover:bg-yellow-400 transition-colors font-medium"
        >
          解决冲突
        </button>
      )}
    </div>
  );
}
