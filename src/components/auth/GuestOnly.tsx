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

  if (status === "authed") {
    return null;
  }

  // Show the login form immediately for guests and during loading (avoids flash)
  return <>{children}</>;
}