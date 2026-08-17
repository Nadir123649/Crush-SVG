import React from "react";
import Link from "next/link";

export function ForgotPasswordCard() {
  return (
    <div className="w-full max-w-[440px] h-auto min-h-[270px] bg-[#FFFCFA] rounded-[8px] p-[24px_16px] sm:p-[24px_32px] shadow-[0px_4px_44px_0px_rgba(0,0,0,0.06)] flex flex-col mx-auto border-[1px] border-[#F2EDE8] relative">

      <div className="flex flex-col w-full max-w-[376px] gap-[16px] mx-auto relative mt-[4px]">
        
        {/* Header Text */}
        <div className="flex flex-col gap-[8px] items-center text-center">
          <h2 className="font-bricolage text-[20px] font-bold text-[#000000] leading-[1]">
            Forgot Your Password ?
          </h2>
          <p className="font-afacad text-[14px] text-[#4B5563]">
            Enter your email address below and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {/* Input */}
        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <label className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Email</label>
            <input 
              type="email" 
              placeholder="Enter your email"
              className="w-full h-[32px] rounded-[4px] border-[1px] border-[#C1C1C1] bg-transparent px-[12px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
            />
          </div>
        </div>

        {/* CTA Button */}
        <button className="w-full h-[42px] rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity">
          Send Reset Link
        </button>

        {/* Footer Text */}
        <div className="text-center mt-[-8px]">
          <p className="font-afacad font-normal text-[11px] text-[#4B5563]">
            Remember your password? <Link href="/login" className="font-semibold text-[#D94A1E] hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
