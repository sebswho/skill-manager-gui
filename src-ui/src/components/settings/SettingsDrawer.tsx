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

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppStore } from "@/stores/appStore";
import { HubPathSection } from "./HubPathSection";
import { AgentsSection } from "./AgentsSection";
import { ThemeSection } from "./ThemeSection";
import { LanguageSelector } from "./LanguageSelector";
import { useI18n } from "@/i18n";

export function SettingsDrawer() {
  const { isSettingsOpen, setIsSettingsOpen } = useAppStore();
  const { t } = useI18n();

  return (
    <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <SheetContent data-testid="settings-drawer" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('settings.title')}</SheetTitle>
        </SheetHeader>
        <div className="py-6 space-y-6">
          <ThemeSection />
          <LanguageSelector />
          <HubPathSection />
          <AgentsSection />
        </div>
      </SheetContent>
    </Sheet>
  );
}
