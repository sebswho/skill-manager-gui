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

import { Button } from '@/components/ui/button';
import { Target, BookOpen, Search } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export function SkillEmptyState() {
  const { toast } = useToast();

  const handleTutorial = () => {
    toast({
      title: "使用教程",
      description: "1. 从左侧选择 Skill\n2. 在右侧勾选要同步的 Agent\n3. 点击'一键同步'完成部署",
      duration: 10000,
    });
  };

  const handleDiscover = () => {
    // For now, show a toast. In the future, this could open Vercel Skills integration
    toast({
      title: "发现技能",
      description: "Vercel Skills 集成功能即将上线。请暂时手动添加技能到 ~/.agents/skills/",
      duration: 5000,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
        <Target className="w-10 h-10 text-green-400" />
      </div>
      
      <h2 className="text-xl font-semibold mb-2">欢迎使用 Agent Skills Manager</h2>
      <p className="text-slate-400 mb-8 max-w-md">
        点击左侧技能查看详情，并将技能分配到你的 AI 智能体
      </p>
      
      <div className="flex gap-4">
        <Button variant="outline" className="gap-2" onClick={handleTutorial}>
          <BookOpen className="w-4 h-4" />
          查看教程
        </Button>
        <Button className="gap-2 bg-green-500 hover:bg-green-600" onClick={handleDiscover}>
          <Search className="w-4 h-4" />
          发现技能
        </Button>
      </div>
      
      <div className="mt-12 text-sm text-slate-500">
        <p>提示：首次使用？从左侧"本地"分类添加你的第一个技能</p>
      </div>
    </div>
  );
}
