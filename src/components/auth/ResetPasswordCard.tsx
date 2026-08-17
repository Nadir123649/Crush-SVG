import React from "react";
import Link from "next/link";

export function ResetPasswordCard() {
  return (
    <div className="w-full max-w-[440px] h-auto min-h-[374px] bg-[#FFFCFA] rounded-[8px] p-[24px_16px] sm:p-[24px_32px] shadow-[0px_4px_44px_0px_rgba(0,0,0,0.06)] flex flex-col mx-auto border-[1px] border-[#F2EDE8] relative">
      

      <div className="flex flex-col w-full max-w-[376px] gap-[12px] mx-auto relative h-full">
        
        {/* Header Text */}
        <div className="flex flex-col gap-[8px] items-center text-center">
          <h2 className="font-bricolage text-[24px] font-bold text-[#000000] leading-[1]">
            Create New Password
          </h2>
          <p className="font-afacad text-[14px] text-[#475569]">
            Set your new password to restore seamless access to your account.
          </p>
        </div>

        {/* Inputs */}
        <div className="flex flex-col w-full h-[148px] gap-[12px] mt-[8px]">
          
          <div className="flex flex-col gap-[4px]">
            <label className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Password</label>
            <div className="relative w-full">
              <input 
                type="password" 
                placeholder="Enter your new password"
                className="w-full h-[32px] rounded-[4px] border-[1px] border-[#B8B8B8] bg-transparent px-[12px] pr-[32px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
              />
              <button className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-black">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5C5.63636 5 2 12 2 12C2 12 5.63636 19 12 19C18.3636 19 22 12 22 12C22 12 18.3636 5 12 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-[4px]">
            <label className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Confirm Password</label>
            <div className="relative w-full">
              <input 
                type="password" 
                placeholder="Re-enter your new password"
                className="w-full h-[32px] rounded-[4px] border-[1px] border-[#B8B8B8] bg-transparent px-[12px] pr-[32px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
              />
              <button className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-black">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5C5.63636 5 2 12 2 12C2 12 5.63636 19 12 19C18.3636 19 22 12 22 12C22 12 18.3636 5 12 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <p className="font-afacad text-[12px] text-[#A1A1AA] mt-[4px]">Must be at least 8 characters.</p>
          </div>
        </div>

        {/* CTA Button */}
        <button className="w-full h-[42px] rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity mt-[20px]">
          Set New Password
        </button>

        {/* Footer Text */}
        <div className="text-center mt-[12px]">
          <p className="font-afacad font-normal text-[13px] text-[#A1A1AA]">
            Remember your password? <Link href="/login" className="font-semibold text-[#D94A1E] hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
