"use client";

import React, { Suspense } from "react";
import { VerificationModal } from "@/components/modals/VerificationModal";
import { useRouter, useSearchParams } from "next/navigation";

function VerificationContent() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get("status");

  const variant = status === "success" ? "success" : "invalid";

  return (
    <div 
      className="w-full min-h-screen py-[40px] md:py-[100px] px-[16px] md:px-0 flex items-center justify-center cursor-pointer"
      onClick={() => router.push("/")}
    >
      <div onClick={(e) => e.stopPropagation()} className="cursor-default w-full max-w-[440px]">
        <VerificationModal
          variant={variant}
          onClose={() => router.push("/")}
          onContinue={() => router.push("/")}
        />
      </div>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={<div className="w-full py-[100px]" />}>
      <VerificationContent />
    </Suspense>
  );
}
