import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Bot, Trash2 } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useConfig } from "@/hooks/useConfig";
import { useSkills } from "@/hooks/useSkills";
import { useI18n } from "@/i18n";
import { AddAgentDialog } from "./AddAgentDialog";

export function AgentsSection() {
  const { agents } = useAppStore();
  const { removeAgent } = useConfig();
  const { scanAll } = useSkills();
  const { t } = useI18n();

  const handleRemove = async (agentId: string) => {
    if (confirm("Are you sure you want to remove this agent?")) {
      await removeAgent(agentId);
      await scanAll();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold">{t('settings.agents.title')}</h3>
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
            {t('settings.agents.description')}
          </div>
        )}
      </div>
    </div>
  );
}
