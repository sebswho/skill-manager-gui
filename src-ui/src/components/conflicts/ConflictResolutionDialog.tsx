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
        
        return {
          agent,
          size: Math.floor(Math.random() * 5000000) + 1000000,
          modifiedAt: new Date(Date.now() - Math.random() * 86400000 * 7),
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
