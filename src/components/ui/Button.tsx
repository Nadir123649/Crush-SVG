import React from "react";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "solid" | "outline";
  href?: string;
}

export function Button({ 
  children, 
  className = "", 
  variant = "solid", 
  href, 
  type, 
  disabled, 
  ...props 
}: ButtonProps) {
  const baseTextStyles = "font-body font-medium text-[16px] leading-[18.67px] tracking-[0%] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2";
  
  if (href) {
    if (variant === "outline") {
      return (
        <Link
          href={href}
          className={`group relative rounded-[12px] px-[10px] active:scale-[0.98] overflow-hidden cursor-pointer ${baseTextStyles} ${className}`}
          {...(props as any)}
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
        </Link>
      );
    }

    return (
      <Link
        href={href}
        className={`bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white rounded-[12px] px-[10px] hover:opacity-90 transition-opacity active:scale-[0.98] cursor-pointer ${baseTextStyles} ${className}`}
        {...(props as any)}
      >
        {children}
      </Link>
    );
  }

  if (variant === "outline") {
    return (
      <button
        type={type}
        disabled={disabled}
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
      type={type}
      disabled={disabled}
      className={`bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white rounded-[12px] px-[10px] hover:opacity-90 transition-opacity active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${baseTextStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
