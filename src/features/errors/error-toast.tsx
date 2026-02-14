import { useErrorStore } from "@/lib/error-store";
import { X } from "lucide-react";

export function ErrorToast() {
  const { errors, dismissError } = useErrorStore();

  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-14 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {errors.map((err) => (
        <div
          key={err.id}
          className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 animate-in slide-in-from-right"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{err.message}</p>
            {err.context && (
              <p className="text-xs text-red-200 mt-0.5">{err.context}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismissError(err.id)}
            className="text-red-200 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
