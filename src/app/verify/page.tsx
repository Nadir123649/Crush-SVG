"use client";

import React from "react";
import { VerificationModal } from "@/components/modals/VerificationModal";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VerificationPage() {
  const router = useRouter();

  return (
    <div className="w-full py-[100px] flex items-center justify-center">
      <VerificationModal onClose={() => router.push('/')} />
    </div>
  );
}
