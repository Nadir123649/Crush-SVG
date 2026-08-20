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
    <div 
      className="w-full min-h-screen py-[40px] md:py-[100px] px-[16px] md:px-0 flex items-center justify-center cursor-pointer"
      onClick={() => router.push("/")}
    >
      <div onClick={(e) => e.stopPropagation()} className="cursor-default w-full max-w-[440px]">
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
    <Suspense fallback={<div className="w-full py-[100px]" />}>
      <VerificationContent />
    </Suspense>
  );
}
