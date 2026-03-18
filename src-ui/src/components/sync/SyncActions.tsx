import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { useSync } from '@/hooks/useSync';
import { RefreshCw } from 'lucide-react';

export function SyncActions() {
  const { 
    selectedSkills, 
    selectedAgents, 
    agents, 
    pendingChanges,
    resetSelection 
  } = useAppStore();
  
  const { batchSync, executeChanges } = useSync();

  const handleSyncSelected = async () => {
    if (selectedSkills.size === 0 || selectedAgents.size === 0) return;
    
    const skillNames = Array.from(selectedSkills);
    const targetAgents = agents.filter(a => selectedAgents.has(a.id));
    
    await batchSync(skillNames, targetAgents);
    resetSelection();
  };

  const handleSyncAllPending = async () => {
    if (pendingChanges.length === 0) return;
    await executeChanges(pendingChanges);
  };

  const selectedCount = selectedSkills.size;
  const agentCount = selectedAgents.size;

  return (
    <div className="border-t p-4 flex items-center justify-between bg-card">
      <div className="text-sm text-muted-foreground">
        {selectedCount > 0 ? (
          <span>{selectedCount} skills selected, {agentCount} agents selected</span>
        ) : (
          <span>Select skills and agents to sync</span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {pendingChanges.length > 0 && (
          <Button
            variant="secondary"
            onClick={handleSyncAllPending}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync All Pending ({pendingChanges.length})
          </Button>
        )}
        
        <Button
          disabled={selectedCount === 0 || agentCount === 0}
          onClick={handleSyncSelected}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync Selected
        </Button>
      </div>
    </div>
  );
}
