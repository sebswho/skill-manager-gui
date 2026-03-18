import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/stores/appStore';
import { useConfig } from '@/hooks/useConfig';
import type { Locale } from '@/types';

const languages: { value: Locale; label: string }[] = [
  { value: 'zh-CN', label: '中文 (简体)' },
  { value: 'en', label: 'English' },
];

export function LanguageSelector() {
  const { locale, setLocale } = useAppStore();
  const { updateLocale } = useConfig();

  const handleLanguageChange = async (newLocale: string) => {
    const localeValue = newLocale as Locale;
    setLocale(localeValue);
    
    // Persist to backend
    try {
      await updateLocale(localeValue);
    } catch (error) {
      console.error('Failed to persist locale:', error);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">语言 / Language</Label>
      <Select value={locale} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="选择语言 / Select language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
