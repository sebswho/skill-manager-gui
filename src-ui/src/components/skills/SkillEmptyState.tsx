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

import { Button } from '@/components/ui/button';
import { BookOpen, Search, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { MiniMascot } from '@/components/ui/mascot';

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
    <div className="flex flex-col items-center justify-center h-full text-center p-8 relative overflow-hidden">
      {/* Decorative floating shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-16 h-16 rounded-full bg-vibrant-rose/10 animate-float" />
        <div className="absolute top-40 right-24 w-12 h-12 rounded-full bg-vibrant-blue/10 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-32 w-20 h-20 rounded-full bg-vibrant-green/10 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-16 w-14 h-14 rounded-full bg-vibrant-amber/10 animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Mascot */}
      <div className="relative mb-8 animate-bounce-in">
        <div className="absolute inset-0 bg-gradient-to-br from-vibrant-rose to-vibrant-pink rounded-full blur-2xl opacity-30 scale-150" />
        <MiniMascot size="lg" emotion="happy" className="relative shadow-clay-lg" />
      </div>
      
      {/* Title */}
      <h2 className="text-3xl font-heading font-bold mb-3 bg-gradient-to-r from-vibrant-rose via-vibrant-pink to-vibrant-blue bg-clip-text text-transparent">
        欢迎使用 Skilltoon
      </h2>
      
      {/* Description */}
      <p className="text-muted-foreground mb-8 max-w-md font-body text-base">
        点击左侧技能查看详情，并将技能分配到你的 AI 智能体
      </p>
      
      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          className="gap-2 px-6 rounded-2xl shadow-clay-sm hover:shadow-clay active:scale-95 transition-all" 
          onClick={handleTutorial}
        >
          <BookOpen className="w-4 h-4" />
          <span className="font-semibold">查看教程</span>
        </Button>
        <Button 
          className="gap-2 px-6 rounded-2xl shadow-glow hover:shadow-lg active:scale-95 transition-all"
          onClick={handleDiscover}
        >
          <Search className="w-4 h-4" />
          <span className="font-semibold">发现技能</span>
        </Button>
      </div>
      
      {/* Helper Tip */}
      <div className="mt-12 flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
        <Sparkles className="w-4 h-4 text-vibrant-amber" />
        <p className="text-sm text-muted-foreground">
          提示：首次使用？从左侧"本地"分类添加你的第一个技能
        </p>
      </div>
    </div>
  );
}
