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

import { Square, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agent } from '@/types';

interface AgentCardProps {
  agent: Agent;
  isInstalled: boolean;
  isSelected: boolean;
  onToggle: () => void;
}

export function AgentCard({ agent, isInstalled, isSelected, onToggle }: AgentCardProps) {
  // Calculate display state
  const willInstall = isSelected && !isInstalled;
  const willRemove = !isSelected && isInstalled;
  
  // Get status text and color
  const getStatusInfo = () => {
    if (willInstall) return { text: '☑️ 将安装', className: 'text-blue-400' };
    if (willRemove) return { text: '🗑️ 将卸载', className: 'text-red-400' };
    if (isInstalled) return { text: '✅ 已安装', className: 'text-green-400' };
    return { text: '⬜ 未安装', className: 'text-slate-500' };
  };
  
  const statusInfo = getStatusInfo();

  return (
    <button
      data-testid="agent-card"
      onClick={onToggle}
      className={cn(
        'relative w-full p-3 rounded-lg border text-left transition-all duration-150',
        'hover:scale-[1.02] active:scale-[0.98]',
        isSelected
          ? 'border-green-400 bg-green-400/10'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
      )}
    >
      {/* Selection indicator */}
      <div
        className={cn(
          'absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center',
          isSelected ? 'bg-green-400 text-slate-900' : 'bg-slate-700 text-slate-400'
        )}
      >
        {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
      </div>

      {/* Agent icon */}
      <div className="text-3xl mb-2">🤖</div>

      {/* Agent name */}
      <div className="font-medium text-sm truncate pr-6">{agent.name}</div>

      {/* Status text */}
      <div className={cn('text-xs mt-1.5', statusInfo.className)}>{statusInfo.text}</div>
    </button>
  );
}
