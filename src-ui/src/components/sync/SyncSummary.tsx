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

interface SyncSummaryProps {
  skillName: string;
}

export function SyncSummary({ skillName }: SyncSummaryProps) {
  const { agents, syncMatrix, selectedAgentsForSync } = useAppStore();

  const { willInstallCount, willRemoveCount } = useMemo(() => {
    const statusMap = syncMatrix[skillName] || {};
    let installCount = 0;
    let removeCount = 0;

    selectedAgentsForSync.forEach((agentId) => {
      if (statusMap[agentId] !== 'synced') {
        installCount++;
      }
    });

    agents.forEach((agent) => {
      if (statusMap[agent.id] === 'synced' && !selectedAgentsForSync.has(agent.id)) {
        removeCount++;
      }
    });

    return { willInstallCount: installCount, willRemoveCount: removeCount };
  }, [syncMatrix, skillName, selectedAgentsForSync, agents]);

  const hasChanges = willInstallCount > 0 || willRemoveCount > 0;

  if (!hasChanges) {
    return (
      <div className="text-sm text-slate-500">
        勾选 Agent 以安装或卸载技能
      </div>
    );
  }

  return (
    <div className="text-sm space-y-1">
      {willInstallCount > 0 && (
        <div data-testid="sync-summary-install" className="text-blue-400">
          • 将安装：1 个技能 → {willInstallCount} 个 Agent
        </div>
      )}
      {willRemoveCount > 0 && (
        <div data-testid="sync-summary-remove" className="text-red-400">
          • 将卸载：1 个技能 → {willRemoveCount} 个 Agent
        </div>
      )}
    </div>
  );
}
