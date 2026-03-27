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
import { useSkills } from "@/hooks/useSkills";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Star, AlertTriangle } from "lucide-react";
import type { Agent } from "@/types";

interface AgentVersion {
  agent: Agent;
  size: number;
  modifiedAt: Date | null;
  modifiedAtRaw: string;
  path: string;
  hash: string;
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
  
  const { syncToHub, syncToAgent } = useSync();
  const { getSkillVersions, scanAll } = useSkills();
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadVersions = async () => {
      if (!selectedConflict) {
        setVersions([]);
        return;
      }

      setIsLoadingVersions(true);
      try {
        const allVersions = await getSkillVersions(selectedConflict.skill_name);
        const conflictAgentIds = new Set(selectedConflict.agent_ids);

        const normalized = allVersions
          .filter((version) => conflictAgentIds.has(version.agent_id))
          .map((version) => {
            const agent = agents.find((item) => item.id === version.agent_id);
            if (!agent) return null;

            const modified = new Date(version.modified_at);
            const modifiedAt = Number.isNaN(modified.getTime()) ? null : modified;

            return {
              agent,
              size: version.size,
              modifiedAt,
              modifiedAtRaw: version.modified_at,
              path: version.path,
              hash: version.hash,
            };
          })
          .filter(Boolean) as AgentVersion[];

        if (!cancelled) {
          setVersions(normalized);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load conflict versions:", error);
          setVersions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingVersions(false);
        }
      }
    };

    loadVersions();

    return () => {
      cancelled = true;
    };
  }, [selectedConflict, agents]);

  // Find recommended version (most recent)
  const recommendedVersion = useMemo(() => {
    if (versions.length === 0) return null;
    return versions.reduce((latest, current) => {
      if (!current.modifiedAt) return latest;
      if (!latest.modifiedAt) return current;
      return current.modifiedAt > latest.modifiedAt ? current : latest;
    });
  }, [versions]);

  const handleResolve = async () => {
    if (!selectedConflict || !selectedAgentId || !config) return;
    
    setIsResolving(true);
    try {
      const sourceAgent = agents.find((a) => a.id === selectedAgentId);
      if (!sourceAgent) {
        throw new Error("Selected agent not found");
      }

      const hubResult = await syncToHub(selectedConflict.skill_name, sourceAgent);
      if (!hubResult.success) {
        throw new Error(hubResult.message);
      }

      for (const agentId of selectedConflict.agent_ids) {
        if (agentId === sourceAgent.id) continue;
        const targetAgent = agents.find((item) => item.id === agentId);
        if (!targetAgent) continue;
        const result = await syncToAgent(selectedConflict.skill_name, targetAgent);
        if (!result.success) {
          throw new Error(result.message);
        }
      }

      markConflictResolved(selectedConflict.skill_name);
      setSelectedAgentId(null);

      const refreshed = await scanAll();
      const remainingConflicts = refreshed?.conflicts ?? [];
      setSelectedConflict(remainingConflicts.length > 0 ? remainingConflicts[0] : null);
    } catch (error) {
      console.error("Failed to resolve conflict:", error);
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

  const formatModified = (modifiedAt: Date | null, raw: string) => {
    if (!modifiedAt) return raw || "unknown";
    return `${formatDistanceToNow(modifiedAt)} ago`;
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
          
          {isLoadingVersions ? (
            <div className="text-sm text-muted-foreground">Loading versions...</div>
          ) : (
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
                    <div>Modified: {formatModified(version.modifiedAt, version.modifiedAtRaw)}</div>
                    <div>Hash: <span className="font-mono text-xs">{version.hash.slice(0, 12)}</span></div>
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
          )}
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
