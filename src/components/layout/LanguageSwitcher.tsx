"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const locales = routing.locales;
  const currentInfo = LOCALE_LABELS[currentLocale] || LOCALE_LABELS.en;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLocale = useCallback(
    (newLocale: Locale) => {
      setIsOpen(false);
      triggerRef.current?.focus();
      if (newLocale === currentLocale) return;
      router.replace(pathname, { locale: newLocale });
    },
    [currentLocale, pathname, router]
  );

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setIsOpen(true);
        const currentIndex = locales.indexOf(currentLocale);
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % locales.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + locales.length) % locales.length);
        break;
      case "Home":
        event.preventDefault();
        setFocusedIndex(0);
        break;
      case "End":
        event.preventDefault();
        setFocusedIndex(locales.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < locales.length) {
          handleSelectLocale(locales[focusedIndex]);
        }
        break;
      case "Escape":
      case "Tab":
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      default:
        break;
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setFocusedIndex(locales.indexOf(currentLocale));
        }}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="language-listbox"
        aria-label={`Language selector. Currently selected: ${currentInfo.nativeName}`}
        className="group flex items-center gap-[8px] h-[36px] md:h-[40px] px-[12px] md:px-[14px] rounded-[10px] md:rounded-[12px] border border-[#EAEAEA] bg-white/95 backdrop-blur-md text-text-dark hover:border-[#D94A1E]/50 hover:bg-[#FAF6F3] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(217,74,30,0.08)] transition-all duration-200 cursor-pointer text-[13px] md:text-[14px] font-body font-medium focus:outline-none focus:ring-2 focus:ring-[#D94A1E]/30"
      >
        {/* Globe SVG */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#64748B] group-hover:text-brand-primary transition-colors shrink-0"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>

        {/* Flag Badge */}
        <span className="text-[14px] md:text-[15px] leading-none select-none" aria-hidden="true">
          {currentInfo.flag}
        </span>

        {/* Label */}
        <span className="truncate max-w-[76px] sm:max-w-none text-[#1E293B] group-hover:text-brand-primary transition-colors font-medium">
          {currentInfo.nativeName}
        </span>

        {/* Chevron */}
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-200 text-[#94A3B8] group-hover:text-brand-primary shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div
          id="language-listbox"
          ref={listboxRef}
          role="listbox"
          aria-label="Select website language"
          className={`absolute ${
            dropUp ? "bottom-full mb-2" : "top-full mt-2"
          } right-0 w-[230px] bg-white/98 backdrop-blur-xl border border-[#EAEAEA] rounded-[16px] shadow-[0_16px_48px_-8px_rgba(0,0,0,0.16)] p-[6px] z-50 animate-in fade-in-0 zoom-in-95 duration-150 ring-1 ring-black/5`}
        >
          {/* Header */}
          <div className="px-[10px] py-[6px] mb-[2px] border-b border-[#F4F4F4] flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#94A3B8] font-body">
              Language / Idioma
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live multi-language" />
          </div>

          {/* Options */}
          <div className="flex flex-col gap-[2px]">
            {locales.map((loc, index) => {
              const info = LOCALE_LABELS[loc];
              const isSelected = loc === currentLocale;
              const isFocused = index === focusedIndex;

              return (
                <button
                  key={loc}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  onClick={() => handleSelectLocale(loc)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`w-full flex items-center justify-between px-[10px] py-[8px] rounded-[10px] text-left transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-[#FFF5F2] text-brand-primary font-semibold"
                      : isFocused
                      ? "bg-[#FAF6F3] text-brand-primary"
                      : "text-[#334155] hover:bg-[#FAF6F3]"
                  }`}
                >
                  <div className="flex items-center gap-[10px] min-w-0">
                    <span className="text-[17px] leading-none shrink-0" aria-hidden="true">
                      {info.flag}
                    </span>
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="text-[13px] font-heading font-medium truncate">
                        {info.nativeName}
                      </span>
                      <span className="text-[10.5px] text-[#94A3B8] font-body">
                        {info.name}
                      </span>
                    </div>
                  </div>

                  {isSelected ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-brand-primary shrink-0 ml-2"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="text-[10px] font-mono text-[#CBD5E1] uppercase shrink-0">
                      {loc}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
