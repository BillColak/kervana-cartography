import { MarketCanvas } from "@/features/canvas/market-canvas";
import { NoteEditor } from "@/features/editor/note-editor";
import { ResearchPanel } from "@/features/research/research-panel";
import { AppSidebar } from "@/features/sidebar/app-sidebar";
import { AppToolbar } from "@/features/toolbar/app-toolbar";
import { useStore } from "@/lib/store";
import { useState } from "react";

function App() {
  const { selectedNodeId, view, sidebarOpen } = useStore();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [fitViewTrigger, setFitViewTrigger] = useState(0);
  const [showResearch, setShowResearch] = useState(false);

  const showEditor = selectedNodeId && view === "split";

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {sidebarOpen && <AppSidebar />}

      <div className="flex-1 flex flex-col">
        <AppToolbar
          onAddNode={() => setAddDialogOpen(true)}
          onFitView={() => setFitViewTrigger((prev) => prev + 1)}
          onToggleResearch={() => setShowResearch((prev) => !prev)}
          showResearch={showResearch}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1">
            <MarketCanvas
              addDialogOpen={addDialogOpen}
              setAddDialogOpen={setAddDialogOpen}
              fitViewTrigger={fitViewTrigger}
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
