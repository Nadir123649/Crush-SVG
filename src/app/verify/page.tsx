"use client";

import React, { Suspense, useEffect, useState } from "react";
import { VerificationModal } from "@/components/modals/VerificationModal";
import { useRouter, useSearchParams } from "next/navigation";
import { showToast } from "@/lib/client/toast-bridge";

function VerificationContent() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get("status");

  const variant = status === "success" ? "success" : "invalid";
  const [redirectIn, setRedirectIn] = useState(3);

  useEffect(() => {
    if (variant === "success") {
      showToast("success", "Email verified. You can now log in.")
    }
  }, [variant])

  useEffect(() => {
    if (variant !== "success") return;
    const timer = setInterval(() => {
      setRedirectIn((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [variant]);

  useEffect(() => {
    if (variant === "success" && redirectIn === 0) {
      router.push("/");
    }
  }, [variant, redirectIn, router]);

  return (
    <div className="w-full flex justify-center py-[40px] md:py-[60px] px-[16px] md:px-0 min-h-[75vh] items-center">
      <div className="w-full max-w-[440px]">
        <VerificationModal
          variant={variant}
          onContinue={() => router.push("/")}
        />
        {variant === "success" && redirectIn > 0 && (
          <p className="text-center font-afacad text-[13px] text-[#4B5563] mt-[12px]">
            Redirecting you to the home page in {redirectIn}s…
          </p>
        )}
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
