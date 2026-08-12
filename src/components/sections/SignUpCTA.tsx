import React from "react";
import Image from "next/image";
import { IMAGES } from "@/lib/images";
import { Button } from "@/components/ui/Button";

export function SignUpCTA() {
  return (
    <section className="w-full flex justify-center mb-[100px]">
      <div className="w-full max-w-[1280px] flex justify-between items-center">
        
        {/* Left Column */}
        <div className="w-[600px] flex flex-col gap-[24px]">
          <h2 className="font-heading font-semibold text-[48px] leading-[58px] tracking-[0.04em] text-text-dark">
            Start free today.<br />
            <span className="text-[#DA582D]">No credit card</span> required.
          </h2>
          <p className="font-body font-normal text-[16px] leading-[18.67px] text-text-muted">
            Enjoy 3 free conversions with no signup required. When you&apos;re ready for more, create a<br />
            free account to unlock unlimited access.
          </p> 

          {/* Timeline / Points */}
          <div className="flex flex-col gap-[18px] relative pl-[9px] mt-[10px]">
            {/* Vertical Dashed Line */}
            <div className="absolute left-[17.5px] top-[14px] bottom-[20px] w-[1px] border-l border-dashed border-[#D0D0D0] z-0"></div>

            {/* Point 1 */}
            <div className="flex items-center gap-[18px] z-10 relative">
              <div className="w-[18px] h-[18px] rounded-full bg-[#FCF1ED] flex items-center justify-center">
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
              <div className="w-[18px] h-[18px] rounded-full bg-[#FCF1ED] flex items-center justify-center">
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
              <div className="w-[18px] h-[18px] rounded-full bg-[#FCF1ED] flex items-center justify-center">
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
              <div className="w-[18px] h-[18px] rounded-full bg-brand-primary flex items-center justify-center">
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
        <div className="w-[445px] h-[470px] bg-[#FAF6F3] rounded-[12px] border border-[#EAEAEA] flex items-center justify-center">
          <div className="w-[380px] h-[406px] bg-[#FFFFFF] rounded-[12px] pt-[40px] px-[24px] pb-[24px] flex flex-col items-center">
            
            {/* User Icon */}
            <Image src={IMAGES.profile} alt="Profile Icon" width={24} height={24} className="mb-[16px]" />
            
            <h3 className="font-heading font-semibold text-[18px] leading-[24px] tracking-[0.04em] text-center text-text-dark mb-[10px]">
              You&apos;ve used your 3 free<br />conversions
            </h3>
            
            <p className="font-body font-normal text-[14px] leading-[18.67px] text-center text-text-muted mb-[26px]">
              Create a free account to keep converting. No credit card<br />required ever.
            </p>

            <div className="flex flex-col w-full gap-[16px]">
              <Button className="w-full h-[42px] rounded-[12px]">Sign Up</Button>
              <Button variant="outline" className="w-full h-[42px] rounded-[12px]">Log In</Button>
            </div>

            <p className="font-body font-normal text-[12px] leading-[18.67px] text-center text-[#A1A1AA] mt-[26px]">
              Your SVG code is safe. It stays in this session until you finish<br />signing up.
            </p>
          </div>
        </div>
        
      </div>
    </section>
  );
}
