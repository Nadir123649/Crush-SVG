import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "solid" | "outline";
}

export function Button({ children, className = "", variant = "solid", ...props }: ButtonProps) {
  const baseTextStyles = "font-body font-medium text-[16px] leading-[18.67px] tracking-[0%] flex items-center justify-center";
  
  if (variant === "outline") {
    return (
      <button
        className={`group relative rounded-[12px] px-[10px] active:scale-[0.98] overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${baseTextStyles} ${className}`}
        {...props}
      >
        <div 
          className="absolute inset-0 z-0 pointer-events-none" 
          style={{
            border: "1px solid transparent",
            background: "linear-gradient(#FFFFFF, #FFFFFF) padding-box, linear-gradient(to right, #D94A1E, #FF9A3D) border-box",
            borderRadius: "inherit"
          }} 
        />
        <div 
          className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out pointer-events-none bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D]" 
        />
        <span className="relative z-10 text-text-dark group-hover:text-white transition-colors duration-300 ease-in-out flex items-center justify-center">
          {children}
        </span>
      </button>
    );
  }

  return (
    <button
      className={`bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white rounded-[12px] px-[10px] hover:opacity-90 transition-opacity active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${baseTextStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
