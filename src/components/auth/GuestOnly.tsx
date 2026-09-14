"use client";

import React, { useEffect, useRef, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/client/auth-context";

interface GuestOnlyProps {
  children: ReactNode;
}

export function GuestOnly({ children }: GuestOnlyProps) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (status === "authed" && !redirectedRef.current) {
      redirectedRef.current = true;
      const returnTo = searchParams.get("returnTo") || "/";
      router.replace(returnTo);
    }
  }, [status, router, searchParams]);

  if (status === "loading") {
    return (
      <div className="w-full flex justify-center py-[60px]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#D94A1E] animate-spin" />
        </div>
      </div>
    );
  }

  if (status === "authed") {
    // Show a loading state instead of the login card while redirecting
    return (
      <div className="w-full flex justify-center py-[60px]">
        <div className="animate-pulse flex items-center gap-2 font-heading font-medium text-text-muted">
          Redirecting...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}