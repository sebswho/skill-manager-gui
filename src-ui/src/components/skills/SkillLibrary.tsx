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
import { Search, ChevronDown, ChevronRight, Plus, Folder, Package, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SkillSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  skills: string[];
}

export function SkillLibrary() {
  const { skills, syncMatrix, selectedSkillId, setSelectedSkillId, agents } = useAppStore();
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
      { 
        id: 'local', 
        title: '本地', 
        icon: <Folder className="w-4 h-4" />,
        skills: localSkills 
      },
      { 
        id: 'installed', 
        title: `已安装(${installedSkills.length})`, 
        icon: <Package className="w-4 h-4" />,
        skills: installedSkills 
      },
      { 
        id: 'discover', 
        title: '发现技能', 
        icon: <Compass className="w-4 h-4" />,
        skills: [] 
      },
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
    const hasConflict = Object.values(statusMap).some((status) => status === 'conflict');
    const syncedCount = Object.values(statusMap).filter((s) => s === 'synced').length;

    if (hasConflict) return 'conflict';
    if (agents.length > 0 && syncedCount === agents.length) return 'synced';
    return 'unsynced';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="搜索技能..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 bg-card/50 border-border/50 rounded-2xl",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "transition-all duration-200",
              "shadow-clay-sm focus:shadow-clay"
            )}
          />
        </div>
      </div>

      {/* Skill Sections */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
        {filteredSections.map((section) => (
          <div key={section.id} className="rounded-2xl overflow-hidden">
            <button
              data-testid={`skill-section-${section.id}`}
              onClick={() => toggleSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold",
                "text-foreground hover:bg-accent/50 rounded-xl",
                "transition-all duration-200 active:scale-98",
                "group"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg",
                section.id === 'local' && "bg-vibrant-blue/10 text-vibrant-blue",
                section.id === 'installed' && "bg-vibrant-green/10 text-vibrant-green",
                section.id === 'discover' && "bg-vibrant-amber/10 text-vibrant-amber",
                "group-hover:scale-110 transition-transform"
              )}>
                {section.icon}
              </div>
              
              <span className="flex-1 text-left">{section.title}</span>
              
              {expandedSections.has(section.id) ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            
            {expandedSections.has(section.id) && (
              <div className="mt-1 ml-4 space-y-0.5 animate-accordion-down">
                {section.id === 'discover' ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground rounded-xl bg-muted/30">
                    点击发现更多精彩技能...
                  </div>
                ) : section.skills.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground rounded-xl bg-muted/30">
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
      <div className="p-3 border-t border-border/50">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-2",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-accent/50 rounded-xl",
            "transition-all duration-200 active:scale-98"
          )}
        >
          <Plus className="w-4 h-4" />
          <span className="font-semibold">新增技能</span>
        </Button>
      </div>
    </div>
  );
}
