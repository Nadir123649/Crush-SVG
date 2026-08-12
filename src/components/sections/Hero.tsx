import React from "react";

export function Hero() {
  return (
    <section className="flex flex-col items-center w-full max-w-[795px] mx-auto mt-[54px] gap-[14px]">
      
      {/* Badge */}
      <div 
        style={{ 
          border: "1px solid transparent",
          background: "linear-gradient(#FFFCFA, #FFFCFA) padding-box, linear-gradient(to right, #D94A1E, #FF9A3D) border-box"
        }}
        className="flex items-center gap-[10px] h-[29px] rounded-[30px] px-[30px] justify-center"
      >
        <div className="w-[6px] h-[6px] rounded-full bg-brand-primary"></div>
        <span className="font-body font-medium text-[14px] leading-[18.67px] text-text-dark">
          3 free conversions. Create a free account for unlimited access.
        </span>
      </div>

      {/* Main Heading */}
      <h1 className="font-heading font-semibold text-[56px] leading-[61px] tracking-[0.04em] text-center text-text-dark">
        From <span className="text-brand-primary">SVG to PNG,</span> Exactly<br />as Intended
      </h1>

      {/* Description */}
      <p className="font-body font-normal text-[16px] leading-[18.67px] tracking-[0%] text-center text-text-muted max-w-[500px]">
        Paste your SVG code, upload a file, or drag and drop it. Generate crisp PNGs in seconds for Outlook, Gmail, newsletters, websites, and more.
      </p>
      
    </section>
  );
}
