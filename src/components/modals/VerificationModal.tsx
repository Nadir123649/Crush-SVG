import React from "react";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/images";
import { Button } from "@/components/ui/Button";

interface VerificationModalProps {
  variant?: "success" | "invalid";
  onClose?: () => void;
  onContinue?: () => void;
}

export function VerificationModal({ variant = "success", onClose, onContinue }: VerificationModalProps) {
  const isSuccess = variant === "success";

  return (
    <div className="relative w-full max-w-[440px] h-auto min-h-[463px] pb-[30px] md:h-[463px] md:pb-0 px-[16px] md:px-0 bg-[#FFFCFA] rounded-[8px] flex flex-col items-center overflow-hidden" style={{ boxShadow: "0px 4px 50px rgba(0, 0, 0, 0.08)" }}>


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
        {isSuccess ? "Verification Complete" : "Link Invalid or Expired"}
      </h2>

      <div className="mt-[15px]">
        <Image
          src={isSuccess ? IMAGES.verification : IMAGES.lock}
          alt=""
          width={isSuccess ? 206 : 98}
          height={isSuccess ? 98 : 98}
          className="object-contain"
        />
      </div>

      {/* Text Body */}
      <p className="font-body font-normal text-[14px] leading-[125%] text-[#4B5563] text-center w-full max-w-[294px] px-[16px] mt-[39px]">
        {isSuccess
          ? "Your email has been verified successfully. Click the button below to continue."
          : "This verification link is invalid or has expired. You can request a new one from the sign-up flow."}
      </p>

      {isSuccess && (
        <Button variant="solid" className="w-[238px] h-[42px] mt-[25px]" onClick={onContinue}>
          Go To CrushSVG
        </Button>
      )}
      {!isSuccess && (
        <Link
          href="/signup"
          className="w-[238px] h-[42px] mt-[25px] flex items-center justify-center rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-body font-medium text-[16px] hover:opacity-90 transition-opacity"
        >
          Create an account
        </Link>
      )}
    </div>
  );
}
