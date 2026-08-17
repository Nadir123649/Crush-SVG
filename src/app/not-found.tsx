import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="w-full flex flex-col items-center py-[100px] text-center px-[24px]">
      <p className="font-heading font-bold text-[64px] leading-[100%] text-brand-primary">404</p>
      <h1 className="font-heading font-bold text-[28px] leading-[100%] text-[#353A3E] mt-[16px]">Page not found</h1>
      <p className="font-body font-normal text-[15px] text-[#64748B] mt-[12px] max-w-[400px] leading-[22px]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="h-[42px] px-[24px] mt-[28px] rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-body font-medium text-[15px] flex items-center hover:opacity-90 transition-opacity"
      >
        Back to converter
      </Link>
    </div>
  );
}
