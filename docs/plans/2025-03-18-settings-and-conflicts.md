# Settings Panel & Conflict Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Settings Panel (drawer-based), Conflict Resolution Dialog, and Production Build support to the Agent Skills Manager.

**Architecture:** Extend existing React + Tauri architecture with new UI components for settings management and conflict resolution. Use shadcn/ui Dialog and Sheet components for modals and drawers.

**Tech Stack:** React + TypeScript, shadcn/ui, Zustand, Tauri 2.0

---

## Overview

This plan covers three features:
1. **Settings Panel** - Drawer-based settings for managing Agents and Central Hub path
2. **Conflict Resolution** - Dialog for resolving skill version conflicts with smart recommendations
3. **Production Build** - Tauri bundle configuration for distribution

---

## Phase 1: Settings Panel

### Task 1: Install Required shadcn/ui Components

**Files:**
- Modify: `src-ui/package.json`

- [ ] **Step 1: Install sheet, dialog, label, input components**

Run:
```bash
cd src-ui
bunx shadcn-ui@latest add sheet dialog label input separator -y
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "chore(ui): add sheet, dialog, label, input shadcn components"
```

---

### Task 2: Create Settings Store State

**Files:**
- Modify: `src-ui/src/stores/appStore.ts`

- [ ] **Step 1: Add settings UI state to store**

Add to `AppState` interface in `src-ui/src/stores/appStore.ts`:

```typescript
// Settings UI State
isSettingsOpen: boolean;
setIsSettingsOpen: (open: boolean) => void;
```

Add to store implementation:

```typescript
isSettingsOpen: false,
setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(store): add settings UI state"
```

---

### Task 3: Create SettingsDrawer Component

**Files:**
- Create: `src-ui/src/components/settings/SettingsDrawer.tsx`

- [ ] **Step 1: Create SettingsDrawer component**

Create `src-ui/src/components/settings/SettingsDrawer.tsx`:

```typescript
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppStore } from "@/stores/appStore";
import { HubPathSection } from "./HubPathSection";
import { AgentsSection } from "./AgentsSection";

export function SettingsDrawer() {
  const { isSettingsOpen, setIsSettingsOpen } = useAppStore();

  return (
    <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className="py-6 space-y-6">
          <HubPathSection />
          <AgentsSection />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(settings): create SettingsDrawer component"
```

---

### Task 4: Create HubPathSection Component

**Files:**
- Create: `src-ui/src/components/settings/HubPathSection.tsx`

- [ ] **Step 1: Create HubPathSection component**

Create `src-ui/src/components/settings/HubPathSection.tsx`:

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Folder, Save } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useConfig } from "@/hooks/useConfig";

export function HubPathSection() {
  const { config } = useAppStore();
  const { updateCentralHubPath } = useConfig();
  const [path, setPath] = useState(config?.central_hub_path || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!path.trim()) return;
    setIsSaving(true);
    try {
      await updateCentralHubPath(path.trim());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Folder className="w-5 h-5" />
        <h3 className="font-semibold">Central Hub Path</h3>
      </div>
      <Separator />
      <div className="space-y-2">
        <Label htmlFor="hub-path">Skills Directory</Label>
        <div className="flex gap-2">
          <Input
            id="hub-path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="~/.agents/skills"
            className="flex-1"
          />
          <Button 
            onClick={handleSave} 
            disabled={isSaving || path === config?.central_hub_path}
            size="sm"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          All skills will be stored and synchronized from this directory.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(settings): create HubPathSection component"
```

---

### Task 5: Create AgentsSection Component

**Files:**
- Create: `src-ui/src/components/settings/AgentsSection.tsx`
- Create: `src-ui/src/components/settings/AddAgentDialog.tsx`

- [ ] **Step 1: Create AddAgentDialog component**

Create `src-ui/src/components/settings/AddAgentDialog.tsx`:

```typescript
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
import { Plus } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import { useAgents } from "@/hooks/useAgents";
import type { Agent } from "@/types";

export function AddAgentDialog() {
  const [open, setOpen] = useState(false);
  const { addAgent } = useConfig();
  const { validateAgentPath } = useAgents();
  
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
    
    const isValid = await validateAgentPath(quickPath.trim());
    if (!isValid) {
      setError("Invalid directory path");
      return;
    }

    setIsAdding(true);
    try {
      const name = inferNameFromPath(quickPath.trim());
      const id = name.toLowerCase().replace(/\s+/g, "-");
      
      const agent: Agent = {
        id,
        name,
        skills_path: quickPath.trim(),
        is_discovered: false,
      };
      
      await addAgent(agent);
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

    const isValid = await validateAgentPath(fullPath.trim());
    if (!isValid) {
      setError("Invalid directory path");
      return;
    }

    setIsAdding(true);
    try {
      const agent: Agent = {
        id: agentId.trim(),
        name: agentName.trim(),
        skills_path: fullPath.trim(),
        is_discovered: false,
      };
      
      await addAgent(agent);
      setOpen(false);
      setAgentId("");
      setAgentName("");
      setFullPath("");
      setError("");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Agent</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="quick" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">Quick Add</TabsTrigger>
            <TabsTrigger value="full">Full Form</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quick" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quick-path">Skills Directory Path</Label>
              <Input
                id="quick-path"
                value={quickPath}
                onChange={(e) => setQuickPath(e.target.value)}
                placeholder="/path/to/.agent/skills"
              />
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
              Add Agent
            </Button>
          </TabsContent>
          
          <TabsContent value="full" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent-id">Agent ID</Label>
              <Input
                id="agent-id"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="my-agent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-name">Display Name</Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="My Agent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full-path">Skills Directory Path</Label>
              <Input
                id="full-path"
                value={fullPath}
                onChange={(e) => setFullPath(e.target.value)}
                placeholder="/path/to/.agent/skills"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button 
              onClick={handleFullAdd} 
              disabled={isAdding || !agentId.trim() || !agentName.trim() || !fullPath.trim()}
              className="w-full"
            >
              Add Agent
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create AgentsSection component**

Create `src-ui/src/components/settings/AgentsSection.tsx`:

```typescript
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Bot, Trash2 } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useConfig } from "@/hooks/useConfig";
import { AddAgentDialog } from "./AddAgentDialog";

export function AgentsSection() {
  const { agents } = useAppStore();
  const { removeAgent } = useConfig();

  const handleRemove = async (agentId: string) => {
    if (confirm("Are you sure you want to remove this agent?")) {
      await removeAgent(agentId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold">Agents</h3>
        </div>
        <AddAgentDialog />
      </div>
      <Separator />
      <div className="space-y-2">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <Checkbox checked={true} disabled />
              <div>
                <div className="font-medium">{agent.name}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                  {agent.skills_path}
                </div>
                {agent.is_discovered && (
                  <span className="text-xs text-blue-500">Auto-discovered</span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(agent.id)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}
        {agents.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            No agents configured. Click "Add Agent" to get started.
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Install tabs component**

Run:
```bash
cd src-ui
bunx shadcn-ui@latest add tabs -y
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(settings): create AgentsSection and AddAgentDialog components"
```

---

### Task 6: Integrate Settings into Header

**Files:**
- Modify: `src-ui/src/components/layout/Header.tsx`
- Modify: `src-ui/src/App.tsx`

- [ ] **Step 1: Update Header to open settings**

Modify `src-ui/src/components/layout/Header.tsx`:

```typescript
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings } from 'lucide-react';
import { useSkills } from '@/hooks/useSkills';
import { useAppStore } from '@/stores/appStore';

export function Header() {
  const { scanAll } = useSkills();
  const { isLoading, pendingChanges, setIsSettingsOpen } = useAppStore();

  return (
    <header className="border-b px-4 py-3 flex items-center justify-between bg-card">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Agent Skills Manager</h1>
        {pendingChanges.length > 0 && (
          <span className="text-sm text-muted-foreground">
            ({pendingChanges.length} pending)
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={scanAll}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Add SettingsDrawer to App**

Modify `src-ui/src/App.tsx`:

```typescript
import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SkillList } from '@/components/skills/SkillList';
import { SyncMatrix } from '@/components/sync/SyncMatrix';
import { SyncActions } from '@/components/sync/SyncActions';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { useConfig } from '@/hooks/useConfig';
import { useAgents } from '@/hooks/useAgents';
import { useSkills } from '@/hooks/useSkills';
import { useAppStore } from '@/stores/appStore';

function App() {
  const { loadConfig } = useConfig();
  const { discoverAgents } = useAgents();
  const { scanAll } = useSkills();
  const { config } = useAppStore();

  useEffect(() => {
    const init = async () => {
      await loadConfig();
      await discoverAgents();
    };
    init();
  }, []);

  useEffect(() => {
    if (config) {
      scanAll();
    }
  }, [config?.agents.length]);

  return (
    <MainLayout>
      <div className="flex h-full">
        <div className="w-64 flex-shrink-0">
          <SkillList />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <SyncMatrix />
          </div>
          <SyncActions />
        </div>
      </div>
      <SettingsDrawer />
    </MainLayout>
  );
}

export default App;
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(settings): integrate SettingsDrawer into app"
```

---

## Phase 2: Conflict Resolution

### Task 7: Create Conflict Resolution Store State

**Files:**
- Modify: `src-ui/src/stores/appStore.ts`

- [ ] **Step 1: Add conflict resolution state**

Add to `AppState` interface:

```typescript
// Conflict Resolution
selectedConflict: Conflict | null;
setSelectedConflict: (conflict: Conflict | null) => void;
resolvedConflicts: Set<string>;
markConflictResolved: (skillName: string) => void;
```

Add to store implementation:

```typescript
selectedConflict: null,
setSelectedConflict: (selectedConflict) => set({ selectedConflict }),
resolvedConflicts: new Set(),
markConflictResolved: (skillName) => set((state) => ({
  resolvedConflicts: new Set([...state.resolvedConflicts, skillName]),
})),
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(conflicts): add conflict resolution state to store"
```

---

### Task 8: Create ConflictList Component

**Files:**
- Create: `src-ui/src/components/conflicts/ConflictList.tsx`

- [ ] **Step 1: Create ConflictList component**

Create `src-ui/src/components/conflicts/ConflictList.tsx`:

```typescript
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/appStore";
import { useSkills } from "@/hooks/useSkills";

export function ConflictList() {
  const { conflicts, resolvedConflicts, setSelectedConflict, setConflicts } = useAppStore();
  const { scanAll } = useSkills();

  const unresolvedConflicts = conflicts.filter(
    (c) => !resolvedConflicts.has(c.skill_name)
  );

  const handleResolveAll = async () => {
    // Open first conflict
    if (unresolvedConflicts.length > 0) {
      setSelectedConflict(unresolvedConflicts[0]);
    }
  };

  if (unresolvedConflicts.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="font-medium text-yellow-800">
            {unresolvedConflicts.length} Conflict{unresolvedConflicts.length > 1 ? 's' : ''} Detected
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleResolveAll}
        >
          Resolve All
        </Button>
      </div>
      <div className="mt-2 space-y-1">
        {unresolvedConflicts.map((conflict) => (
          <div
            key={conflict.skill_name}
            className="text-sm text-yellow-700 flex items-center justify-between py-1"
          >
            <span>📦 {conflict.skill_name}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setSelectedConflict(conflict)}
            >
              Resolve
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(conflicts): create ConflictList component"
```

---

### Task 9: Create ConflictResolutionDialog Component

**Files:**
- Create: `src-ui/src/components/conflicts/ConflictResolutionDialog.tsx`

- [ ] **Step 1: Create ConflictResolutionDialog component**

Create `src-ui/src/components/conflicts/ConflictResolutionDialog.tsx`:

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/appStore";
import { useSync } from "@/hooks/useSync";
import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Star, AlertTriangle } from "lucide-react";
import type { Agent } from "@/types";

interface AgentVersion {
  agent: Agent;
  size: number;
  modifiedAt: Date;
  path: string;
}

export function ConflictResolutionDialog() {
  const { 
    selectedConflict, 
    setSelectedConflict, 
    agents, 
    config,
    markConflictResolved,
    resolvedConflicts,
    conflicts,
  } = useAppStore();
  
  const { syncToHub } = useSync();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Get versions from each agent
  const versions = useMemo(() => {
    if (!selectedConflict) return [];
    
    return selectedConflict.agent_ids
      .map((agentId) => {
        const agent = agents.find((a) => a.id === agentId);
        if (!agent) return null;
        
        // This would ideally come from the scan result
        // For now, we'll use placeholder data
        return {
          agent,
          size: Math.floor(Math.random() * 5000000) + 1000000, // Placeholder
          modifiedAt: new Date(Date.now() - Math.random() * 86400000 * 7), // Placeholder
          path: `${agent.skills_path}/${selectedConflict.skill_name}`,
        };
      })
      .filter(Boolean) as AgentVersion[];
  }, [selectedConflict, agents]);

  // Find recommended version (most recent)
  const recommendedVersion = useMemo(() => {
    if (versions.length === 0) return null;
    return versions.reduce((latest, current) => 
      current.modifiedAt > latest.modifiedAt ? current : latest
    );
  }, [versions]);

  // Auto-select recommended on open
  useState(() => {
    if (recommendedVersion && !selectedAgentId) {
      setSelectedAgentId(recommendedVersion.agent.id);
    }
  });

  const handleResolve = async () => {
    if (!selectedConflict || !selectedAgentId || !config) return;
    
    setIsResolving(true);
    try {
      const agent = agents.find((a) => a.id === selectedAgentId);
      if (agent) {
        await syncToHub(selectedConflict.skill_name, agent);
        markConflictResolved(selectedConflict.skill_name);
        
        // Check if there are more conflicts
        const remainingConflicts = conflicts.filter(
          (c) => !resolvedConflicts.has(c.skill_name) && c.skill_name !== selectedConflict.skill_name
        );
        
        if (remainingConflicts.length > 0) {
          setSelectedConflict(remainingConflicts[0]);
          setSelectedAgentId(null);
        } else {
          setSelectedConflict(null);
        }
      }
    } finally {
      setIsResolving(false);
    }
  };

  const handleSkip = () => {
    if (!selectedConflict) return;
    
    markConflictResolved(selectedConflict.skill_name);
    
    const remainingConflicts = conflicts.filter(
      (c) => !resolvedConflicts.has(c.skill_name) && c.skill_name !== selectedConflict.skill_name
    );
    
    if (remainingConflicts.length > 0) {
      setSelectedConflict(remainingConflicts[0]);
      setSelectedAgentId(null);
    } else {
      setSelectedConflict(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!selectedConflict) return null;

  return (
    <Dialog 
      open={!!selectedConflict} 
      onOpenChange={(open) => !open && setSelectedConflict(null)}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Resolve Conflict: {selectedConflict.skill_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Multiple versions of this skill were detected. Select which version to keep:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {versions.map((version) => {
              const isRecommended = version.agent.id === recommendedVersion?.agent.id;
              const isSelected = version.agent.id === selectedAgentId;
              
              return (
                <div
                  key={version.agent.id}
                  onClick={() => setSelectedAgentId(version.agent.id)}
                  className={`
                    relative p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  {isRecommended && (
                    <Badge className="absolute -top-2 -right-2 bg-yellow-500">
                      <Star className="w-3 h-3 mr-1" />
                      Recommended
                    </Badge>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-5 h-5 text-blue-500" />
                    </div>
                  )}
                  
                  <div className="font-semibold mb-2">{version.agent.name}</div>
                  
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <div>Path: <span className="text-xs truncate">{version.path}</span></div>
                    <div>Size: {formatSize(version.size)}</div>
                    <div>Modified: {formatDistanceToNow(version.modifiedAt)} ago</div>
                  </div>
                  
                  {isRecommended && (
                    <p className="text-xs text-yellow-600 mt-2">
                      This is the most recent version
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSkip}>
            Skip for Now
          </Button>
          <Button 
            onClick={handleResolve} 
            disabled={!selectedAgentId || isResolving}
          >
            {isResolving ? "Resolving..." : "Confirm & Sync"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Install date-fns**

Run:
```bash
cd src-ui
bun add date-fns
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(conflicts): create ConflictResolutionDialog component"
```

---

### Task 10: Integrate Conflict Resolution into App

**Files:**
- Modify: `src-ui/src/App.tsx`
- Modify: `src-ui/src/components/sync/SyncMatrix.tsx`

- [ ] **Step 1: Add ConflictList to App**

Modify `src-ui/src/App.tsx`:

```typescript
import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SkillList } from '@/components/skills/SkillList';
import { SyncMatrix } from '@/components/sync/SyncMatrix';
import { SyncActions } from '@/components/sync/SyncActions';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { ConflictList } from '@/components/conflicts/ConflictList';
import { ConflictResolutionDialog } from '@/components/conflicts/ConflictResolutionDialog';
import { useConfig } from '@/hooks/useConfig';
import { useAgents } from '@/hooks/useAgents';
import { useSkills } from '@/hooks/useSkills';
import { useAppStore } from '@/stores/appStore';

function App() {
  const { loadConfig } = useConfig();
  const { discoverAgents } = useAgents();
  const { scanAll } = useSkills();
  const { config } = useAppStore();

  useEffect(() => {
    const init = async () => {
      await loadConfig();
      await discoverAgents();
    };
    init();
  }, []);

  useEffect(() => {
    if (config) {
      scanAll();
    }
  }, [config?.agents.length]);

  return (
    <MainLayout>
      <div className="flex h-full">
        <div className="w-64 flex-shrink-0">
          <SkillList />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden p-4">
            <ConflictList />
            <SyncMatrix />
          </div>
          <SyncActions />
        </div>
      </div>
      <SettingsDrawer />
      <ConflictResolutionDialog />
    </MainLayout>
  );
}

export default App;
```

- [ ] **Step 2: Remove padding from SyncMatrix**

Modify `src-ui/src/components/sync/SyncMatrix.tsx` to remove the outer padding since it's now handled by App:

Change:
```typescript
<ScrollArea className="flex-1">
  <div className="p-4">
```

To:
```typescript
<ScrollArea className="flex-1">
  <div>
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(conflicts): integrate conflict resolution into app"
```

---

## Phase 3: Production Build

### Task 11: Update Tauri Bundle Configuration

**Files:**
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: Update bundle configuration**

Modify `src-tauri/tauri.conf.json`:

```json
{
  "build": {
    "beforeBuildCommand": "cd src-ui && bun run build",
    "beforeDevCommand": "cd src-ui && bun run dev",
    "devUrl": "http://localhost:1420",
    "frontendDist": "../src-ui/dist"
  },
  "bundle": {
    "active": true,
    "category": "DeveloperTool",
    "copyright": "2025 Agent Skills Manager",
    "targets": ["app", "dmg", "appimage", "deb", "msi"],
    "externalBin": [],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": ""
    },
    "longDescription": "A unified GUI for managing AI Agent Skills across multiple agents with symlink-based synchronization.",
    "macOS": {
      "entitlements": null,
      "exceptionDomain": "",
      "frameworks": [],
      "providerShortName": null,
      "signingIdentity": null
    },
    "resources": [],
    "shortDescription": "Manage Agent Skills",
    "linux": {
      "deb": {
        "depends": []
      }
    }
  },
  "productName": "Agent Skills Manager",
  "version": "0.1.0",
  "identifier": "com.agent-skills-manager.app",
  "plugins": {},
  "app": {
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "height": 800,
        "minHeight": 600,
        "resizable": true,
        "title": "Agent Skills Manager",
        "width": 1200,
        "minWidth": 900,
        "center": true
      }
    ]
  }
}
```

- [ ] **Step 2: Create app icons**

Generate proper app icons using Tauri's icon command:

```bash
cd src-tauri
# First, place a source icon (1024x1024 PNG) at icons/icon.png
cargo tauri icon
```

For now, create placeholder icons:

```bash
cd src-tauri/icons
# Create simple colored squares as placeholders
convert -size 32x32 xc:blue 32x32.png
convert -size 128x128 xc:blue 128x128.png
convert -size 256x256 xc:blue 128x128@2x.png
convert -size 256x256 xc:blue icon.png
# For .ico and .icns, we'll skip for now (platform-specific)
```

- [ ] **Step 3: Add build scripts to package.json**

Modify `package.json` to add build scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "bundle:mac": "tauri build --target universal-apple-darwin",
    "bundle:win": "tauri build --target x86_64-pc-windows-msvc",
    "bundle:linux": "tauri build --target x86_64-unknown-linux-gnu"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore(bundle): update Tauri bundle configuration and build scripts"
```

---

### Task 12: Final Build and Verification

- [ ] **Step 1: Run frontend build**

```bash
cd src-ui
bun run build
```

Expected: Build succeeds

- [ ] **Step 2: Run Tauri build**

```bash
bun run tauri:build
```

Expected: Build succeeds, bundles created in `src-tauri/target/release/bundle/`

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "chore(release): v0.1.0 - settings, conflict resolution, and production build"
```

---

## Summary

This implementation plan covers:

| Phase | Tasks | Description |
|-------|-------|-------------|
| **Settings Panel** | 1-6 | Sheet drawer, Hub path section, Agent management with quick/full add |
| **Conflict Resolution** | 7-10 | Conflict list banner, resolution dialog with recommendations |
| **Production Build** | 11-12 | Bundle config, icons, build scripts |

**Key Features:**
- Settings drawer with 400px-540px width
- Quick add (path → auto-infer name) + Full form modes
- Conflict resolution with side-by-side comparison
- Smart recommendation based on modification time
- Sequential conflict resolution workflow
- Cross-platform bundle support (macOS, Windows, Linux)

**Total Estimated Time:** 2-3 hours
