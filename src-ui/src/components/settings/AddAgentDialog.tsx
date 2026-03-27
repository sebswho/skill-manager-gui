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

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FolderOpen } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import { useAgents } from "@/hooks/useAgents";
import { useDialog } from "@/hooks/useDialog";
import { useSkills } from "@/hooks/useSkills";
import { useAppStore } from "@/stores/appStore";
import { useI18n } from "@/i18n";
import type { Agent } from "@/types";

export function AddAgentDialog() {
  const [open, setOpen] = useState(false);
  const { agents } = useAppStore();
  const { t } = useI18n();
  const { addAgent } = useConfig();
  const { validateAgentPath } = useAgents();
  const { scanAll } = useSkills();
  const { pickDirectory, pickDirectoryWithDefault } = useDialog();
  
  // Quick add state
  const [quickPath, setQuickPath] = useState("");
  
  // Full form state
  const [agentId, setAgentId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [fullPath, setFullPath] = useState("");
  
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  const inferNameFromPath = (path: string): string => {
    const parts = path.split('/');
    const dirName = parts[parts.length - 2] || parts[parts.length - 1] || "";
    return dirName
      .replace(/^\./, "")
      .replace(/-/g, " ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleQuickAdd = async () => {
    if (!quickPath.trim()) return;
    const normalizedPath = quickPath.trim();
    
    const isValid = await validateAgentPath(normalizedPath);
    if (!isValid) {
      setError("Invalid directory path");
      return;
    }

    setIsAdding(true);
    try {
      const name = inferNameFromPath(normalizedPath);
      const id = name.toLowerCase().replace(/\s+/g, "-");

      if (agents.some((agent) => agent.id === id)) {
        setError("Agent ID already exists");
        return;
      }
      if (agents.some((agent) => agent.skills_path === normalizedPath)) {
        setError("This skills path is already configured");
        return;
      }
      
      const agent: Agent = {
        id,
        name,
        skills_path: normalizedPath,
        is_discovered: false,
      };
      
      await addAgent(agent);
      await scanAll();
      setOpen(false);
      setQuickPath("");
      setError("");
    } finally {
      setIsAdding(false);
    }
  };

  const handleFullAdd = async () => {
    if (!agentId.trim() || !agentName.trim() || !fullPath.trim()) {
      setError("All fields are required");
      return;
    }
    const normalizedId = agentId.trim();
    const normalizedName = agentName.trim();
    const normalizedPath = fullPath.trim();

    if (agents.some((agent) => agent.id === normalizedId)) {
      setError("Agent ID already exists");
      return;
    }
    if (agents.some((agent) => agent.skills_path === normalizedPath)) {
      setError("This skills path is already configured");
      return;
    }

    const isValid = await validateAgentPath(normalizedPath);
    if (!isValid) {
      setError("Invalid directory path");
      return;
    }

    setIsAdding(true);
    try {
      const agent: Agent = {
        id: normalizedId,
        name: normalizedName,
        skills_path: normalizedPath,
        is_discovered: false,
      };
      
      await addAgent(agent);
      await scanAll();
      setOpen(false);
      setAgentId("");
      setAgentName("");
      setFullPath("");
      setError("");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBrowseQuick = async () => {
    const selected = await pickDirectory();
    if (selected) {
      setQuickPath(selected);
    }
  };

  const handleBrowseFull = async () => {
    const defaultPath = fullPath || "~";
    const selected = await pickDirectoryWithDefault(defaultPath);
    if (selected) {
      setFullPath(selected);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          {t('settings.agents.addButton')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('dialog.addAgent.title')}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="quick" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">{t('settings.agents.quickAdd')}</TabsTrigger>
            <TabsTrigger value="full">{t('settings.agents.fullForm')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quick" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quick-path">{t('settings.agents.skillsPath')}</Label>
              <div className="flex gap-2">
                <Input
                  id="quick-path"
                  value={quickPath}
                  onChange={(e) => setQuickPath(e.target.value)}
                  placeholder="/path/to/.agent/skills"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleBrowseQuick}
                  title="Browse directory"
                >
                  <FolderOpen className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Agent name will be inferred from the path automatically.
              </p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button 
              onClick={handleQuickAdd} 
              disabled={isAdding || !quickPath.trim()}
              className="w-full"
            >
              {t('settings.agents.addButton')}
            </Button>
          </TabsContent>
          
          <TabsContent value="full" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent-id">{t('settings.agents.agentId')}</Label>
              <Input
                id="agent-id"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="my-agent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-name">{t('settings.agents.agentName')}</Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="My Agent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full-path">{t('settings.agents.skillsPath')}</Label>
              <div className="flex gap-2">
                <Input
                  id="full-path"
                  value={fullPath}
                  onChange={(e) => setFullPath(e.target.value)}
                  placeholder="/path/to/.agent/skills"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleBrowseFull}
                  title="Browse directory"
                >
                  <FolderOpen className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button 
              onClick={handleFullAdd} 
              disabled={isAdding || !agentId.trim() || !agentName.trim() || !fullPath.trim()}
              className="w-full"
            >
              {t('settings.agents.addButton')}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
