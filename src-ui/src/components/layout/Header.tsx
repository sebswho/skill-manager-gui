import { Button } from '@/components/ui/button';
import { RefreshCw, Settings, AlertTriangle } from 'lucide-react';
import { useSkills } from '@/hooks/useSkills';
import { useAppStore } from '@/stores/appStore';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useI18n } from '@/i18n';

export function Header() {
  const { scanAll } = useSkills();
  const { isLoading, pendingChanges, conflicts, resolvedConflicts, setIsSettingsOpen, setSelectedConflict } = useAppStore();
  const { t } = useI18n();
  
  // Filter out resolved conflicts
  const unresolvedConflicts = conflicts.filter(c => !resolvedConflicts.has(c.skill_name));
  const hasConflicts = unresolvedConflicts.length > 0;

  const handleResolveConflicts = () => {
    if (hasConflicts) {
      setSelectedConflict(unresolvedConflicts[0]);
    }
  };

  return (
    <header className="border-b px-4 py-3 flex items-center justify-between bg-card">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">{t('app.title')}</h1>
        {pendingChanges.length > 0 && (
          <span className="text-sm text-muted-foreground">
            ({pendingChanges.length} pending)
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {hasConflicts && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleResolveConflicts}
            className="animate-pulse"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {unresolvedConflicts.length} 个冲突
          </Button>
        )}
        <ThemeToggle variant="outline" size="icon" />
        <Button
          data-testid="refresh-button"
          variant="outline"
          size="sm"
          onClick={scanAll}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
        <Button 
          data-testid="open-settings-button"
          variant="outline" 
          size="sm"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="w-4 h-4 mr-2" />
          {t('common.settings')}
        </Button>
      </div>
    </header>
  );
}
