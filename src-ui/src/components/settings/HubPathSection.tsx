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
