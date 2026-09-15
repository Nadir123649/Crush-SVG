"use client";

import React, { useEffect, useRef, useState, type ReactNode } from "react";
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
  const [redirecting, setRedirecting] = useState(false);
  // Track if user was already authed when the component mounted
  const initiallyAuthedRef = useRef(status === "authed");

  useEffect(() => {
    // Only redirect if the user was ALREADY authed when this component
    // first mounted (e.g. direct navigation to /login while logged in).
    // If the user logs in *while* on this page, AuthCard handles the
    // navigation — we must not compete with a second router.push.
    if (initiallyAuthedRef.current && status === "authed" && !redirectedRef.current) {
      redirectedRef.current = true;
      setRedirecting(true);
      const returnTo = searchParams.get("returnTo") || "/";
      router.replace(returnTo as any);
    }
  }, [status, router, searchParams]);

  // If user navigated directly while already authed, or is redirecting after login,
  // show a stable loader with full min-height so header and footer never collapse.
  if (initiallyAuthedRef.current || redirecting) {
    return (
      <div className="w-full min-h-[75vh] flex items-center justify-center py-[60px]">
        <AppLoader />
      </div>
    );
  }

  // Guest: show the protected content directly.
  return <>{children}</>;
}