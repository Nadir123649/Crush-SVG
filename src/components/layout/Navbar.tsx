import React from "react";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/images";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  return (
    <div className="w-full bg-[#FFFCFA] flex justify-center pt-[24px] md:pt-[40px] pb-[10px] px-[16px] md:px-[80px] z-50 relative">
      <nav className="w-full max-w-[1280px] flex items-center justify-between h-[32px] md:h-[42px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-[4px] md:gap-[10px]">
          <Image
            src={IMAGES.logo}
            alt="CrushSVG Icon"
            width={32}
            height={31.3}
            className="object-contain w-[32px] h-[31.3px] md:w-[42px] md:h-[41.11px]"
          />
          <div className="font-heading font-semibold text-[20px] md:text-[26px] leading-[18.67px] tracking-[0%] flex items-center">
            <span className="text-text-dark">Crush</span>
            <span className="text-brand-primary">SVG</span>
          </div>
        </Link>

        {/* Right Side Links & Buttons */}
        <div className="flex items-center gap-[14px] md:gap-[24px]">
          <Link
            href="/help"
            className="hidden md:inline-block font-body font-semibold text-[16px] leading-[18.67px] tracking-[0.06em] text-text-body underline decoration-solid underline-offset-4 hover:text-text-dark transition-colors"
          >
            Need Help?
          </Link>

          <div className="flex items-center gap-[14px] md:gap-[16px]">
            <Link href="/login">
              <Button variant="outline" className="w-[80px] h-[32px] rounded-[8px] text-[14px] md:w-[139px] md:h-[42px] md:rounded-[12px] md:text-[16px] bg-[#FFFFFF] px-[0px]">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="solid" className="w-[80px] h-[32px] rounded-[8px] text-[14px] md:w-[139px] md:h-[42px] md:rounded-[12px] md:text-[16px] px-[0px]">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
