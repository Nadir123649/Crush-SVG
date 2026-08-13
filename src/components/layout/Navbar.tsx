import React from "react";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/images";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  return (
    <div className="w-full bg-[#FFFCFA] flex justify-center pt-[40px] pb-[10px] px-[80px] z-50 relative">
      <nav className="w-full max-w-[1280px] flex items-center justify-between h-[42px]">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-[10px]">
        <Image 
          src={IMAGES.logo} 
          alt="CrushSVG Icon" 
          width={42} 
          height={41.11} 
          className="object-contain"
        />
        <div className="font-heading font-semibold text-[26px] leading-[18.67px] tracking-[0%] flex items-center">
          <span className="text-text-dark">Crush</span>
          <span className="text-brand-primary">SVG</span>
        </div>
      </Link>

      {/* Right Side Links & Buttons */}
      <div className="flex items-center gap-[24px]">
        <Link 
          href="/help" 
          className="font-body font-semibold text-[16px] leading-[18.67px] tracking-[0.06em] text-text-body underline decoration-solid underline-offset-4 hover:text-text-dark transition-colors"
        >
          Need Help?
        </Link>
        
        <div className="flex items-center gap-[16px]">
          <Link href="/login">
            <Button variant="outline" className="w-[139px] h-[42px] bg-[#FFFFFF]">
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="solid" className="w-[139px] h-[42px]">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </nav>
    </div>
  );
}
