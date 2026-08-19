import React from "react";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/images";

export function SignupCard() {
  return (
    <div className="w-full max-w-[440px] bg-[#FFFCFA] rounded-[8px] p-[24px_32px] shadow-[0px_4px_44px_0px_rgba(0,0,0,0.06)] flex flex-col mx-auto border-[1px] border-[#F2EDE8] relative">

      <div className="flex flex-col w-full max-w-[376px] gap-[12px] mx-auto relative mt-[4px]">
        
        {/* Header Text */}
        <div className="flex flex-col gap-[4px] items-center text-center">
          <h2 className="font-bricolage text-[24px] font-bold text-[#000000] leading-[1]">Create Account</h2>
          <p className="font-afacad text-[14px] text-[#000000]">
            Already have an account? <Link href="/login" className="text-[#D94A1E] font-semibold hover:underline">Log In</Link>
          </p>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <label className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Name</label>
            <input 
              type="text" 
              maxLength={16}
              placeholder="Enter your name"
              className="w-full h-[32px] rounded-[4px] border-[1px] border-[#C1C1C1] bg-transparent px-[12px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
            />
          </div>
          <div className="flex flex-col gap-[4px]">
            <label className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Email</label>
            <input 
              type="email" 
              placeholder="Enter your email"
              className="w-full h-[32px] rounded-[4px] border-[1px] border-[#C1C1C1] bg-transparent px-[12px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
            />
          </div>
          <div className="flex flex-col gap-[4px]">
            <label className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Enter your password</label>
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

        {/* CTA Button */}
        <button className="w-full h-[42px] rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity mt-[12px]">
          Create Account
        </button>

        <div className="flex items-center gap-[10px] my-[6px]">
          <div className="h-[1px] flex-1 bg-[#B8B8B8]"></div>
          <span className="font-afacad text-[12px] text-[#4B5563] font-medium">Or</span>
          <div className="h-[1px] flex-1 bg-[#B8B8B8]"></div>
        </div>

        <div className="flex flex-col gap-[16px]">
          {/* Continue with Google */}
          <button className="flex items-center justify-center w-full h-[42px] rounded-[8px] border-[1px] border-[#C1C1C1] bg-transparent gap-[10px] hover:bg-black/5 transition-colors">
            <Image src={IMAGES.google} alt="Google" width={16} height={16} />
            <span className="font-afacad font-medium text-[14px] text-black">Continue with Google</span>
          </button>


        </div>

        {/* Footer Text */}
        <div className="text-center mt-[4px]">
          <p className="font-afacad font-normal text-[11px] leading-[12px] text-[#AEAEAE]">
            By creating an account, you agree to our <Link href="/terms" className="font-bold hover:text-[#D94A1E]">Terms of Service</Link> & <Link href="/privacy-policy" className="font-bold hover:text-[#D94A1E]">Privacy Policy.</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
