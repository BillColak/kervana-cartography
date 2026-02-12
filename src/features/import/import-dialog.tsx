import { type ImportResult, importObsidianCanvas } from "@/actions/import";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, FileText, Loader2 } from "lucide-react";
import { useState } from "react";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: ImportDialogProps) {
  const [canvasPath, setCanvasPath] = useState("");
  const [vaultPath, setVaultPath] = useState("");
  const [clearExisting, setClearExisting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!canvasPath || !vaultPath) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await importObsidianCanvas(canvasPath, vaultPath, clearExisting);
      setResult(res);
      onImportComplete();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Import from Obsidian
          </DialogTitle>
          <DialogDescription>
            Import a .canvas file from your Obsidian vault. Markdown content
            from linked files will be imported as node notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="vault-path">Vault Path</Label>
            <Input
              id="vault-path"
              value={vaultPath}
              onChange={(e) => setVaultPath(e.target.value)}
              placeholder="/home/user/Obsidian/MyVault"
            />
            <p className="text-xs text-muted-foreground">
              Root directory of your Obsidian vault
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="canvas-path">Canvas File Path</Label>
            <Input
              id="canvas-path"
              value={canvasPath}
              onChange={(e) => setCanvasPath(e.target.value)}
              placeholder="/home/user/Obsidian/MyVault/Canvas.canvas"
            />
            <p className="text-xs text-muted-foreground">
              Full path to the .canvas file to import
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="clear-existing"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="clear-existing" className="text-sm font-normal">
              Replace existing data (recommended for first import)
            </Label>
          </div>

          {clearExisting && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                This will delete all existing nodes, edges, and research data
                before importing.
              </p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md space-y-1">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Import Complete</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                {result.nodesImported} nodes, {result.edgesImported} edges
                imported. {result.filesRead} markdown files read.
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-yellow-600 font-medium">
                    {result.errors.length} warnings:
                  </p>
                  <ul className="text-xs text-yellow-600 max-h-24 overflow-y-auto">
                    {result.errors.slice(0, 10).map((err) => (
                      <li key={err}>• {err}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>...and {result.errors.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={loading || !canvasPath || !vaultPath}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Importing..." : "Import"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
