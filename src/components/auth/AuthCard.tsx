"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IMAGES } from "@/lib/images";
import { useAuth } from "@/lib/client/auth-context";
import { getErrorMessage } from "@/lib/firebase-client";

interface AuthCardProps {
  type: "login" | "signup";
}

type OAuthProvider = "google" | "github" | "x";
type SubmittingState = "email" | OAuthProvider | null;

export function AuthCard({ type }: AuthCardProps) {
  const isLogin = type === "login";
  const router = useRouter();
  const { login, register, loginWithOAuth, resendVerification } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState<SubmittingState>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting("email");
    try {
      if (isLogin) {
        await login(email, password, rememberMe);
        router.push("/");
      } else {
        await register(name, email, password);
        setVerificationSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleOAuth(provider: OAuthProvider) {
    setError(null);
    setSubmitting(provider);
    try {
      await loginWithOAuth(provider, true);
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(null);
    }
  }

  async function handleResend() {
    setError(null);
    try {
      await resendVerification(email);
      setResendDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend. Try again.");
    }
  }

  if (verificationSent) {
    return (
      <div className="w-[440px] bg-[#FFFCFA] rounded-[8px] p-[24px_32px] shadow-[0px_4px_44px_0px_rgba(0,0,0,0.06)] flex flex-col mx-auto border-[1px] border-[#F2EDE8]">
        <Link href="/" className="absolute top-[24px] right-[24px] z-10 p-1 self-end" aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="flex flex-col items-center gap-[16px] py-[48px]">
          <Image src={IMAGES.emailVerification} alt="" width={72} height={72} className="object-contain" />
          <h2 className="font-bricolage text-[24px] font-bold text-[#000000] leading-[1] text-center">
            Check your email
          </h2>
          <p className="font-afacad text-[14px] text-[#4B5563] text-center leading-[20px]">
            We sent a verification link to <span className="font-semibold text-[#353A3E]">{email}</span>.
            Click it to activate your account, then log in.
          </p>
          <div className="flex flex-col items-center gap-[8px] mt-[8px]">
            {resendDone ? (
              <p className="font-afacad text-[13px] text-[#D94A1E]">Verification email sent again.</p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="font-afacad font-medium text-[14px] text-[#D94A1E] hover:underline"
              >
                Resend verification email
              </button>
            )}
            <Link href="/login" className="font-afacad text-[14px] text-[#4B5563] hover:text-[#D94A1E]">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const submitLabel = submitting === "email" ? (isLogin ? "Logging in…" : "Creating account…") : isLogin ? "Log In" : "Create Account";

  return (
    <div className="relative w-[440px] bg-[#FFFCFA] rounded-[8px] p-[24px_32px] shadow-[0px_4px_44px_0px_rgba(0,0,0,0.06)] flex flex-col mx-auto border-[1px] border-[#F2EDE8]">
      <Link href="/" className="absolute top-[24px] right-[24px] text-gray-500 hover:text-gray-700 z-10 p-1" aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>

      <div className="flex flex-col w-[376px] gap-[12px] mx-auto relative mt-[4px]">
        <div className="flex flex-col gap-[4px]">
          <h2 className="font-bricolage text-[24px] font-bold text-[#000000] leading-[1]">
            {isLogin ? "Log In" : "Create Account"}
          </h2>
          <p className="font-afacad text-[14px] text-[#000000]">
            {isLogin ? (
              <>New user? <Link href="/signup" className="text-[#D94A1E] font-semibold hover:underline">Sign Up</Link></>
            ) : (
              <>Already have an account? <Link href="/login" className="text-[#D94A1E] font-semibold hover:underline">Log In</Link></>
            )}
          </p>
        </div>

        <div className="mt-[8px] flex flex-col gap-[16px]">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={submitting !== null}
            className="flex items-center justify-center w-full h-[34px] rounded-[8px] border-[1px] border-[#B8B8B8] bg-transparent gap-[10px] hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image src={IMAGES.google} alt="" width={16} height={16} />
            <span className="font-afacad font-medium text-[14px] text-black">
              {submitting === "google" ? "Connecting…" : "Continue with Google"}
            </span>
          </button>

          <div className="flex items-center justify-center gap-[10px]">
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Facebook login coming soon"
              className="opacity-40 cursor-not-allowed"
            >
              <Image src={IMAGES.facebookLogin} alt="Facebook (coming soon)" width={32} height={32} className="object-contain" />
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={submitting !== null}
              className="hover:opacity-80 transition-opacity disabled:opacity-50"
              aria-label="Continue with GitHub"
            >
              <Image src={IMAGES.githubLogin} alt="" width={32} height={32} className="object-contain" />
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("x")}
              disabled={submitting !== null}
              className="hover:opacity-80 transition-opacity disabled:opacity-50"
              aria-label="Continue with X (Twitter)"
            >
              <Image src={IMAGES.twitterLogin} alt="" width={32} height={32} className="object-contain" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-[10px] my-[6px]">
          <div className="h-[1px] flex-1 bg-[#B8B8B8]"></div>
          <span className="font-afacad text-[12px] text-[#4B5563] font-medium">Or</span>
          <div className="h-[1px] flex-1 bg-[#B8B8B8]"></div>
        </div>

        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-[12px]">
          {!isLogin && (
            <div className="flex flex-col gap-[4px]">
              <label htmlFor="auth-name" className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Name</label>
              <input
                id="auth-name"
                type="text"
                required
                minLength={1}
                maxLength={20}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full h-[32px] rounded-[4px] border-[1px] border-[#B8B8B8] bg-transparent px-[12px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
              />
            </div>
          )}
          <div className="flex flex-col gap-[4px]">
            <label htmlFor="auth-email" className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Email</label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              className="w-full h-[32px] rounded-[4px] border-[1px] border-[#B8B8B8] bg-transparent px-[12px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
            />
          </div>
          <div className="flex flex-col gap-[4px]">
            <label htmlFor="auth-password" className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Password</label>
            <div className="relative w-full">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                maxLength={20}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="w-full h-[32px] rounded-[4px] border-[1px] border-[#B8B8B8] bg-transparent px-[12px] pr-[32px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-black"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {showPassword ? (
                    <path d="M2 12C2 12 5.63636 5 12 5C18.3636 5 22 12 22 12C22 12 18.3636 19 12 19C5.63636 19 2 12 2 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  ) : (
                    <path d="M3 3L21 21M10.584 10.584C10.2086 10.9594 9.74562 11.2385 9.23799 11.3972C8.73036 11.5559 8.19236 11.5892 7.66864 11.4943C7.14492 11.3993 6.65118 11.1791 6.22628 10.8521C5.80138 10.5252 5.45762 10.1026 5.22246 9.61859C4.9873 9.13462 4.86742 8.60305 4.87251 8.06583C4.87761 7.52862 5.00751 6.99959 5.25172 6.52019M9.85718 5.848C10.7513 5.64049 11.3751 5.87958 11.3751 5.87958M4.86582 4.87001C3.30995 6.32597 2.00002 8.0131 2 12C2 12 5.63636 19 12 19C13.4217 19 14.7634 18.6062 16.0001 17.9899M18.0191 14.887C19.5556 13.0151 21.3851 10.5108 22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {isLogin && (
            <div className="flex items-center justify-between w-full mt-1">
              <label className="flex items-center gap-[8px] font-afacad text-[13px] text-[#4B5563] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-[4px] border-[#B8B8B8] w-[14px] h-[14px] accent-[#D94A1E]"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="font-afacad font-medium text-[13px] text-[#D94A1E] hover:underline">
                Forgot password?
              </Link>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-[6px] border border-red-200 bg-red-50 px-[12px] py-[8px] font-afacad text-[13px] leading-[18px] text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting !== null}
            className="w-full h-[42px] rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity mt-[12px] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitLabel}
          </button>
        </form>

        <div className="text-center mt-[4px]">
          <p className="font-afacad font-normal text-[11px] leading-[12px] text-[#AEAEAE]">
            By {isLogin ? "logging in" : "creating an account"}, you agree to our <Link href="/terms" className="font-semibold hover:text-[#D94A1E]">Terms of Service</Link> & <Link href="/privacy" className="font-semibold hover:text-[#D94A1E]">Privacy Policy.</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
