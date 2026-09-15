"use client";

import React, { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/client/auth-context";
import { AppLoader } from "@/components/ui/AppLoader";

interface GuestOnlyProps {
  children: ReactNode;
}

export function GuestOnly({ children }: GuestOnlyProps) {
  const { status } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedRef = useRef(false);
  // Track if user was already authed when the component mounted
  const initiallyAuthedRef = useRef(status === "authed");

  useEffect(() => {
    if (status === "authed" && !redirectedRef.current) {
      redirectedRef.current = true;
      const returnTo = searchParams.get("returnTo") || "/";
      router.replace(returnTo as any);
    }
  }, [status, router, searchParams]);

  // If user navigated directly to login while already authed, show a stable loader
  // with full min-height so header and footer never collapse together.
  if (status === "authed" && initiallyAuthedRef.current) {
    return (
      <div className="w-full min-h-[75vh] flex items-center justify-center py-[60px]">
        <AppLoader />
      </div>
    );
  }

  // If user just logged in from the form, keep children mounted (showing submitting state)
  // until the router transition completes, preventing layout snap.
  return <>{children}</>;
}