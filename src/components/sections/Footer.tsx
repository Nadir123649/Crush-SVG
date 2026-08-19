"use client";

import React from "react";
import Image from "next/image";
import { IMAGES } from "@/lib/images";
import Link from "next/link";

export function Footer() {
  const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      e.preventDefault();
      const element = document.getElementById(hash.replace("#", ""));
      if (element) {
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const computedStyle = window.getComputedStyle(element);
        const scrollMarginTop = parseFloat(computedStyle.scrollMarginTop) || 0;
        
        window.scrollTo({
          top: elementPosition - scrollMarginTop,
          behavior: "smooth"
        });
        window.history.pushState(null, "", `/${hash}`);
      }
    }
  };

  const handlePageClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (typeof window !== "undefined" && window.location.pathname === href) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="w-full bg-[#FCF1ED] flex flex-col items-center pt-[40px] md:pt-[60px] pb-[20px] px-[16px] md:px-[40px] lg:px-[80px]">
      <div className="w-full max-w-[1280px] flex flex-col lg:flex-row justify-between items-center lg:items-start gap-[32px] lg:gap-0">
        
        {/* Left: Logo & Desc */}
        <div className="flex flex-col items-center lg:items-start w-full md:w-[400px] lg:w-[276px] gap-[12px] text-center lg:text-left">
          <Link href="/" className="flex items-center gap-[10px]">
            <Image 
              src={IMAGES.logo} 
              alt="CrushSVG Icon" 
              width={42} 
              height={41.11} 
              className="object-contain"
              style={{ width: 'auto', height: 'auto' }}
            />
            <div className="font-heading font-semibold text-[26px] leading-[18.67px] tracking-[0%] flex items-center">
              <span className="text-text-dark">Crush</span>
              <span className="text-brand-primary">SVG</span>
            </div>
          </Link>
          <p className="font-body font-normal text-[13px] md:text-[14px] leading-[125%] text-[#4B5563] mt-[4px] md:mt-[8px]">
            From SVG to PNG, Exactly as Intended.<br className="hidden md:inline" />
            Convert, optimize, and ship pixel-perfect assets.
          </p>
        </div>

        {/* Engineered For Quality (Shown in middle on mobile/tablet) */}
        <div className="flex flex-col items-center lg:hidden w-full gap-[12px] text-center">
          <h4 className="font-heading font-bold text-[12px] leading-[120%] text-[#353A3E]">Engineered For Quality</h4>
          <div className="flex flex-wrap justify-center gap-[8px]">
            <div className="h-[32px] px-[10px] bg-white rounded-[4px] border border-[#EAEAEA] flex items-center justify-center gap-[6px]">
              <div className="w-[6px] h-[6px] rounded-full bg-[#D94A1E]"></div>
              <span className="font-body text-[11px] font-medium text-[#4B5563]">Browser Based</span>
            </div>
            <div className="h-[32px] px-[10px] bg-white rounded-[4px] border border-[#EAEAEA] flex items-center justify-center gap-[6px]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="4.5" cy="4.5" r="3" fill="#D94A1E" fillOpacity="0.3" />
                <circle cx="8" cy="8" r="3" fill="#D94A1E" />
              </svg>
              <span className="font-body text-[11px] font-medium text-[#4B5563]">Transparent PNG</span>
            </div>
            <div className="h-[32px] px-[10px] bg-white rounded-[4px] border border-[#EAEAEA] flex items-center justify-center gap-[6px]">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.66667 11.0833L1.16667 7.58333L2.33333 6.41667L4.66667 8.75L11.6667 1.75L12.8333 2.91667L4.66667 11.0833Z" fill="#D94A1E"/>
              </svg>
              <span className="font-body text-[11px] font-medium text-[#4B5563]">No Install</span>
            </div>
          </div>
        </div>

        {/* Middle: Links */}
        <div className="flex flex-col md:flex-row gap-[24px] md:gap-[54px] ml-0 lg:ml-[80px] items-center text-center md:text-left">
          {/* Column 1 */}
          <div className="flex flex-col items-center md:items-start w-auto md:w-[127px] gap-[12px] md:gap-[16px]">
            <h4 className="font-heading font-bold text-[14px] leading-[100%] text-[#353A3E] mb-[4px]">Explore</h4>
            <Link href="/#converter" onClick={(e) => handleHashClick(e, '#converter')} className="font-body font-normal text-[13px] md:text-[14px] leading-[100%] text-[#4B5563] hover:text-brand-primary transition-colors">SVG to PNG Converter</Link>
            <Link href="/#features" onClick={(e) => handleHashClick(e, '#features')} className="font-body font-normal text-[13px] md:text-[14px] leading-[100%] text-[#4B5563] hover:text-brand-primary transition-colors">Features</Link>
            <Link href="/#how-it-works" onClick={(e) => handleHashClick(e, '#how-it-works')} className="font-body font-normal text-[13px] md:text-[14px] leading-[100%] text-[#4B5563] hover:text-brand-primary transition-colors">How It Works</Link>
          </div>
          {/* Column 2 */}
          <div className="flex flex-col items-center md:items-start w-auto md:w-[127px] gap-[12px] md:gap-[16px]">
            <h4 className="font-heading font-bold text-[14px] leading-[100%] text-[#353A3E] mb-[4px]">Resources</h4>
            <Link href="/svg-guides" onClick={(e) => handlePageClick(e, '/svg-guides')} className="font-body font-normal text-[13px] md:text-[14px] leading-[100%] text-[#4B5563] hover:text-brand-primary transition-colors">SVG Guides</Link>
            <Link href="/#faq" onClick={(e) => handleHashClick(e, '#faq')} className="font-body font-normal text-[13px] md:text-[14px] leading-[100%] text-[#4B5563] hover:text-brand-primary transition-colors">FAQ</Link>
            <Link href="/contact-us" onClick={(e) => handlePageClick(e, '/contact-us')} className="font-body font-normal text-[13px] md:text-[14px] leading-[100%] text-[#4B5563] hover:text-brand-primary transition-colors">Contact</Link>
          </div>
          {/* Column 3 */}
          <div className="flex flex-col items-center md:items-start w-auto md:w-[127px] gap-[12px] md:gap-[16px]">
            <h4 className="font-heading font-bold text-[14px] leading-[100%] text-[#353A3E] mb-[4px]">Company</h4>
            <Link href="/about" onClick={(e) => handlePageClick(e, '/about')} className="font-body font-normal text-[13px] md:text-[14px] leading-[100%] text-[#4B5563] hover:text-brand-primary transition-colors">About Us</Link>
            <Link href="/cookies" onClick={(e) => handlePageClick(e, '/cookies')} className="font-body font-normal text-[13px] md:text-[14px] leading-[100%] text-[#4B5563] hover:text-brand-primary transition-colors">Cookies</Link>
            <Link href="/terms" onClick={(e) => handlePageClick(e, '/terms')} className="font-body font-normal text-[13px] md:text-[14px] leading-[100%] text-[#4B5563] hover:text-brand-primary transition-colors">Terms of Service</Link>
          </div>
        </div>

        {/* Right: Engineered For Quality (Desktop only) */}
        <div className="hidden lg:flex flex-col w-[340px] gap-[21px]">
          <h4 className="font-heading font-bold text-[12px] leading-[120%] text-[#353A3E] text-center">Engineered For Quality</h4>
          
          {/* 3 Quality Badges */}
          <div className="flex justify-center gap-[12px]">
            <div className="h-[39px] px-[12px] bg-white rounded-[4px] border border-[#EAEAEA] flex items-center justify-center gap-[8px]">
              <div className="w-[6px] h-[6px] rounded-full bg-[#D94A1E]"></div>
              <span className="font-body text-[11px] font-medium text-[#4B5563]">Browser Based</span>
            </div>
            <div className="h-[39px] px-[12px] bg-white rounded-[4px] border border-[#EAEAEA] flex items-center justify-center gap-[8px]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="4.5" cy="4.5" r="3" fill="#D94A1E" fillOpacity="0.3" />
                <circle cx="8" cy="8" r="3" fill="#D94A1E" />
              </svg>
              <span className="font-body text-[11px] font-medium text-[#4B5563]">Transparent PNG</span>
            </div>
            <div className="h-[39px] px-[12px] bg-white rounded-[4px] border border-[#EAEAEA] flex items-center justify-center gap-[8px]">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.66667 11.0833L1.16667 7.58333L2.33333 6.41667L4.66667 8.75L11.6667 1.75L12.8333 2.91667L4.66667 11.0833Z" fill="#D94A1E"/>
              </svg>
              <span className="font-body text-[11px] font-medium text-[#4B5563]">No Install</span>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center gap-[24px] mt-[12px]">
            <Link href="#" className="hover:opacity-80 transition-opacity">
              <Image src={IMAGES.facebook} alt="Facebook" width={16} height={16} className="h-[16px] w-auto object-contain" style={{ width: 'auto', height: 'auto' }} />
            </Link>
            <Link href="#" className="hover:opacity-80 transition-opacity">
              <Image src={IMAGES.instagram} alt="Instagram" width={16} height={16} className="h-[16px] w-auto object-contain" style={{ width: 'auto', height: 'auto' }} />
            </Link>
            <Link href="#" className="hover:opacity-80 transition-opacity">
              <Image src={IMAGES.linkedin} alt="LinkedIn" width={16} height={16} className="h-[16px] w-auto object-contain" style={{ width: 'auto', height: 'auto' }} />
            </Link>
          </div>
        </div>

        {/* Mobile/Tablet Social Section */}
        <div className="flex flex-col lg:hidden w-full items-center">
          {/* Divider Above Social Icons (Mobile) */}
          <div className="w-full h-[1px] bg-[#353A3E] opacity-10 mb-[16px]"></div>

          {/* Social Icons (Mobile) */}
          <div className="flex justify-center gap-[24px]">
            <Link href="#" className="hover:opacity-80 transition-opacity">
              <Image src={IMAGES.facebook} alt="Facebook" width={16} height={16} className="h-[16px] w-auto object-contain" style={{ width: 'auto', height: 'auto' }} />
            </Link>
            <Link href="#" className="hover:opacity-80 transition-opacity">
              <Image src={IMAGES.instagram} alt="Instagram" width={16} height={16} className="h-[16px] w-auto object-contain" style={{ width: 'auto', height: 'auto' }} />
            </Link>
            <Link href="#" className="hover:opacity-80 transition-opacity">
              <Image src={IMAGES.linkedin} alt="LinkedIn" width={16} height={16} className="h-[16px] w-auto object-contain" style={{ width: 'auto', height: 'auto' }} />
            </Link>
          </div>
        </div>

      </div>

      {/* Divider */}
      <div className="w-full max-w-[1280px] h-[1px] bg-[#353A3E] opacity-10 mt-[12px] md:mt-[60px] mb-[16px] md:mb-[20px]"></div>

      {/* Bottom Footer */}
      <div className="w-full max-w-[1280px] flex flex-col-reverse md:flex-row justify-between items-center gap-[16px] md:gap-0 mb-[10px] text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-[8px] md:gap-[12px]">
          <span className="font-body font-normal text-[12px] leading-[100%] text-[#4B5563]">
            © 2026 CrushSVG. All rights reserved.
          </span>
          <span className="hidden md:inline font-body font-normal text-[12px] leading-[100%] text-[#4B5563]">|</span>
          <span className="font-body font-normal text-[12px] leading-[100%] text-[#4B5563]">
            Powered by <a href="https://www.thenevon.com/" target="_blank" rel="noopener noreferrer" className="text-brand-primary cursor-pointer hover:opacity-80 transition-opacity">@The Nevon</a>
          </span>
        </div>
        <div className="font-body font-normal text-[12px] leading-[100%] text-[#4B5563] flex items-center">
          <Link href="/terms" onClick={(e) => handlePageClick(e, '/terms')} className="hover:text-brand-primary transition-colors">Terms</Link>
          <span className="mx-[8px]">•</span>
          <Link href="/privacy-policy" onClick={(e) => handlePageClick(e, '/privacy-policy')} className="hover:text-brand-primary transition-colors">Privacy</Link>
          <span className="mx-[8px]">•</span>
          <Link href="/contact-us" onClick={(e) => handlePageClick(e, '/contact-us')} className="hover:text-brand-primary transition-colors">Support</Link>
        </div>
      </div>
    </footer>
  );
}
