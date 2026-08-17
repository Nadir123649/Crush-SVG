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
    <div className="w-full py-[40px] md:py-[100px] px-[16px] md:px-0 flex items-center justify-center">
      <VerificationModal
        variant={variant}
        onClose={() => router.push("/")}
        onContinue={() => router.push("/")}
      />
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
