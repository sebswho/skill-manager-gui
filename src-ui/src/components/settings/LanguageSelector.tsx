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
import { useI18n } from '@/i18n';

export function LanguageSelector() {
  const { locale, setLocale } = useAppStore();
  const { updateLocale } = useConfig();
  const { t } = useI18n();

  const languages: { value: Locale; label: string }[] = [
    { value: 'zh-CN', label: t('settings.language.zhCN') },
    { value: 'en', label: t('settings.language.en') },
  ];

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
      <Label className="text-base font-semibold">{t('settings.language.title')}</Label>
      <Select value={locale} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('settings.language.title')} />
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
