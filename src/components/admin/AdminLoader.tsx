import React from "react";
import { AppLoader } from "@/components/ui/AppLoader";

interface AdminLoaderProps {
  message?: string;
  className?: string;
}

export function AdminLoader({ message, className = "min-h-[350px]" }: AdminLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 w-full ${className}`}>
      <AppLoader />
      {message && (
        <span className="font-body text-sm font-medium text-text-muted tracking-wide animate-pulse select-none">
          {message}
        </span>
      )}
    </div>
  );
}
