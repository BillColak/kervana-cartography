import { MarketCanvas } from "@/features/canvas/market-canvas";
import { NoteEditor } from "@/features/editor/note-editor";
import { ResearchPanel } from "@/features/research/research-panel";
import { AppSidebar } from "@/features/sidebar/app-sidebar";
import { ImportDialog } from "@/features/import/import-dialog";
import { StatsPanel } from "@/features/stats/stats-panel";
import { StatusBar } from "@/features/statusbar/status-bar";
import { AppToolbar } from "@/features/toolbar/app-toolbar";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useStore } from "@/lib/store";
import { getAllNodes } from "@/actions/nodes";
import { getEdges } from "@/actions/edges";
import { ErrorToast } from "@/features/errors/error-toast";
import { useErrorStore } from "@/lib/error-store";
import { useCallback, useState } from "react";

function App() {
  const { selectedNodeId, view, sidebarOpen, setNodes, setEdges } = useStore();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [fitViewTrigger, setFitViewTrigger] = useState(0);
  const [autoLayoutTrigger, setAutoLayoutTrigger] = useState(0);
  const [showResearch, setShowResearch] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const showEditor = selectedNodeId && view === "split";

  const handleFitView = useCallback(() => setFitViewTrigger((p) => p + 1), []);
  const handleAutoLayout = useCallback(() => setAutoLayoutTrigger((p) => p + 1), []);
  const handleToggleResearch = useCallback(() => setShowResearch((p) => !p), []);
  const handleToggleStats = useCallback(() => setShowStats((p) => !p), []);

  const pushError = useErrorStore((s) => s.pushError);

  const handleImportComplete = useCallback(async () => {
    try {
      const [nodesData, edgesData] = await Promise.all([getAllNodes(), getEdges()]);
      setNodes(nodesData);
      setEdges(edgesData);
    } catch (err) {
      pushError(String(err), "import reload");
    }
  }, [setNodes, setEdges, pushError]);

  useKeyboardShortcuts({
    onAddNode: () => setAddDialogOpen(true),
    onFitView: handleFitView,
    onToggleResearch: handleToggleResearch,
  });

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white dark:bg-background text-gray-900 dark:text-foreground">
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && <AppSidebar />}

        <div className="flex-1 flex flex-col">
          <AppToolbar
          onAddNode={() => setAddDialogOpen(true)}
          onFitView={handleFitView}
          onAutoLayout={handleAutoLayout}
          onToggleResearch={handleToggleResearch}
          showResearch={showResearch}
          onToggleStats={handleToggleStats}
          showStats={showStats}
          onImport={() => setImportDialogOpen(true)}
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

          {showStats && (
            <div className="w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-700">
              <StatsPanel />
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />
      <ErrorToast />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}

export default App;
