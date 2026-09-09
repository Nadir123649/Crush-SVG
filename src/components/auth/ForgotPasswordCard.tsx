"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/routing";
import { apiBase } from "@/lib/client/api";
import { PasswordResetSuccessAlert } from "@/components/ui/Alert";
import { showToast } from "@/lib/client/toast-bridge";
import { useTranslations } from "next-intl";

export function ForgotPasswordCard() {
  const t = useTranslations("auth_pages.forgotPassword");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHasSubmitted(true);
    setError(null);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(apiBase("/api/v1/passwords/forgot"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (res.ok) {
        setSent(true);
        showToast("success", "Reset link sent. Please check your inbox.");
      } else {
        const data = await res.json().catch(() => null);
        const errMsg = data?.payload?.error?.message || data?.error?.message || "Something went wrong. Please try again.";
        setError(errMsg);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[440px] bg-[#FFFCFA] rounded-[8px] p-[24px_16px] sm:p-[24px_32px] shadow-[0px_4px_44px_0px_rgba(0,0,0,0.06)] flex flex-col mx-auto border-[1px] border-[#F2EDE8] relative">

      <div className="flex flex-col w-full max-w-[376px] gap-[16px] mx-auto relative mt-[4px]">
        
        {/* Header Text */}
        <div className="flex flex-col gap-[8px] items-center text-center">
          <h2 className="font-bricolage text-[20px] font-bold text-[#000000] leading-[1]">
            {t("title")}
          </h2>
          <p className="font-afacad text-[14px] text-[#4B5563]">
            {t("subtitle")}
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-[12px]">
            <PasswordResetSuccessAlert 
              message={t("successMessage")} 
              onClose={() => setSent(false)}
            />
            <p className="font-afacad text-[14px] text-[#4B5563] text-center leading-[20px] mt-[12px]">
              {t("successMessage").replace("{email}", email)}
            </p>
            <Link href="/login" className="font-afacad font-medium text-[14px] text-[#D94A1E] hover:underline mt-[8px]">
              {t("backToLogin")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[12px]">
            <div className="flex flex-col gap-[4px]">
              <label htmlFor="fp-email" className="font-afacad text-[14px] font-semibold text-[#D94A1E]">{t("emailLabel")}</label>
              <input 
                id="fp-email"
                type="email" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
                className={`w-full h-[32px] rounded-[4px] border-[1px] ${(hasSubmitted && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) || error ? "border-[#EF4444] focus:border-[#EF4444]" : "border-[#C1C1C1] focus:border-[#D94A1E]"} bg-transparent px-[12px] font-afacad text-[14px] outline-none placeholder:text-[#AEAEAE] transition-colors`}
              />
              {(hasSubmitted && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) ? (
                <span className="text-[#EF4444] text-[12px] font-afacad leading-tight mt-[2px]">
                  {t("emailInvalidError")}
                </span>
              ) : error ? (
                <span className="text-[#EF4444] text-[12px] font-afacad leading-tight mt-[2px]">
                  {error}
                </span>
              ) : null}
            </div>

            <button 
              type="submit"
              disabled={submitting}
              aria-label="Send password reset link"
              className="w-full h-[42px] rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed mt-[4px]"
            >
              {submitting ? t("loadingButton") : t("submitButton")}
            </button>
          </form>
        )}

        {/* Footer Text */}
        {!sent && (
          <div className="text-center mt-[-4px]">
            <p className="font-afacad font-normal text-[12px] text-[#475569]">
              {t("backToLogin").split(" Log In")[0]} <Link href="/login" className="font-semibold text-[#D94A1E] hover:underline">Log In</Link>
            </p>
          </div>
        )} 
      </div>
    </div>
  );
}
