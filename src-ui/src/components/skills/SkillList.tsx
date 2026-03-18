import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/stores/appStore';
import { Folder } from 'lucide-react';

export function SkillList() {
  const { skills, selectedSkills, toggleSkillSelection } = useAppStore();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full border-r">
      <div className="px-4 py-2 border-b font-medium">Skills</div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
              onClick={() => toggleSkillSelection(skill.name)}
            >
              <Checkbox
                checked={selectedSkills.has(skill.name)}
                onCheckedChange={() => toggleSkillSelection(skill.name)}
              />
              <Folder className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{skill.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatSize(skill.size)}
                </div>
              </div>
            </div>
          ))}
          {skills.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              No skills found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
