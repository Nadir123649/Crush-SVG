"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/client/http";

type TokenState = "checking" | "valid" | "invalid";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [tokenState, setTokenState] = useState<TokenState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const body = await apiFetch<{ valid: boolean }>(`/api/v1/passwords/reset?token=${encodeURIComponent(token)}`)
        if (cancelled) return
        setTokenState(body.valid === true ? "valid" : "invalid")
      } catch {
        if (!cancelled) setTokenState("invalid")
      }
    })()
    return () => { cancelled = true }
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch<{ message: string }>("/api/v1/passwords/reset", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setTokenState("invalid");
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
          {tokenState === "checking" && (
            <div className="flex flex-col items-center gap-[12px] py-[48px]">
              <div className="w-[28px] h-[28px] rounded-full border-[3px] border-[#F2EDE8] border-t-[#D94A1E] animate-spin" />
              <p className="font-afacad text-[14px] text-[#4B5563]">Checking your reset link…</p>
            </div>
          )}

          {tokenState === "invalid" && (
            <div className="flex flex-col items-center gap-[12px] py-[32px]">
              <h2 className="font-bricolage text-[24px] font-bold text-[#000000] leading-[1]">Link invalid or expired</h2>
              <p className="font-afacad text-[14px] text-[#4B5563] text-center leading-[20px]">
                This password reset link is invalid or has expired. Request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="w-full h-[42px] flex items-center justify-center rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity mt-[8px]"
              >
                Request new link
              </Link>
            </div>
          )}

          {done && (
            <div className="flex flex-col items-center gap-[12px] py-[32px]">
              <h2 className="font-bricolage text-[24px] font-bold text-[#000000] leading-[1]">Password changed</h2>
              <p className="font-afacad text-[14px] text-[#4B5563] text-center leading-[20px]">
                Your password has been updated. Sign in with your new password.
              </p>
              <Link
                href="/login"
                className="w-full h-[42px] flex items-center justify-center rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity mt-[8px]"
              >
                Log In
              </Link>
            </div>
          )}

          {tokenState === "valid" && !done && (
            <>
              <div className="flex flex-col gap-[4px]">
                <h2 className="font-bricolage text-[24px] font-bold text-[#000000] leading-[1]">Choose a new password</h2>
                <p className="font-afacad text-[14px] text-[#4B5563]">
                  Pick a strong password you don&apos;t use elsewhere (6–20 characters).
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-[12px]">
                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="rp-password" className="font-afacad text-[14px] font-semibold text-[#D94A1E]">New password</label>
                  <div className="relative w-full">
                    <input
                      id="rp-password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      maxLength={20}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      className="w-full h-[32px] rounded-[4px] border-[1px] border-[#B8B8B8] bg-transparent px-[12px] pr-[32px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-black"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 12C2 12 5.63636 5 12 5C18.3636 5 22 12 22 12C22 12 18.3636 19 12 19C5.63636 19 2 12 2 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="rp-confirm" className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Confirm password</label>
                  <input
                    id="rp-confirm"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={20}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
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
                  {submitting ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
