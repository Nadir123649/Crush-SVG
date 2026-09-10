"use client";

import type { ReactNode } from "react";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";

export function AppFeedbackProvider({ children }: { children: ReactNode }) {
  return (
    <LoadingProvider>
      {children}
      <ToastProvider />
    </LoadingProvider>
  );
}
