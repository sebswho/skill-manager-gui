import { useAppStore } from '@/stores/appStore';

export function Footer() {
  const { skills, agents, pendingChanges, conflicts } = useAppStore();

  return (
    <footer className="border-t px-4 py-2 text-sm text-muted-foreground bg-card">
      <div className="flex items-center gap-4">
        <span>{skills.length} Skills</span>
        <span>{agents.length} Agents</span>
        {pendingChanges.length > 0 && (
          <span className="text-yellow-600">{pendingChanges.length} Pending</span>
        )}
        {conflicts.length > 0 && (
          <span className="text-red-600">{conflicts.length} Conflicts</span>
        )}
      </div>
    </footer>
  );
}
