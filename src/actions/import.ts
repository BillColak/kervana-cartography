import { invokeCommand } from "@/lib/tauri";

export interface ImportResult {
  nodesImported: number;
  edgesImported: number;
  filesRead: number;
  errors: string[];
}

export async function importObsidianCanvas(
  canvasPath: string,
  vaultPath: string,
  clearExisting: boolean,
): Promise<ImportResult> {
  return invokeCommand<ImportResult>("import_obsidian_canvas", {
    canvasPath,
    vaultPath,
    clearExisting,
  });
}
