import React from "react";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/images";
import { Button } from "@/components/ui/Button";

interface VerificationModalProps {
  onClose?: () => void;
}

export function VerificationModal({ onClose }: VerificationModalProps) {
  return (
    <div className="relative w-full max-w-[440px] h-auto min-h-[463px] pb-[30px] md:h-[463px] md:pb-0 px-[16px] md:px-0 bg-[#FFFCFA] rounded-[8px] flex flex-col items-center overflow-hidden" style={{ boxShadow: "0px 4px 50px rgba(0, 0, 0, 0.08)" }}>
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-[20px] right-[20px] text-[#4B5563] hover:opacity-70 transition-opacity"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Logo */}
      <div className="flex items-center gap-[4px] mt-[59px]">
        <Image 
          src={IMAGES.logo} 
          alt="CrushSVG Icon" 
          width={26} 
          height={26} 
          className="object-contain"
        />
        <div className="font-heading font-semibold text-[16px] leading-[100%] tracking-[0%] flex items-center">
          <span className="text-text-dark">Crush</span>
          <span className="text-[#D94A1E]">SVG</span>
        </div>
      </div>

      {/* Heading */}
      <h2 className="font-heading font-bold text-[28px] md:text-[34px] leading-[100%] text-[#D94A1E] text-center mt-[20px] px-[16px]">
        Verification Complete
      </h2>

      {/* Verification Image */}
      <div className="mt-[15px]">
        <Image 
          src={IMAGES.verification}
          alt="Verification Success"
          width={206}
          height={98}
          className="object-contain"
        />
      </div>

      {/* Text Body */}
      <p className="font-body font-normal text-[14px] leading-[125%] text-[#4B5563] text-center w-full max-w-[294px] px-[16px] mt-[39px]">
        Your email has been verified successfully. Click the button below to continue.
      </p>

      {/* CTA Button */}
      <Button variant="solid" className="w-[238px] h-[42px] mt-[25px]">
        Go To CrushSVG
      </Button>
    </div>
  );
}
