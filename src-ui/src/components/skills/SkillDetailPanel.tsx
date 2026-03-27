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

import { useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { SkillHeader } from './SkillHeader';
import { SkillEmptyState } from './SkillEmptyState';
import { AgentCardGrid } from '@/components/agents/AgentCardGrid';
import { ActionBar } from '@/components/sync/ActionBar';

export function SkillDetailPanel() {
  const {
    skills,
    selectedSkillId,
    syncMatrix,
    setSelectedAgentsForSync,
  } = useAppStore();

  // Get current skill
  const skill = useMemo(() => {
    return skills.find((s) => s.name === selectedSkillId);
  }, [skills, selectedSkillId]);

  // Initialize selected agents when skill changes
  useEffect(() => {
    if (selectedSkillId && syncMatrix[selectedSkillId]) {
      const statusMap = syncMatrix[selectedSkillId];
      const installedAgents = new Set<string>();
      Object.entries(statusMap).forEach(([agentId, status]) => {
        if (status === 'synced') {
          installedAgents.add(agentId);
        }
      });
      setSelectedAgentsForSync(installedAgents);
    } else {
      setSelectedAgentsForSync(new Set());
    }
  }, [selectedSkillId, syncMatrix, setSelectedAgentsForSync]);

  if (!selectedSkillId || !skill) {
    return <SkillEmptyState />;
  }

  return (
    <div data-testid="skill-detail-panel" className="h-full flex flex-col p-6">
      <SkillHeader skill={skill} />
      <div className="flex-1 flex flex-col min-h-0 mt-6">
        <AgentCardGrid skillName={skill.name} />
        <ActionBar skillName={skill.name} />
      </div>
    </div>
  );
}
