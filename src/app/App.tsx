import { useStore } from "@/lib/store";
import { MarketCanvas } from "@/features/canvas/market-canvas";
import { AppSidebar } from "@/features/sidebar/app-sidebar";
import { NoteEditor } from "@/features/editor/note-editor";

function App() {
  const { selectedNodeId, sidebarOpen } = useStore();

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {sidebarOpen && <AppSidebar />}

      <div className="flex-1 flex">
        <div className={selectedNodeId ? "flex-1" : "w-full"}>
          <MarketCanvas />
        </div>

        {selectedNodeId && (
          <div className="w-96">
            <NoteEditor />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
