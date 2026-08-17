import React from "react";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/images";

interface AuthCardProps {
  type: "login" | "signup";
}

export function AuthCard({ type }: AuthCardProps) {
  const isLogin = type === "login";

  return (
    <div className="w-full max-w-[440px] bg-[#FFFCFA] rounded-[8px] p-[24px_16px] sm:p-[24px_32px] shadow-[0px_4px_44px_0px_rgba(0,0,0,0.06)] flex flex-col mx-auto border-[1px] border-[#F2EDE8] relative">
      
      {/* Close Icon */}
      <Link href="/" className="absolute top-[24px] right-[24px] text-gray-500 hover:text-gray-700 z-10 p-1">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>

      <div className="flex flex-col w-full max-w-[376px] gap-[12px] mx-auto relative mt-[4px]">
        
        {/* Header Text */}
        <div className="flex flex-col gap-[4px]">
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

        <div className="mt-[8px] flex flex-col gap-[16px]">
          {/* Continue with Google */}
          <button className="flex items-center justify-center w-full h-[34px] rounded-[8px] border-[1px] border-[#C1C1C1] bg-transparent gap-[10px] hover:bg-black/5 transition-colors">
            <Image src={IMAGES.google} alt="Google" width={16} height={16} />
            <span className="font-afacad font-medium text-[14px] text-black">Continue with Google</span>
          </button>

          {/* Social Icons Row */}
          <div className="flex items-center justify-center gap-[10px]">
            <button className="hover:opacity-80 transition-opacity">
              <Image src={IMAGES.facebookLogin} alt="Facebook" width={32} height={32} className="object-contain" />
            </button>
            <button className="hover:opacity-80 transition-opacity">
              <Image src={IMAGES.githubLogin} alt="GitHub" width={32} height={32} className="object-contain" />
            </button>
            <button className="hover:opacity-80 transition-opacity">
              <Image src={IMAGES.twitterLogin} alt="Twitter" width={32} height={32} className="object-contain" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-[10px] my-[6px]">
          <div className="h-[1px] flex-1 bg-[#B8B8B8]"></div>
          <span className="font-afacad text-[12px] text-[#4B5563] font-medium">Or</span>
          <div className="h-[1px] flex-1 bg-[#B8B8B8]"></div>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <label className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Email</label>
            <input 
              type="email" 
              placeholder="Enter your email"
              className="w-full h-[32px] rounded-[4px] border-[1px] border-[#C1C1C1] bg-transparent px-[12px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
            />
          </div>
          <div className="flex flex-col gap-[4px]">
            <label className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Password</label>
            <div className="relative w-full">
              <input 
                type="password" 
                placeholder="Enter password"
                className="w-full h-[32px] rounded-[4px] border-[1px] border-[#C1C1C1] bg-transparent px-[12px] pr-[32px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
              />
              <button className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-black">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5C5.63636 5 2 12 2 12C2 12 5.63636 19 12 19C18.3636 19 22 12 22 12C22 12 18.3636 5 12 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Remember me & Forgot Password (Only for Login) */}
        {isLogin && (
          <div className="flex items-center justify-between w-full mt-1">
            <label className="flex items-center gap-[8px] font-afacad text-[13px] text-[#4B5563] cursor-pointer">
              <input type="checkbox" className="rounded-[4px] border-[#B8B8B8] w-[14px] h-[14px] accent-[#D94A1E]" />
              Remember me
            </label>
            <Link href="/forgot-password" className="font-afacad font-medium text-[13px] text-[#D94A1E] hover:underline">
              Forgot password?
            </Link>
          </div>
        )}

        {/* CTA Button */}
        <button className="w-full h-[42px] rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity mt-[12px]">
          {isLogin ? "Log In" : "Create Account"}
        </button>

        {/* Footer Text */}
        <div className="text-center mt-[4px]">
          <p className="font-afacad font-normal text-[11px] leading-[12px] text-[#AEAEAE]">
            By {isLogin ? "logging in" : "creating an account"}, you agree to our <Link href="/terms" className="font-semibold hover:text-[#D94A1E]">Terms of Service</Link> & <Link href="/privacy" className="font-semibold hover:text-[#D94A1E]">Privacy Policy.</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
