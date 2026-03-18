import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppStore } from "@/stores/appStore";
import { HubPathSection } from "./HubPathSection";
import { AgentsSection } from "./AgentsSection";

export function SettingsDrawer() {
  const { isSettingsOpen, setIsSettingsOpen } = useAppStore();

  return (
    <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className="py-6 space-y-6">
          <HubPathSection />
          <AgentsSection />
        </div>
      </SheetContent>
    </Sheet>
  );
}
