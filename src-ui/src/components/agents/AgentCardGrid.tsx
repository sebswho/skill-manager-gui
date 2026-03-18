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

import { useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { AgentCard } from './AgentCard';
import { Button } from '@/components/ui/button';
import { CheckSquare, Square } from 'lucide-react';

interface AgentCardGridProps {
  skillName: string;
}

export function AgentCardGrid({ skillName }: AgentCardGridProps) {
  const {
    agents,
    syncMatrix,
    selectedAgentsForSync,
    toggleAgentForSync,
    selectAllAgentsForSync,
    deselectAllAgentsForSync,
  } = useAppStore();

  // Get current installation status for this skill
  const currentInstallations = useMemo(() => {
    const statusMap = syncMatrix[skillName] || {};
    const installed = new Set<string>();
    Object.entries(statusMap).forEach(([agentId, status]) => {
      if (status === 'synced') {
        installed.add(agentId);
      }
    });
    return installed;
  }, [syncMatrix, skillName]);

  // Initialize selected agents to match current installations on mount
  // This is handled by the parent component (SkillDetailPanel)

  const handleToggle = (agentId: string) => {
    toggleAgentForSync(agentId);
  };

  const allSelected = selectedAgentsForSync.size === agents.length && agents.length > 0;
  const noneSelected = selectedAgentsForSync.size === 0;

  return (
    <section className="flex-1 flex flex-col min-h-0">
      {/* Header with select all/none */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-sm font-medium text-slate-400">分配状态</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selectAllAgentsForSync(agents.map((a) => a.id))}
            disabled={allSelected}
            className="h-7 text-xs"
          >
            <CheckSquare className="w-3.5 h-3.5 mr-1" />
            全选
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={deselectAllAgentsForSync}
            disabled={noneSelected}
            className="h-7 text-xs"
          >
            <Square className="w-3.5 h-3.5 mr-1" />
            取消全选
          </Button>
        </div>
      </div>

      {/* Agent cards grid */}
      <div className="flex-1 overflow-y-auto">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <div className="text-4xl mb-2">🤖</div>
            <p>暂无配置的 Agent</p>
            <p className="text-sm mt-1">请先在设置中添加 Agent</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-4">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isInstalled={currentInstallations.has(agent.id)}
                isSelected={selectedAgentsForSync.has(agent.id)}
                onToggle={() => handleToggle(agent.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
