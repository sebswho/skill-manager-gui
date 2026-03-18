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

import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { SkillNavItem } from './SkillNavItem';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SkillSection {
  id: string;
  title: string;
  icon: string;
  skills: string[];
}

export function SkillLibrary() {
  const { skills, syncMatrix, selectedSkillId, setSelectedSkillId } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['local', 'installed']));

  // Group skills by category
  const sections: SkillSection[] = useMemo(() => {
    // For now, treat all skills as local (source field not in Skill type yet)
    const localSkills = skills.map((s) => s.name);
    const installedSkills = skills
      .filter((s) => {
        const statusMap = syncMatrix[s.name] || {};
        return Object.values(statusMap).some((status) => status === 'synced');
      })
      .map((s) => s.name);
    
    return [
      { id: 'local', title: '本地', icon: '📁', skills: localSkills },
      { id: 'installed', title: `已安装(${installedSkills.length})`, icon: '📦', skills: installedSkills },
      { id: 'discover', title: '发现技能', icon: '🔍', skills: [] },
    ];
  }, [skills, syncMatrix]);

  // Filter skills based on search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    
    const query = searchQuery.toLowerCase();
    return sections.map((section) => ({
      ...section,
      skills: section.skills.filter((name) => name.toLowerCase().includes(query)),
    })).filter((section) => section.skills.length > 0 || section.id === 'discover');
  }, [sections, searchQuery]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleSkillSelect = (skillName: string) => {
    setSelectedSkillId(skillName);
  };

  const getSkillStatus = (skillName: string): 'synced' | 'unsynced' | 'conflict' => {
    const statusMap = syncMatrix[skillName] || {};
    const agents = useAppStore.getState().agents;
    const syncedCount = Object.values(statusMap).filter((s) => s === 'synced').length;
    
    if (syncedCount === 0) return 'unsynced';
    if (syncedCount === agents.length) return 'synced';
    return 'unsynced';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="搜索技能..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-slate-900/50 border-slate-700"
          />
        </div>
      </div>

      {/* Skill Sections */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filteredSections.map((section) => (
          <div key={section.id} className="mb-2">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 rounded-md transition-colors"
            >
              {expandedSections.has(section.id) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>{section.icon}</span>
              <span>{section.title}</span>
            </button>
            
            {expandedSections.has(section.id) && (
              <div className="mt-1 ml-4 space-y-0.5">
                {section.id === 'discover' ? (
                  <div className="px-3 py-2 text-sm text-slate-500">
                    点击发现更多技能...
                  </div>
                ) : section.skills.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500">
                    暂无技能
                  </div>
                ) : (
                  section.skills.map((skillName) => (
                    <SkillNavItem
                      key={skillName}
                      name={skillName}
                      isSelected={selectedSkillId === skillName}
                      status={getSkillStatus(skillName)}
                      onClick={() => handleSkillSelect(skillName)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Skill Button */}
      <div className="p-3 border-t border-slate-700">
        <Button variant="ghost" className="w-full justify-start gap-2 text-slate-400 hover:text-slate-200">
          <Plus className="w-4 h-4" />
          新增技能
        </Button>
      </div>
    </div>
  );
}
