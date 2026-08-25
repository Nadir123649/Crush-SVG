"use client";

import React, { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/client/http";
import { PasswordResetSuccessAlert } from "@/components/ui/Alert";
import { showToast } from "@/lib/client/toast-bridge";

export function ForgotPasswordCard() {
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
      const res = await fetch("/api/v1/passwords/forgot", {
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
            Forgot Your Password?
          </h2>
          <p className="font-afacad text-[14px] text-[#4B5563]">
            Enter your email address below and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-[12px] py-[16px]">
            <PasswordResetSuccessAlert 
              message="Reset link sent. Please check your inbox." 
              onClose={() => setSent(false)}
            />
            <p className="font-afacad text-[14px] text-[#4B5563] text-center leading-[20px] mt-[12px]">
              If an account exists for <span className="font-semibold text-[#353A3E]">{email}</span>,
              a reset link has been sent. It expires in 30 minutes.
            </p>
            <Link href="/login" className="font-afacad font-medium text-[14px] text-[#D94A1E] hover:underline mt-[8px]">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[12px]">
            <div className="flex flex-col gap-[4px]">
              <label htmlFor="fp-email" className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Email</label>
              <input 
                id="fp-email"
                type="email" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your email"
                autoComplete="email"
                className={`w-full h-[32px] rounded-[4px] border-[1px] ${(hasSubmitted && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) || error ? "border-[#EF4444] focus:border-[#EF4444]" : "border-[#C1C1C1] focus:border-[#D94A1E]"} bg-transparent px-[12px] font-afacad text-[14px] outline-none placeholder:text-[#AEAEAE] transition-colors`}
              />
              {(hasSubmitted && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) ? (
                <span className="text-[#EF4444] text-[12px] font-afacad leading-tight mt-[2px]">
                  Invalid email format
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
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        {/* Footer Text */}
        {!sent && (
          <div className="text-center mt-[-4px]">
            <p className="font-afacad font-normal text-[12px] text-[#475569]">
              Remember your password? <Link href="/login" className="font-semibold text-[#D94A1E] hover:underline">Log In</Link>
            </p>
          </div>
        )} 
      </div>
    </div>
  );
}
