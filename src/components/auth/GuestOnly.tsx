"use client";

import React, { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/client/auth-context";

interface GuestOnlyProps {
  children: ReactNode;
}

export function GuestOnly({ children }: GuestOnlyProps) {
  const { status } = useAuth();
  const router = useRouter();

  if (status === "authed") {
    router.replace("/");
    return null;
  }

  if (status === "loading") {
    return null;
  }

  return <>{children}</>;
}
