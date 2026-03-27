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

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAppStore } from '@/stores/appStore';
import { useConfig } from '@/hooks/useConfig';
import type { Theme } from '@/types';
import { useI18n } from '@/i18n';

export function ThemeSection() {
  const { theme, setTheme } = useAppStore();
  const { updateTheme } = useConfig();
  const { t } = useI18n();

  const handleThemeChange = async (newTheme: string) => {
    const themeValue = newTheme as Theme;
    setTheme(themeValue);
    
    // Apply theme class to document
    if (themeValue === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Persist to backend
    try {
      await updateTheme(themeValue);
    } catch (error) {
      console.error('Failed to persist theme:', error);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">{t('settings.theme.title')}</Label>
      <RadioGroup value={theme} onValueChange={handleThemeChange}>
        <RadioGroupItem value="light">
          <Label className="cursor-pointer">{t('settings.theme.light')}</Label>
        </RadioGroupItem>
        <RadioGroupItem value="dark">
          <Label className="cursor-pointer">{t('settings.theme.dark')}</Label>
        </RadioGroupItem>
      </RadioGroup>
    </div>
  );
}
