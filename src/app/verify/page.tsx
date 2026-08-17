"use client";

import React from "react";
import { VerificationModal } from "@/components/modals/VerificationModal";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VerificationPage() {
  const router = useRouter();

  return (
    <div className="w-full py-[40px] md:py-[100px] px-[16px] md:px-0 flex items-center justify-center">
      <VerificationModal onClose={() => router.push('/')} />
    </div>
  );
}
