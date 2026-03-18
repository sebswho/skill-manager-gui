import { Button } from '@/components/ui/button';
import { RefreshCw, Settings } from 'lucide-react';
import { useSkills } from '@/hooks/useSkills';
import { useAppStore } from '@/stores/appStore';

export function Header() {
  const { scanAll } = useSkills();
  const { isLoading, pendingChanges, setIsSettingsOpen } = useAppStore();

  return (
    <header className="border-b px-4 py-3 flex items-center justify-between bg-card">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Agent Skills Manager</h1>
        {pendingChanges.length > 0 && (
          <span className="text-sm text-muted-foreground">
            ({pendingChanges.length} pending)
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={scanAll}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>
    </header>
  );
}
