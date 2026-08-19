"use client";

import React, { Suspense, useEffect } from "react";
import { VerificationModal } from "@/components/modals/VerificationModal";
import { useRouter, useSearchParams } from "next/navigation";
import { showToast } from "@/lib/client/toast-bridge";

function VerificationContent() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get("status");

  const variant = status === "success" ? "success" : "invalid";

  useEffect(() => {
    if (variant === "success") {
      showToast("success", "Email verified. You can now log in.")
    }
  }, [variant])

  return (
    <div 
      className="w-full flex justify-center py-[40px] md:py-[60px] px-[16px] md:px-0 min-h-[75vh] items-center cursor-pointer"
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
    <Suspense fallback={<div className="w-full py-[40px] md:py-[60px] min-h-[75vh]" />}>
      <VerificationContent />
    </Suspense>
  );
}
