"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname, routing, type Locale, LOCALE_LABELS } from "@/i18n/routing";

interface LanguageSwitcherProps {
  className?: string;
  dropUp?: boolean;
}

export function LanguageSwitcher({ className = "", dropUp = false }: LanguageSwitcherProps) {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelectLocale = (newLocale: Locale) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    setIsOpen(false);
    // next-intl localized navigation preserving current pathname mapping
    router.replace(pathname, { locale: newLocale });
  };

  const currentInfo = LOCALE_LABELS[currentLocale] || LOCALE_LABELS.en;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Language selector"
        className="flex items-center gap-[6px] h-[34px] md:h-[38px] px-[10px] md:px-[12px] rounded-[8px] md:rounded-[10px] border border-[#F2EDE8] bg-white text-text-dark hover:border-[#D94A1E]/40 hover:bg-[#FAF6F3] transition-all shadow-[0px_2px_8px_rgba(0,0,0,0.04)] cursor-pointer text-[13px] md:text-[14px] font-body font-medium"
      >
        <span className="text-[14px] md:text-[16px] leading-none" aria-hidden="true">
          {currentInfo.flag}
        </span>
        <span className="truncate max-w-[70px] sm:max-w-none">{currentInfo.nativeName}</span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-200 text-text-muted ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Supported languages"
          className={`absolute ${
            dropUp ? "bottom-full mb-2" : "top-full mt-2"
          } right-0 w-[170px] bg-white border border-[#F2EDE8] rounded-[12px] shadow-[0px_8px_32px_rgba(0,0,0,0.12)] py-[6px] z-50 animate-in fade-in zoom-in-95 duration-150`}
        >
          {routing.locales.map((loc) => {
            const info = LOCALE_LABELS[loc];
            const isSelected = loc === currentLocale;

            return (
              <button
                key={loc}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectLocale(loc)}
                className={`w-full text-left px-[14px] py-[8px] flex items-center justify-between font-body text-[13px] md:text-[14px] transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#FCF1ED] text-brand-primary font-semibold"
                    : "text-text-dark hover:bg-[#FAF6F3] hover:text-brand-primary"
                }`}
              >
                <span className="flex items-center gap-[8px]">
                  <span className="text-[15px]">{info.flag}</span>
                  <span>{info.nativeName}</span>
                </span>
                {isSelected && (
                  <svg
                    width="14"
                    height="10"
                    viewBox="0 0 14 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-brand-primary shrink-0"
                  >
                    <path
                      d="M1.5 5L5 8.5L12.5 1"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
