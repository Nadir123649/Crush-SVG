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
    return null;
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