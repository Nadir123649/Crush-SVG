"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IMAGES } from "@/lib/images";
import { useAuth } from "@/lib/client/auth-context";
import { getErrorMessage } from "@/lib/firebase-client";
import { ApiError } from "@/lib/client/http";

import { useToast } from "@/components/ui/ToastProvider";

interface AuthCardProps {
  type: "login" | "signup";
}

type OAuthProvider = "google" | "github" | "x";
type SubmittingState = "email" | OAuthProvider | null;

export function AuthCard({ type }: AuthCardProps) {
  const isLogin = type === "login";
  const router = useRouter();
  const { login, register, loginWithOAuth, resendVerification } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState<SubmittingState>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerificationRequired(false);
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
      if (err instanceof ApiError && err.code === "email_not_verified") {
        setVerificationRequired(true);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(null);
    }
  }

async function handleOAuth(provider: OAuthProvider) {
    setError(null);
    setSubmitting(provider);
    try {
      await loginWithOAuth(provider, true);
      addToast("Logged in successfully");
      router.push("/");
    } catch (err) {
      // Closing the popup is a cancellation, not an error — keep the form clean.
      if (getErrorMessage(err) !== "Sign-in was cancelled") {
        setError(getErrorMessage(err));
      }
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

  const submitLabel = submitting === "email" ? (isLogin ? "Logging in..." : "Creating account...") : isLogin ? "Log In" : "Create Account";

  return (
    <div className="w-full max-w-[440px] bg-[#FFFCFA] rounded-[8px] p-[24px_16px] sm:p-[24px_32px] shadow-[0px_4px_44px_0px_rgba(0,0,0,0.06)] flex flex-col mx-auto border-[1px] border-[#F2EDE8] relative">

      <div className="flex flex-col w-full max-w-[376px] gap-[12px] mx-auto relative mt-[4px]">
        
        {/* Header Text */}
        <div className="flex flex-col gap-[4px] items-center text-center">
          <h2 className="font-bricolage text-[20px] font-bold text-[#000000] leading-[1]">
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

        {/* Inputs */}
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-[12px] mt-[8px]">
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
                className="w-full h-[32px] rounded-[4px] border-[1px] border-[#C1C1C1] bg-transparent px-[12px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
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
              className="w-full h-[32px] rounded-[4px] border-[1px] border-[#C1C1C1] bg-transparent px-[12px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
            />
          </div>
          <div className="flex flex-col gap-[4px]">
            <label htmlFor="auth-password" className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Password</label>
            <div className="relative w-full">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                maxLength={20}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (8–20 characters)"
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="w-full h-[32px] rounded-[4px] border-[1px] border-[#C1C1C1] bg-transparent px-[12px] pr-[32px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-black flex items-center justify-center w-[20px] h-[20px]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {!showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[16px] h-[16px]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[16px] h-[16px]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
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
              {isLogin && verificationRequired && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendDone}
                  className="block mt-[6px] font-afacad font-medium text-[13px] text-[#D94A1E] hover:underline disabled:text-[#AEAEAE]"
                >
                  {resendDone ? "Verification email sent again" : "Resend verification email"}
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting === "email"}
            className="w-full h-[42px] rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity mt-[12px] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitLabel}
          </button>
        </form>

        <div className="flex items-center gap-[10px] my-[6px]">
          <div className="h-[1px] flex-1 bg-[#B8B8B8]"></div>
          <span className="font-afacad text-[12px] text-[#4B5563] font-medium">Or</span>
          <div className="h-[1px] flex-1 bg-[#B8B8B8]"></div>
        </div>

        <div className="flex flex-col gap-[16px]">
          {/* Continue with Google */}
          <button 
            type="button" 
            onClick={() => handleOAuth("google")} 
            disabled={submitting === "email" || submitting === "google"}
            className="flex items-center justify-center w-full h-[34px] rounded-[8px] border-[1px] border-[#C1C1C1] bg-transparent gap-[10px] hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image src={IMAGES.google} alt="Google" width={16} height={16} />
            <span className="font-afacad font-medium text-[14px] text-black">
              {submitting === "google" ? "Connecting..." : "Continue with Google"}
            </span>
          </button>

          {/* Social Icons Row */}
          <div className="flex items-center justify-center gap-[10px]">
            <button 
              type="button"
              disabled
              aria-disabled="true"
              title="Facebook login coming soon"
              className="opacity-40 cursor-not-allowed"
            >
              <Image src={IMAGES.facebookLogin} alt="Facebook" width={32} height={32} className="object-contain" />
            </button>
            <button 
              type="button" 
              onClick={() => handleOAuth("github")}
              disabled={submitting === "email" || submitting === "github"}
              className="hover:opacity-80 transition-opacity disabled:opacity-50"
              aria-label="Continue with GitHub"
            >
              <Image src={IMAGES.githubLogin} alt="GitHub" width={32} height={32} className="object-contain" />
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("x")}
              disabled
              aria-disabled="true"
              title="X login coming soon"
              className="opacity-40 cursor-not-allowed"
              aria-label="Continue with X (coming soon)"
            >
              <Image src={IMAGES.twitterLogin} alt="" width={32} height={32} className="object-contain" />
            </button>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-[4px]">
          <p className="font-afacad font-normal text-[11px] leading-[12px] text-[#AEAEAE]">
            By {isLogin ? "logging in" : "creating an account"}, you agree to our <Link href="/terms" className="font-semibold hover:text-[#D94A1E]">Terms of Service</Link> & <Link href="/privacy-policy" className="font-semibold hover:text-[#D94A1E]">Privacy Policy.</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
