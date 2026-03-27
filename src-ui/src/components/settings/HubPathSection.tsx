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

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Folder, Save } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useConfig } from "@/hooks/useConfig";
import { useSkills } from "@/hooks/useSkills";
import { useI18n } from "@/i18n";

export function HubPathSection() {
  const { config } = useAppStore();
  const { updateCentralHubPath } = useConfig();
  const { scanAll } = useSkills();
  const { t } = useI18n();
  const [path, setPath] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Update path when config is loaded
  useEffect(() => {
    if (config?.central_hub_path) {
      setPath(config.central_hub_path);
    }
  }, [config?.central_hub_path]);

  const handleSave = async () => {
    if (!path.trim()) return;
    setIsSaving(true);
    try {
      await updateCentralHubPath(path.trim());
      await scanAll();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Folder className="w-5 h-5" />
        <h3 className="font-semibold">{t('settings.hubPath.title')}</h3>
      </div>
      <Separator />
      <div className="space-y-2">
        <Label htmlFor="hub-path">{t('settings.agents.skillsPath')}</Label>
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
            {t('common.save')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('settings.hubPath.description')}
        </p>
      </div>
    </div>
  );
}
