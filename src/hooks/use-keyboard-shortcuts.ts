import { useStore } from "@/lib/store";
import { useEffect } from "react";

interface ShortcutHandlers {
  onAddNode?: () => void;
  onFitView?: () => void;
  onToggleResearch?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const { selectedNodeId, selectNode, toggleSidebar, view, setView, removeNode } = useStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "n") {
        e.preventDefault();
        handlers.onAddNode?.();
      } else if (ctrl && e.key === "f") {
        e.preventDefault();
        // Focus search — handled by toolbar
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Search"]',
        );
        searchInput?.focus();
      } else if (ctrl && e.key === "e") {
        e.preventDefault();
        setView(view === "split" ? "canvas" : "split");
      } else if (ctrl && e.key === "\\") {
        e.preventDefault();
        toggleSidebar();
      } else if (ctrl && e.key === "l") {
        e.preventDefault();
        handlers.onFitView?.();
      } else if (ctrl && e.key === "r") {
        e.preventDefault();
        handlers.onToggleResearch?.();
      } else if (e.key === "Escape") {
        selectNode(null);
      } else if (e.key === "Delete" && selectedNodeId) {
        if (window.confirm("Delete this node and all its children?")) {
          removeNode(selectedNodeId);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers, selectedNodeId, selectNode, toggleSidebar, view, setView, removeNode]);
}
