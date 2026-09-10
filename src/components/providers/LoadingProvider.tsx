"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AppLoader } from "@/components/ui/AppLoader";

interface LoadingContextValue {
  beginLoading: () => () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [activeLoads, setActiveLoads] = useState(0);

  const beginLoading = useCallback(() => {
    setActiveLoads((count) => count + 1);
    let released = false;

    return () => {
      if (released) return;
      released = true;
      setActiveLoads((count) => Math.max(0, count - 1));
    };
  }, []);

  const value = useMemo(
    () => ({ beginLoading, isLoading: activeLoads > 0 }),
    [activeLoads, beginLoading]
  );

  return (
    <LoadingContext.Provider value={value}>
      <div aria-busy={value.isLoading} inert={value.isLoading || undefined}>
        {children}
      </div>
      {value.isLoading && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FFFCFA]/95 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-label="Loading"
        >
          <AppLoader />
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used inside LoadingProvider");
  }
  return context;
}
