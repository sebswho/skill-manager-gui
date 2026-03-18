import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/appStore";

export function ConflictList() {
  const { conflicts, resolvedConflicts, setSelectedConflict } = useAppStore();

  const unresolvedConflicts = conflicts.filter(
    (c) => !resolvedConflicts.has(c.skill_name)
  );

  const handleResolveAll = async () => {
    // Open first conflict
    if (unresolvedConflicts.length > 0) {
      setSelectedConflict(unresolvedConflicts[0]);
    }
  };

  if (unresolvedConflicts.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="font-medium text-yellow-800">
            {unresolvedConflicts.length} Conflict{unresolvedConflicts.length > 1 ? 's' : ''} Detected
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleResolveAll}
        >
          Resolve All
        </Button>
      </div>
      <div className="mt-2 space-y-1">
        {unresolvedConflicts.map((conflict) => (
          <div
            key={conflict.skill_name}
            className="text-sm text-yellow-700 flex items-center justify-between py-1"
          >
            <span>📦 {conflict.skill_name}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setSelectedConflict(conflict)}
            >
              Resolve
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
