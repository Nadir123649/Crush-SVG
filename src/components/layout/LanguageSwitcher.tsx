"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useLoading } from "@/components/providers/LoadingProvider";
import { usePathname, useRouter, routing, type Locale, LOCALE_LABELS, getPathname } from "@/i18n/routing";

interface LanguageSwitcherProps {
  className?: string;
  dropUp?: boolean;
  listboxId?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LanguageSwitcher({
  className = "",
  dropUp = false,
  listboxId = "language-listbox",
  isOpen: controlledIsOpen,
  onOpenChange,
}: LanguageSwitcherProps) {
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const tLang = useTranslations("language");

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = useCallback(
    (open: boolean | ((prev: boolean) => boolean)) => {
      const nextOpen = typeof open === "function" ? open(isOpen) : open;
      if (onOpenChange) {
        onOpenChange(nextOpen);
      } else {
        setInternalIsOpen(nextOpen);
      }
    },
    [isOpen, onOpenChange]
  );

  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const { beginLoading } = useLoading();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pendingReleaseRef = useRef<(() => void) | null>(null);

  const locales = routing.locales;
  const currentInfo = LOCALE_LABELS[currentLocale] || LOCALE_LABELS.en;

  useEffect(() => {
    pendingReleaseRef.current?.();
    pendingReleaseRef.current = null;
  }, [currentLocale]);

  // Close on outside click (if uncontrolled)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  const handleSelectLocale = useCallback(
    (newLocale: Locale) => {
      setIsOpen(false);
      if (newLocale === currentLocale) return;

      pendingReleaseRef.current?.();
      pendingReleaseRef.current = beginLoading();

      // Set cookie directly so next request instantly receives new locale
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;

      try {
        // Compute target localized pathname
        const targetPath = getPathname({ href: pathname || "/", locale: newLocale });
        const search = typeof window !== "undefined" ? window.location.search : "";
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const fullUrl = `${targetPath}${search}${hash}`;
        router.push(fullUrl as Parameters<typeof router.push>[0]);
      } catch {
        // Fallback for custom routes
        const prefix = newLocale === routing.defaultLocale ? "" : `/${newLocale}`;
        const cleanPath = (pathname || "/").replace(/^\/(es|de|fr|pt|ja)/, "");
        const fallbackUrl = `${prefix}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}` || "/";
        router.push(fallbackUrl as Parameters<typeof router.push>[0]);
      }
    },
    [beginLoading, currentLocale, pathname, router, setIsOpen]
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
    <div
      className={`relative inline-block text-left ${className}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Compact brand control */}
      <button
        ref={triggerRef}
        type="button"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) {
            setFocusedIndex(locales.indexOf(currentLocale));
          }
        }}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={`${tLang("selectLanguage")}. ${currentInfo.nativeName}`}
        className={`group relative flex items-center gap-[7px] h-[36px] px-[3px] rounded-[7px] bg-transparent transition-all duration-200 cursor-pointer text-[13px] font-body font-medium focus:outline-none ${
          isOpen
            ? "text-brand-primary"
            : "text-text-body hover:text-brand-primary"
        }`}
      >
        <span className="flex h-[28px] w-[28px] items-center justify-center rounded-[7px] bg-brand-primary text-white transition-colors group-hover:bg-[#c4411a]" aria-hidden="true">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20" />
            <path d="M2 12h20" />
          </svg>
        </span>

        <span className="font-heading font-bold text-[12px] uppercase tracking-[0.06em] text-brand-primary group-hover:text-text-dark transition-colors">
          {currentLocale}
        </span>

        {/* Chevron */}
        <svg
          width="9"
          height="6"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-200 shrink-0 text-[#8C827C] group-hover:text-brand-primary ${
            isOpen ? "rotate-180 text-brand-primary" : ""
          }`}
          aria-hidden="true"
        >
          <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Language menu */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={tLang("selectLanguage")}
          className={`absolute ${
            dropUp ? "bottom-full mb-2" : "top-[38px] md:top-[48px]"
          } right-0 w-[240px] bg-[#FFFCFA] rounded-[10px] shadow-[0_12px_30px_rgba(32,36,39,0.12)] overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150`}
          style={{
            border: "1px solid #E8DED7",
          }}
        >
          <div className="px-[12px] py-[10px] border-b border-[#EDE5DF] flex items-center justify-between bg-[#FFF7F3]">
            <span className="font-heading font-semibold text-[12px] text-text-dark">
              {tLang("selectLanguage")}
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-brand-primary">
              CrushSVG
            </span>
          </div>

          {/* Options */}
          <div className="p-[5px] flex flex-col gap-[2px]">
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
                      ? "bg-[#FFF1EB] border border-[#D94A1E]/25 text-brand-primary"
                      : isFocused
                      ? "bg-[#FAF6F3] text-brand-primary"
                      : "text-text-dark hover:bg-[#FAF6F3] hover:text-brand-primary border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-[10px] min-w-0">
                    <span className="w-[28px] h-[28px] rounded-[6px] bg-[#FFF1EB] border border-[#F0C9B9] flex items-center justify-center text-[10px] font-heading font-bold uppercase text-brand-primary shrink-0" aria-hidden="true">
                      {loc}
                    </span>
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className={`text-[13.5px] font-heading ${isSelected ? "font-bold text-brand-primary" : "font-semibold text-text-dark"}`}>
                        {info.nativeName}
                      </span>
                      <span className="text-[11px] text-text-muted font-body">
                        {info.name} • {info.region}
                      </span>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="w-[18px] h-[18px] rounded-full bg-brand-primary text-white flex items-center justify-center shrink-0 ml-2">
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono uppercase text-[#A8A29E] font-medium shrink-0">
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
