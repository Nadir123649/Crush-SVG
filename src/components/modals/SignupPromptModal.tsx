"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/shared/images";

interface SignupPromptModalProps {
  onClose: () => void;
}

export function SignupPromptModal({ onClose }: SignupPromptModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-[16px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-prompt-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-[440px] bg-[#FFFCFA] rounded-[8px] flex flex-col items-center overflow-hidden px-[32px] pb-[32px]"
        style={{ boxShadow: "0px 4px 50px rgba(0, 0, 0, 0.08)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-[16px] right-[16px] w-[24px] h-[24px] flex items-center justify-center text-[#64748B] hover:text-[#333333] transition-colors"
          aria-label="Close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="flex items-center gap-[4px] mt-[40px]">
          <Image src={IMAGES.logo} alt="CrushSVG Icon" width={26} height={26} className="object-contain" />
          <div className="font-heading font-semibold text-[16px] leading-[100%] flex items-center">
            <span className="text-text-dark">Crush</span>
            <span className="text-[#D94A1E]">SVG</span>
          </div>
        </div>

        <h2 id="signup-prompt-title" className="font-heading font-bold text-[30px] leading-[110%] text-[#D94A1E] text-center mt-[20px]">
          You&apos;ve used your 3 free conversions
        </h2>

        <p className="font-body font-normal text-[14px] leading-[150%] text-[#4B5563] text-center mt-[12px]">
          Create a free account for unlimited conversions. Your current design stays right here.
        </p>

        <Link
          href="/signup"
          onClick={onClose}
          className="w-full h-[46px] mt-[24px] flex items-center justify-center rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-body font-medium text-[16px] hover:opacity-90 transition-opacity"
        >
          Sign up free
        </Link>

        <Link
          href="/login"
          onClick={onClose}
          className="w-full h-[46px] mt-[12px] flex items-center justify-center rounded-[12px] border border-[#D94A1E] text-[#D94A1E] font-body font-medium text-[16px] hover:opacity-80 transition-opacity"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
