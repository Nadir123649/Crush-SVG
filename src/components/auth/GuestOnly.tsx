"use client";

import React, { useEffect, useRef, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/client/auth-context";

interface GuestOnlyProps {
  children: ReactNode;
}

export function GuestOnly({ children }: GuestOnlyProps) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (status === "authed" && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return null;
  }

  if (status === "authed") {
    // On the login page, keep rendering children during the redirect so the
    // user does not see a blank page while navigation completes.
    if (pathname === "/login" || pathname === "/signup") {
      return <>{children}</>;
    }
    return null;
  }

  return <>{children}</>;
}