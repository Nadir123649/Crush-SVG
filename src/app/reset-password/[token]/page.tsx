"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/client/http";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { showToast } from "@/lib/client/toast-bridge";

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
  const [redirectIn, setRedirectIn] = useState(3);
  const router = useRouter();

  useEffect(() => {
    if (!done) return;
    const timer = setInterval(() => {
      setRedirectIn((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [done]);

  useEffect(() => {
    if (done && redirectIn === 0) {
      router.push("/login");
    }
  }, [done, redirectIn, router]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const body = await apiFetch<{ valid: boolean }>(`/api/v1/passwords/reset?token=${encodeURIComponent(token)}`)
        if (cancelled) return
        setTokenState(body.valid === true ? "valid" : "invalid")
        if (body.valid !== true) {
          showToast("error", "This password reset link is invalid or has expired. Request a new one.")
        }
      } catch {
        if (!cancelled) {
          setTokenState("invalid")
          showToast("error", "This password reset link is invalid or has expired. Request a new one.")
        }
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
      setRedirectIn(3);
      showToast("success", "Password changed. Please log in with your new password.");
    } catch (err) {
      // Using the current password is a validation error, not an invalid link —
      // keep the form visible so the message is shown.
      if (err instanceof ApiError && err.code === "same_password") {
        setError(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setTokenState("invalid");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GuestOnly>
      <div className="w-full flex justify-center py-[40px] md:py-[60px] px-[16px] md:px-0 min-h-[75vh] items-center">
      <div className="relative w-full max-w-[440px] bg-[#FFFCFA] rounded-[8px] p-[24px_16px] sm:p-[24px_32px] shadow-[0px_4px_44px_0px_rgba(0,0,0,0.06)] flex flex-col mx-auto border-[1px] border-[#F2EDE8]">
        <Link href="/login" className="absolute top-[24px] right-[24px] text-gray-500 hover:text-gray-700 z-10 p-1" aria-label="Back to login">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        <div className="flex flex-col w-full max-w-[376px] gap-[16px] mx-auto relative mt-[4px]">
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
                href="/login"
                className="font-afacad text-[13px] text-[#4B5563] hover:text-[#D94A1E] mt-[4px]"
              >
                Back to login
              </Link>
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
              <p className="font-afacad text-[13px] text-[#4B5563] text-center leading-[20px]">
                Redirecting to login in {redirectIn}s…
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
              {/* Header Text */}
              <div className="flex flex-col gap-[8px] items-center text-center">
                <h2 className="font-bricolage text-[20px] font-bold text-[#000000] leading-[1]">
                  Create New Password
                </h2>
              </div>

              {/* Inputs */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-[12px] mt-[4px]">
                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="rp-password" className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Enter your new password</label>
                  <div className="relative w-full">
                    <input
                      id="rp-password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      maxLength={20}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="new-password"
                      className="w-full h-[32px] rounded-[4px] border-[1px] border-[#B8B8B8] bg-transparent px-[12px] pr-[32px] font-sans text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-black"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[16px] h-[16px]">
                        {!showPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        ) : (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="rp-confirm" className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Confirm your password</label>
                    <div className="relative w-full">
                      <input
                        id="rp-confirm"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        maxLength={20}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        autoComplete="new-password"
                        className="w-full h-[32px] rounded-[4px] border-[1px] border-[#B8B8B8] bg-transparent px-[12px] pr-[32px] font-sans text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-black"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[16px] h-[16px]">
                          {!showPassword ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                          ) : (
                            <>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                </div>

                {error && (
                  <div role="alert" className="rounded-[6px] border border-red-200 bg-red-50 px-[12px] py-[8px] font-afacad text-[13px] leading-[18px] text-red-700">
                    {error}
                  </div>
                )}

                {/* CTA Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-[42px] rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity mt-[20px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Updating…" : "Set New Password"}
                </button>
              </form>

              {/* Footer Text */}
              <div className="text-center mt-[12px]">
                <p className="font-afacad font-normal text-[13px] text-[#AEAEAE]">
                  Remember your password? <Link href="/login" className="font-semibold text-[#D94A1E] hover:underline">Log In</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </GuestOnly>
  );
}
