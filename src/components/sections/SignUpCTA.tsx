"use client";

import React from "react";
import Image from "next/image";
import { IMAGES } from "@/lib/images";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/lib/client/auth-context";

export function SignUpCTA() {
  const { status } = useAuth();

  // If user is authenticated, they don't need the signup CTA
  if (status === "authed") {
    return null;
  }
  return (
    <section className="w-full flex justify-center mb-[60px] md:mb-[100px]">
      <div className="w-full max-w-[1280px] flex flex-col lg:flex-row justify-between items-center gap-[40px]">

        {/* Left Column */}
        <div className="w-full max-w-[361px] lg:max-w-[600px] flex flex-col gap-[16px] lg:gap-[24px]">
          <h2 className="font-heading font-semibold text-[24px] leading-[30px] lg:text-[48px] lg:leading-[58px] tracking-[0.04em] text-text-dark text-center lg:text-left">
            Start free today.<br className="hidden lg:inline" />{" "}
            <span className="text-[#DA582D]">No credit card</span> required.
          </h2>
          <p className="font-body font-normal text-[14px] lg:text-[16px] leading-[18.67px] text-text-muted text-center lg:text-left">
            Enjoy 3 free conversions with no signup required. When you&apos;re ready for more, create a<br className="hidden lg:inline" />{" "}
            free account to unlock unlimited access.
          </p>

          {/* Timeline / Points */}
          <div className="w-full max-w-[273px] lg:max-w-none bg-white lg:bg-transparent rounded-[8px] lg:rounded-none border border-[#E5E5E5] lg:border-none pt-[24px] px-[20px] pb-[24px] lg:p-0 flex flex-col gap-[18px] relative mt-[10px] mx-auto lg:mx-0">
            {/* Vertical Dashed Line */}
            <div className="absolute left-[29px] lg:left-[17.5px] top-[38px] lg:top-[14px] bottom-[44px] lg:bottom-[20px] w-[1px] border-l border-dashed border-[#D0D0D0] z-0"></div>

            {/* Point 1 */}
            <div className="flex items-center gap-[18px] z-10 relative">
              <div className="w-[18px] h-[18px] rounded-full bg-[#FCF1ED] flex items-center justify-center shrink-0">
                <div className="w-[10px] h-[10px] rounded-full border-[1px] border-brand-primary flex items-center justify-center">
                  <div className="w-[1.8px] h-[1.8px] rounded-full bg-brand-primary"></div>
                </div>
              </div>
              <span className="font-heading font-medium text-[14px] leading-[18.67px] tracking-[0.04em] text-text-dark">
                3 Free Conversions Left
              </span>
            </div>

            {/* Point 2 */}
            <div className="flex items-center gap-[18px] z-10 relative">
              <div className="w-[18px] h-[18px] rounded-full bg-[#FCF1ED] flex items-center justify-center shrink-0">
                <div className="w-[10px] h-[10px] rounded-full border-[1px] border-brand-primary flex items-center justify-center">
                  <div className="w-[1.8px] h-[1.8px] rounded-full bg-brand-primary"></div>
                </div>
              </div>
              <span className="font-heading font-medium text-[14px] leading-[18.67px] tracking-[0.04em] text-text-dark">
                2 Free Conversions Left
              </span>
            </div>

            {/* Point 3 */}
            <div className="flex items-center gap-[18px] z-10 relative">
              <div className="w-[18px] h-[18px] rounded-full bg-[#FCF1ED] flex items-center justify-center shrink-0">
                <div className="w-[10px] h-[10px] rounded-full border-[1px] border-brand-primary flex items-center justify-center">
                  <div className="w-[1.8px] h-[1.8px] rounded-full bg-brand-primary"></div>
                </div>
              </div>
              <span className="font-heading font-medium text-[14px] leading-[18.67px] tracking-[0.04em] text-text-dark">
                Last Free Conversion
              </span>
            </div>

            {/* Point 4 Active */}
            <div className="flex items-center gap-[18px] z-10 relative">
              <div className="w-[18px] h-[18px] rounded-full bg-brand-primary flex items-center justify-center shrink-0">
                <div className="w-[10px] h-[10px] rounded-full border-[1px] border-white flex items-center justify-center">
                  <div className="w-[1.8px] h-[1.8px] rounded-full bg-white"></div>
                </div>
              </div>
              <span className="font-heading font-medium text-[14px] leading-[18.67px] tracking-[0.04em] text-brand-primary">
                Sign Up For Free
              </span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full max-w-[361px] lg:max-w-[445px] h-auto lg:h-[470px] p-[15px] lg:p-0 bg-[#FAF6F3] rounded-[12px] border border-[#E5E5E5] lg:border-[#EAEAEA] flex items-center justify-center">
          <div className="w-full max-w-[331px] lg:max-w-[380px] h-auto lg:h-[406px] p-[24px] lg:pt-[40px] lg:px-[24px] lg:pb-[24px] bg-[#FFFFFF] rounded-[12px] border-none flex flex-col items-center">

            {/* User Icon */}
            <Image src={IMAGES.profile} alt="Profile Icon" width={24} height={24} className="mb-[12px] lg:mb-[16px]" />

            <h3 className="font-heading font-semibold text-[16px] lg:text-[18px] leading-[22px] lg:leading-[24px] tracking-[0.04em] text-center text-text-dark mb-[10px]">
              You&apos;ve used your 3 free<br />conversions
            </h3>

            <p className="font-body font-normal text-[13px] lg:text-[14px] leading-[18.67px] text-center text-text-muted mb-[16px] lg:mb-[26px]">
              Create a free account to keep converting. No credit card<br className="hidden lg:inline" /> required ever.
            </p>

            <div className="flex flex-col w-full gap-[10px]">
              <Link href="/signup" className="w-full">
                <Button className="w-full h-[32px] rounded-[8px] px-[10px]">Sign Up</Button>
              </Link>
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full h-[32px] rounded-[8px] px-[10px]">Log In</Button>
              </Link>
            </div>

            <p className="font-body font-normal text-[11px] lg:text-[12px] leading-[16px] lg:leading-[18.67px] text-center text-[#A1A1AA] mt-[16px] lg:mt-[26px]">
              Your SVG code is safe. It stays in this session until you finish<br className="hidden lg:inline" /> signing up.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
