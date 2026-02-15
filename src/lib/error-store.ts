import { create } from "zustand";

export interface AppError {
  id: string;
  message: string;
  context?: string;
  timestamp: number;
}

interface ErrorStoreState {
  errors: AppError[];
  pushError: (message: string, context?: string) => void;
  dismissError: (id: string) => void;
  clearErrors: () => void;
}

export const useErrorStore = create<ErrorStoreState>((set) => ({
  errors: [],
  pushError: (message, context) => {
    const error: AppError = {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      message,
      context,
      timestamp: Date.now(),
    };
    console.error(`[${context || "app"}]`, message);
    set((state) => ({ errors: [...state.errors, error] }));

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      set((state) => ({ errors: state.errors.filter((e) => e.id !== error.id) }));
    }, 8000);
  },
  dismissError: (id) => set((state) => ({ errors: state.errors.filter((e) => e.id !== id) })),
  clearErrors: () => set({ errors: [] }),
}));
