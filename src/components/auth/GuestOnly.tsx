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

  // Render children immediately even during "loading" state 
  // so the login/signup cards don't have a visible delay for guests.
  return <>{children}</>;
}
