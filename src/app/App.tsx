import { MarketCanvas } from "@/features/canvas/market-canvas";
import { NoteEditor } from "@/features/editor/note-editor";
import { ResearchPanel } from "@/features/research/research-panel";
import { AppSidebar } from "@/features/sidebar/app-sidebar";
import { AppToolbar } from "@/features/toolbar/app-toolbar";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useStore } from "@/lib/store";
import { useCallback, useState } from "react";

function App() {
  const { selectedNodeId, view, sidebarOpen } = useStore();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [fitViewTrigger, setFitViewTrigger] = useState(0);
  const [autoLayoutTrigger, setAutoLayoutTrigger] = useState(0);
  const [showResearch, setShowResearch] = useState(false);

  const showEditor = selectedNodeId && view === "split";

  const handleFitView = useCallback(() => setFitViewTrigger((p) => p + 1), []);
  const handleAutoLayout = useCallback(() => setAutoLayoutTrigger((p) => p + 1), []);
  const handleToggleResearch = useCallback(() => setShowResearch((p) => !p), []);

  useKeyboardShortcuts({
    onAddNode: () => setAddDialogOpen(true),
    onFitView: handleFitView,
    onToggleResearch: handleToggleResearch,
  });

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {sidebarOpen && <AppSidebar />}

      <div className="flex-1 flex flex-col">
        <AppToolbar
          onAddNode={() => setAddDialogOpen(true)}
          onFitView={handleFitView}
          onAutoLayout={handleAutoLayout}
          onToggleResearch={handleToggleResearch}
          showResearch={showResearch}
          isDark={isDark}
          onToggleDarkMode={toggleDarkMode}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1">
            <MarketCanvas
              addDialogOpen={addDialogOpen}
              setAddDialogOpen={setAddDialogOpen}
              fitViewTrigger={fitViewTrigger}
              autoLayoutTrigger={autoLayoutTrigger}
            />
          </div>

          {showEditor && (
            <div className="w-96 flex-shrink-0">
              <NoteEditor />
            </div>
          )}

          {showResearch && selectedNodeId && (
            <div className="w-80 flex-shrink-0">
              <ResearchPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
