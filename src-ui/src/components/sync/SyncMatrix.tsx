import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppStore } from '@/stores/appStore';
import type { SyncStatus } from '@/types';
import { Check, AlertCircle, X, Package } from 'lucide-react';

const statusIcons: Record<SyncStatus, typeof Check> = {
  synced: Check,
  missing: X,
  conflict: AlertCircle,
  new: Package,
};

const statusColors: Record<SyncStatus, string> = {
  synced: 'text-green-600',
  missing: 'text-gray-400',
  conflict: 'text-yellow-600',
  new: 'text-blue-600',
};

export function SyncMatrix() {
  const { 
    skills, 
    agents, 
    syncMatrix, 
    selectedAgents, 
    toggleAgentSelection 
  } = useAppStore();

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        <div className="px-4 py-2 border-b font-medium">Sync Status</div>
        <ScrollArea className="flex-1">
          <div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2">Skill</th>
                  {agents.map((agent) => (
                    <th key={agent.id} className="text-center py-2 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <Checkbox
                          checked={selectedAgents.has(agent.id)}
                          onCheckedChange={() => toggleAgentSelection(agent.id)}
                        />
                        <span className="text-xs truncate max-w-[80px]">
                          {agent.name}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill.name} className="border-t">
                    <td className="py-2 px-2 text-sm">{skill.name}</td>
                    {agents.map((agent) => {
                      const status = syncMatrix[skill.name]?.[agent.id] || 'missing';
                      const Icon = statusIcons[status];
                      
                      return (
                        <td key={`${skill.name}-${agent.id}`} className="py-2 px-2 text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <Icon className={`w-4 h-4 mx-auto ${statusColors[status]}`} />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{skill.name} @ {agent.name}: {status}</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {skills.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">
                No data. Click Refresh to scan.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
