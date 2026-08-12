"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { IMAGES } from "@/lib/images";
import { Button } from "@/components/ui/Button";

const WIDTH_OPTIONS = ["120px", "240px", "480px", "720px", "1080px", "1920px", "2560px", "3840px"];
const SCALE_OPTIONS = ["1x", "2x", "3x", "4x", "5x", "8x", "10x", "16x"];

export function ConverterUI() {
  const [openDropdown, setOpenDropdown] = useState<"width" | "scale" | null>(null);
  const [selectedWidth, setSelectedWidth] = useState("480px");
  const [selectedScale, setSelectedScale] = useState("2x");
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="w-full max-w-[1280px] mx-auto mt-[48px] mb-[100px]">
      {/* Outer Dashed Border Box */}
      <div className="w-full h-[650.67px] border border-dashed border-[#8F8F8F] rounded-[32px] p-[12px]">
        
        {/* Inner Dashed Border Box */}
        <div className="w-full h-[626.23px] bg-[#FFFFFF] border border-dashed border-[#8F8F8F] rounded-[24px] flex justify-center px-[40px] pt-[20px] pb-[20px] gap-[30px]">
          
          {/* Left Column (SVG Code) */}
          <div className="w-[536.9px] flex flex-col">
            <h2 className="font-heading font-semibold text-[16px] mb-[12px]" style={{ color: "#64748B" }}>
              SVG Code
            </h2>
            
            {/* SVG Code Box */}
            <div className="w-full h-[302px] rounded-[16px] border border-[#8F8F8F] p-[24px] overflow-hidden">
              <pre className="font-body font-normal text-[16px] leading-[18.67px] text-[#D2D2D2] whitespace-pre-wrap">
{`<svg
xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 120 120">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="104" height="104" rx="24" fill="url(#g)"/>
</svg>`}
              </pre>
            </div>

            {/* Drag & Drop Upload Box */}
            <div className="w-full h-[167px] rounded-[16px] border border-[#8F8F8F] mt-[16px] flex flex-col items-center justify-center gap-[10px] p-[40px] cursor-pointer hover:bg-gray-50 transition-colors">
              <Image src={IMAGES.drag} alt="Drag Cloud" width={64} height={64} className="object-contain" />
              <div className="font-body text-[16px] leading-[18.67px] text-text-dark">
                <span className="font-normal">Drag & Drop or </span>
                <span className="font-medium text-brand-primary">Select SVG</span>
              </div>
            </div>

            {/* Bottom Source Text */}
            <p className="font-body font-normal text-[14px] text-[#64748B] mt-[16px] ml-[24px]">
              Source size: 240 x 160 px (aspect ratio 1.500)
            </p>
          </div>

          {/* Right Column (Live Preview) */}
          <div className="w-[536.9px] flex flex-col">
            <h2 className="font-heading font-semibold text-[16px] mb-[12px]" style={{ color: "#64748B" }}>
              Live Preview
            </h2>
            
            {/* Live Preview Box */}
            <div className="w-full h-[302px] rounded-[16px] border border-[#8F8F8F] flex items-center justify-center relative overflow-hidden bg-gray-50/30">
               {/* Live Preview Image Placeholder */}
               <Image src={IMAGES.uploadImage} alt="Live Preview Placeholder" width={100} height={100} className="object-contain" />
            </div>

            {/* Settings & Controls */}
            <div className="w-full mt-[20px]" ref={dropdownRef}>
              {/* Dropdowns Row */}
              <div className="flex gap-[20px] w-full">
                
                {/* Width Input */}
                <div className="flex flex-col flex-1 gap-[8px] relative">
                  <label className="text-[#64748B] font-heading font-semibold text-[16px] leading-[18.67px]">Width (px)</label>
                  <div 
                    onClick={() => setOpenDropdown(openDropdown === "width" ? null : "width")}
                    className="h-[60px] rounded-[12px] border border-[#8F8F8F] px-[16px] flex items-center justify-between cursor-pointer bg-white"
                  >
                    <span className="font-body font-medium text-[18px] text-[#353A3E]">{selectedWidth}</span>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform duration-200 ${openDropdown === "width" ? "rotate-180" : ""}`}>
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="#353A3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  
                  {/* Width Dropdown Menu */}
                  {openDropdown === "width" && (
                    <div className="absolute top-[90px] left-0 w-full max-h-[200px] overflow-y-auto bg-white border border-[#8F8F8F] rounded-[12px] shadow-lg z-10 py-[8px]">
                      {WIDTH_OPTIONS.map((opt) => (
                        <div 
                          key={opt}
                          onClick={() => { setSelectedWidth(opt); setOpenDropdown(null); }}
                          className="px-[16px] py-[10px] font-body text-[16px] text-[#353A3E] hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scale Input */}
                <div className="flex flex-col flex-1 gap-[8px] relative">
                  <label className="text-[#64748B] font-heading font-semibold text-[16px] leading-[18.67px]">Scale</label>
                  <div 
                    onClick={() => setOpenDropdown(openDropdown === "scale" ? null : "scale")}
                    className="h-[60px] rounded-[12px] border border-[#8F8F8F] px-[16px] flex items-center justify-between cursor-pointer bg-white"
                  >
                    <span className="font-body font-medium text-[18px] text-[#353A3E]">{selectedScale}</span>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform duration-200 ${openDropdown === "scale" ? "rotate-180" : ""}`}>
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="#353A3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  
                  {/* Scale Dropdown Menu */}
                  {openDropdown === "scale" && (
                    <div className="absolute top-[90px] left-0 w-full max-h-[200px] overflow-y-auto bg-white border border-[#8F8F8F] rounded-[12px] shadow-lg z-10 py-[8px]">
                      {SCALE_OPTIONS.map((opt) => (
                        <div 
                          key={opt}
                          onClick={() => { setSelectedScale(opt); setOpenDropdown(null); }}
                          className="px-[16px] py-[10px] font-body text-[16px] text-[#353A3E] hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Transparent Background Box */}
              <label className="w-full h-[60px] rounded-[12px] border border-[#8F8F8F] mt-[16px] px-[16px] flex items-center justify-between cursor-pointer hover:bg-gray-50">
                <span className="font-body font-normal text-[20px] leading-[18.67px] text-[#353A3E]">
                  Transparent Background
                </span>
                <input 
                  type="checkbox" 
                  className="w-[20px] h-[20px] rounded border-[#8F8F8F] accent-brand-primary cursor-pointer" 
                />
              </label>

              {/* Download Button Row - Centered */}
              <div className="flex justify-center mt-[16px]">
                <Button className="h-[42px] px-[32px] rounded-[12px] gap-[8px]">
                  <Image src={IMAGES.exportIcon} alt="Download" width={18} height={18} className="brightness-0 invert" />
                  Download PNG
                </Button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
