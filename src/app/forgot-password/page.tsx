"use client";

import React, { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/client/http";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch<{ message: string }>("/api/v1/passwords/forgot", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full flex justify-center py-[60px]">
      <div className="relative w-[440px] bg-[#FFFCFA] rounded-[8px] p-[24px_32px] shadow-[0px_4px_44px_0px_rgba(0,0,0,0.06)] flex flex-col mx-auto border-[1px] border-[#F2EDE8]">
        <Link href="/login" className="absolute top-[24px] right-[24px] text-gray-500 hover:text-gray-700 z-10 p-1" aria-label="Back to login">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        <div className="flex flex-col w-[376px] gap-[16px] mx-auto relative mt-[4px]">
          <div className="flex flex-col gap-[4px]">
            <h2 className="font-bricolage text-[24px] font-bold text-[#000000] leading-[1]">Forgot password?</h2>
            <p className="font-afacad text-[14px] text-[#4B5563]">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-[12px] py-[32px]">
              <h3 className="font-bricolage text-[20px] font-semibold text-[#353A3E]">Check your inbox</h3>
              <p className="font-afacad text-[14px] text-[#4B5563] text-center leading-[20px]">
                If an account exists for <span className="font-semibold text-[#353A3E]">{email}</span>,
                a reset link has been sent. It expires in 60 minutes.
              </p>
              <Link href="/login" className="font-afacad font-medium text-[14px] text-[#D94A1E] hover:underline mt-[8px]">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[12px]">
              <div className="flex flex-col gap-[4px]">
                <label htmlFor="fp-email" className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Email</label>
                <input
                  id="fp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="w-full h-[32px] rounded-[4px] border-[1px] border-[#B8B8B8] bg-transparent px-[12px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
                />
              </div>

              {error && (
                <div role="alert" className="rounded-[6px] border border-red-200 bg-red-50 px-[12px] py-[8px] font-afacad text-[13px] leading-[18px] text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-[42px] rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity mt-[12px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
