"use client";

import React, { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/client/auth-context";

interface GuestOnlyProps {
  children: ReactNode;
}

export function GuestOnly({ children }: GuestOnlyProps) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authed") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "authed" || status === "loading") {
    return null;
  }

  return <>{children}</>;
}