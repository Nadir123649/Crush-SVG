"use client";

import React, { useState } from "react";
import Link from "next/link";

export function ResetPasswordCard() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="w-full max-w-[440px] h-auto min-h-[400px] bg-[#FFFCFA] rounded-[8px] p-[24px_16px] sm:p-[24px_32px] shadow-[0px_4px_44px_0px_rgba(0,0,0,0.06)] flex flex-col mx-auto border-[1px] border-[#F2EDE8] relative">

      <div className="flex flex-col w-full max-w-[376px] gap-[16px] mx-auto relative mt-[4px]">
        
        {/* Header Text */}
        <div className="flex flex-col gap-[8px] items-center text-center">
          <h2 className="font-bricolage text-[20px] font-bold text-[#000000] leading-[1]">
            Create New Password
          </h2>
          <p className="font-afacad text-[14px] text-[#4B5563]">
            Your new password must be different from previously used passwords.
          </p>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-[12px] mt-[4px]">
          <div className="flex flex-col gap-[4px]">
            <label className="font-afacad text-[14px] font-semibold text-[#D94A1E]">New Password</label>
            <div className="relative w-full">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter new password"
                className="w-full h-[32px] rounded-[4px] border-[1px] border-[#B8B8B8] bg-transparent px-[12px] pr-[32px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
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
            <p className="font-afacad text-[12px] text-[#A1A1AA] mt-[4px]">Must be at least 8 characters.</p>
          </div>

          <div className="flex flex-col gap-[4px]">
            <label className="font-afacad text-[14px] font-semibold text-[#D94A1E]">Confirm Password</label>
            <div className="relative w-full">
              <input 
                type={showConfirm ? "text" : "password"} 
                placeholder="Re-enter your new password"
                className="w-full h-[32px] rounded-[4px] border-[1px] border-[#B8B8B8] bg-transparent px-[12px] pr-[32px] font-afacad text-[14px] outline-none focus:border-[#D94A1E] placeholder:text-[#AEAEAE]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-black flex items-center justify-center w-[20px] h-[20px]"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {!showConfirm ? (
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
