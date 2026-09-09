"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { IMAGES } from "@/lib/shared/images";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/client/auth-context";
import { showToast } from "@/lib/client/toast-bridge";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function Header({ logoUrl }: { logoUrl?: string }) {
  const tNav = useTranslations("navigation");
  const tAuth = useTranslations("authentication");
  const tToasts = useTranslations("toasts");
  const tLanguage = useTranslations("language");
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [activeDropdown, setActiveDropdown] = useState<"none" | "tools" | "profile" | "language">("none");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const navContainerRef = useRef<HTMLDivElement>(null);
  const previousPathnameRef = useRef(pathname);
  const pathnameReadyRef = useRef(false);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navContainerRef.current && !navContainerRef.current.contains(event.target as Node)) {
        setActiveDropdown("none");
        setMobileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveDropdown("none");
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = useCallback(() => {
    setActiveDropdown("none");
    setMobileMenuOpen(false);
    logout();
    showToast("success", tToasts("loggedOut"));
    router.push("/");
  }, [logout, router, tToasts]);

  // Close all menus on pathname navigation
  useEffect(() => {
    if (!pathnameReadyRef.current) {
      pathnameReadyRef.current = true;
      previousPathnameRef.current = pathname;
      return;
    }
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    setActiveDropdown("none");
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", "/");
    } else {
      router.push("/");
    }
  };

  const isSvgToPngActive = pathname === "/" || pathname === "/convert-svg-to-png";
  const isPngToSvgActive = pathname === "/png-to-svg";
  const isOtherToolActive = pathname === "/background-remover" || pathname === "/image-resizer";
  const isAuthenticated = status === "authed" && !!user;

  return (
    <header className="w-full h-[66px] md:h-[92px] sticky top-0 z-50">
      <div
        className={`w-full flex justify-center px-[16px] md:px-[40px] lg:px-[80px] pt-[16px] md:pt-[30px] pb-[10px] transition-all duration-300 absolute top-0 ${
          isScrolled
            ? "bg-[#FFFCFA]/95 backdrop-blur-md shadow-[0px_4px_20px_0px_rgba(0,0,0,0.04)]"
            : "bg-[#FFFCFA]"
        }`}
        ref={navContainerRef}
      >
        <nav className="w-full max-w-[1280px] grid grid-cols-[auto_1fr_auto] items-center gap-[20px] h-[36px] md:h-[44px]">
          {/* Left: Logo */}
          <Link
            href="/"
            onClick={handleLogoClick}
            aria-label={tNav("homeAria")}
            className="flex items-center gap-[6px] md:gap-[8px] group shrink-0"
          >
            <Image
              src={logoUrl || IMAGES.logo}
              alt="CrushSVG Logo"
              width={28}
              height={28}
              className="w-[22px] h-[22px] md:w-[28px] md:h-[28px] object-contain transition-transform duration-200 group-hover:scale-105"
            />

            <div className="font-heading font-semibold text-[20px] md:text-[26px] leading-[18.67px] tracking-[0%] flex items-center">
              <span className="text-text-dark">Crush</span>
              <span className="text-brand-primary">SVG</span>
            </div>
          </Link>

          {/* Center: Desktop Navigation Options */}
          <div className="hidden lg:flex items-center justify-center gap-[4px] rounded-[10px] border border-[#EEE5DE] bg-[#FAF6F3] px-[5px] py-[4px]">
            {/* SVG to PNG (Primary Tool Link) */}
            <Link
              href="/"
              onClick={(e) => {
                if (typeof window !== "undefined" && (window.location.pathname === "/" || window.location.pathname === "/convert-svg-to-png")) {
                  e.preventDefault();
                  const el = document.getElementById("converter");
                  if (el) {
                    const offset = window.innerWidth >= 768 ? 96 : 70;
                    const elementPosition = el.getBoundingClientRect().top + window.scrollY;
                    window.scrollTo({ top: elementPosition - offset, behavior: "smooth" });
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }
              }}
              className={`px-[10px] py-[7px] rounded-[7px] font-body font-semibold text-[14px] leading-[18.67px] tracking-[0.01em] transition-colors ${
                isSvgToPngActive
                  ? "bg-white text-brand-primary font-bold shadow-[0_1px_4px_rgba(32,36,39,0.06)]"
                  : "text-text-body hover:text-brand-primary"
              }`}
            >
              {tNav("svgToPng")}
            </Link>

            {/* PNG to SVG (Vectorizer Link) */}
            <Link
              href="/png-to-svg"
              className={`px-[10px] py-[7px] rounded-[7px] font-body font-semibold text-[14px] leading-[18.67px] tracking-[0.01em] transition-colors ${
                isPngToSvgActive
                  ? "bg-white text-brand-primary font-bold shadow-[0_1px_4px_rgba(32,36,39,0.06)]"
                  : "text-text-body hover:text-brand-primary"
              }`}
            >
              {tNav("pngToSvg")}
            </Link>

            {/* More Tools Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown((prev) => (prev === "tools" ? "none" : "tools"))
                }
                aria-expanded={activeDropdown === "tools"}
                aria-haspopup="true"
                className={`flex items-center gap-[4px] px-[10px] py-[7px] rounded-[7px] font-body font-semibold text-[14px] leading-[18.67px] tracking-[0.01em] transition-colors cursor-pointer ${
                  isOtherToolActive || activeDropdown === "tools"
                    ? "bg-white text-brand-primary font-bold shadow-[0_1px_4px_rgba(32,36,39,0.06)]"
                    : "text-text-body hover:text-brand-primary"
                }`}
              >
                <span>{tNav("tools")}</span>
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 12 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transition-transform duration-200 ${
                    activeDropdown === "tools" ? "rotate-180 text-brand-primary" : "text-[#757575]"
                  }`}
                >
                  <path
                    d="M1 1.5L6 6.5L11 1.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Tools Dropdown Card */}
              {activeDropdown === "tools" && (
                <div
                  role="menu"
                  className="absolute left-0 top-[36px] w-[280px] bg-white rounded-[16px] shadow-[0px_16px_48px_0px_rgba(217,74,30,0.12),0px_4px_16px_0px_rgba(0,0,0,0.06)] overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150"
                  style={{ border: "1px solid #F2EDE8" }}
                >
                  <div className="h-[3px] w-full bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D]" />
                  <div className="px-[14px] py-[8px] border-b border-[#F2EDE8] flex items-center justify-between bg-[#FFFCFA]">
                    <span className="font-heading font-semibold text-[11px] uppercase tracking-wider text-text-muted">
                      {tNav("tools")}
                    </span>
                    <span className="text-[10px] font-mono text-brand-primary font-semibold bg-[#FFF5F2] px-[6px] py-[1px] rounded-full border border-brand-primary/20">
                      Suite
                    </span>
                  </div>

                  <div className="p-[6px] flex flex-col gap-[2px]">
                    <Link
                      href="/"
                      onClick={() => setActiveDropdown("none")}
                      className={`flex items-center gap-[10px] px-[10px] py-[8px] rounded-[10px] transition-all ${
                        isSvgToPngActive
                          ? "bg-gradient-to-r from-[#FFF5F0] to-[#FFF9F5] text-brand-primary font-semibold border border-[#D94A1E]/30"
                          : "text-text-dark hover:bg-[#FAF6F3] hover:text-brand-primary"
                      }`}
                    >
                      <span className="w-[30px] h-[30px] rounded-[8px] bg-[#FFF5F2] text-brand-primary flex items-center justify-center shrink-0 border border-brand-primary/20 font-heading font-bold text-[11px]">
                        SVG
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13.5px] font-heading font-semibold truncate leading-tight">
                          {tNav("svgToPng")}
                        </span>
                        <span className="text-[11px] text-text-muted truncate leading-tight mt-[2px]">
                          Vector code & files to crisp PNG
                        </span>
                      </div>
                    </Link>

                    <Link
                      href="/png-to-svg"
                      onClick={() => setActiveDropdown("none")}
                      className={`flex items-center gap-[10px] px-[10px] py-[8px] rounded-[10px] transition-all ${
                        isPngToSvgActive
                          ? "bg-gradient-to-r from-[#FFF5F0] to-[#FFF9F5] text-brand-primary font-semibold border border-[#D94A1E]/30"
                          : "text-text-dark hover:bg-[#FAF6F3] hover:text-brand-primary"
                      }`}
                    >
                      <span className="w-[30px] h-[30px] rounded-[8px] bg-[#FFF5F2] text-brand-primary flex items-center justify-center shrink-0 border border-brand-primary/20 font-heading font-bold text-[11px]">
                        PNG
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13.5px] font-heading font-semibold truncate leading-tight">
                          {tNav("pngToSvg")}
                        </span>
                        <span className="text-[11px] text-text-muted truncate leading-tight mt-[2px]">
                          Raster images to scalable SVG
                        </span>
                      </div>
                    </Link>

                    <Link
                      href="/background-remover"
                      onClick={() => setActiveDropdown("none")}
                      className={`flex items-center gap-[10px] px-[10px] py-[8px] rounded-[10px] transition-all ${
                        pathname === "/background-remover"
                          ? "bg-gradient-to-r from-[#FFF5F0] to-[#FFF9F5] text-brand-primary font-semibold border border-[#D94A1E]/30"
                          : "text-text-dark hover:bg-[#FAF6F3] hover:text-brand-primary"
                      }`}
                    >
                      <span className="w-[30px] h-[30px] rounded-[8px] bg-[#FFF5F2] text-brand-primary flex items-center justify-center shrink-0 border border-brand-primary/20 font-heading font-bold text-[11px]">
                        AI
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13.5px] font-heading font-semibold truncate leading-tight">
                          {tNav("backgroundRemover")}
                        </span>
                        <span className="text-[11px] text-text-muted truncate leading-tight mt-[2px]">
                          AI background transparency
                        </span>
                      </div>
                    </Link>

                    <Link
                      href="/image-resizer"
                      onClick={() => setActiveDropdown("none")}
                      className={`flex items-center gap-[10px] px-[10px] py-[8px] rounded-[10px] transition-all ${
                        pathname === "/image-resizer"
                          ? "bg-gradient-to-r from-[#FFF5F0] to-[#FFF9F5] text-brand-primary font-semibold border border-[#D94A1E]/30"
                          : "text-text-dark hover:bg-[#FAF6F3] hover:text-brand-primary"
                      }`}
                    >
                      <span className="w-[30px] h-[30px] rounded-[8px] bg-[#FFF5F2] text-brand-primary flex items-center justify-center shrink-0 border border-brand-primary/20 font-heading font-bold text-[11px]">
                        PX
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13.5px] font-heading font-semibold truncate leading-tight">
                          {tNav("imageResizer")}
                        </span>
                        <span className="text-[11px] text-text-muted truncate leading-tight mt-[2px]">
                          Dimension scaling & optimization
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Blog */}
            <Link
              href="/blog"
              className={`px-[10px] py-[7px] rounded-[7px] font-body font-semibold text-[14px] leading-[18.67px] tracking-[0.01em] transition-colors ${
                pathname.startsWith("/blog")
                  ? "bg-white text-brand-primary font-bold shadow-[0_1px_4px_rgba(32,36,39,0.06)]"
                  : "text-text-body hover:text-brand-primary"
              }`}
            >
              {tNav("blog")}
            </Link>

            {/* Guides */}
            <Link
              href="/svg-guides"
              className={`px-[10px] py-[7px] rounded-[7px] font-body font-semibold text-[14px] leading-[18.67px] tracking-[0.01em] transition-colors ${
                pathname.startsWith("/svg-guides")
                  ? "bg-white text-brand-primary font-bold shadow-[0_1px_4px_rgba(32,36,39,0.06)]"
                  : "text-text-body hover:text-brand-primary"
              }`}
            >
              {tNav("guides")}
            </Link>

            {/* Need Help? */}
            <Link
              href="/contact-us?r=1"
              className={`px-[10px] py-[7px] rounded-[7px] font-body font-semibold text-[14px] leading-[18.67px] tracking-[0.01em] transition-colors ${
                pathname.startsWith("/contact-us")
                  ? "bg-white text-brand-primary font-bold shadow-[0_1px_4px_rgba(32,36,39,0.06)]"
                  : "text-text-body hover:text-brand-primary"
              }`}
            >
              {tNav("needHelp")}
            </Link>
          </div>

          {/* Right Side: Language Switcher + Auth */}
          <div className="flex items-center gap-[8px] sm:gap-[12px] md:gap-[16px] border-l border-[#E8DED7] pl-[12px] md:pl-[16px]">
            {/* Language Switcher (Tablet & Desktop) */}
            <div className="hidden sm:inline-block">
              <LanguageSwitcher
                listboxId="desktop-language-listbox"
              />
            </div>

            {/* Guest actions */}
            {status === "guest" && (
              <div className="hidden md:flex items-center gap-[8px] md:gap-[12px]">
                <Button
                  href="/login"
                  variant="outline"
                  className="w-[80px] h-[34px] rounded-[10px] text-[14px] md:w-[110px] md:h-[40px] md:rounded-[12px] md:text-[15px] bg-[#FFFFFF] px-[0px]"
                >
                  {tAuth("login")}
                </Button>

                <Button
                  href="/signup"
                  variant="solid"
                  className="w-[84px] h-[34px] rounded-[10px] text-[14px] md:w-[115px] md:h-[40px] md:rounded-[12px] md:text-[15px] px-[0px]"
                >
                  {tAuth("signup")}
                </Button>
              </div>
            )}

            {/* Authenticated profile menu */}
            {isAuthenticated && <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown((prev) => (prev === "profile" ? "none" : "profile"))
                }
                aria-haspopup="menu"
                aria-expanded={activeDropdown === "profile"}
                aria-label={tNav("accountMenu")}
                className={`flex items-center gap-[6px] md:gap-[8px] rounded-full border bg-white pl-[4px] pr-[10px] py-[4px] md:pl-[5px] md:pr-[12px] md:py-[5px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] hover:shadow-[0px_2px_16px_0px_rgba(0,0,0,0.1)] transition-all cursor-pointer ${
                  activeDropdown === "profile"
                    ? "border-brand-primary ring-2 ring-brand-primary/20"
                    : "border-[#F2EDE8] hover:border-[#D94A1E]/30"
                }`}
              >
                {user?.photoURL && failedImageUrl !== user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-full object-cover w-[24px] h-[24px] md:w-[28px] md:h-[28px]"
                    unoptimized
                    referrerPolicy="no-referrer"
                    onError={() => setFailedImageUrl(user.photoURL ?? null)}
                  />
                ) : (
                  <span className="w-[24px] h-[24px] md:w-[28px] md:h-[28px] rounded-full bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white flex items-center justify-center font-bricolage font-semibold text-[12px] md:text-[13px]">
                    {(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}
                  </span>
                )}

                <span className="hidden sm:inline-block font-body font-medium text-[12px] md:text-[14px] text-text-dark max-w-[80px] md:max-w-[130px] truncate">
                  {user?.displayName || user?.email}
                </span>

                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 12 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transition-transform duration-200 ${
                    activeDropdown === "profile" ? "rotate-180 text-brand-primary" : "text-[#757575]"
                  }`}
                >
                  <path
                    d="M1 1.5L6 6.5L11 1.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {activeDropdown === "profile" && (
                <div
                  role="menu"
                  className="absolute right-0 top-[40px] md:top-[50px] w-[210px] bg-white rounded-[14px] shadow-[0px_16px_48px_0px_rgba(217,74,30,0.12),0px_4px_16px_0px_rgba(0,0,0,0.06)] overflow-hidden py-[8px] z-50 animate-in fade-in-0 zoom-in-95 duration-150"
                  style={{ border: "1px solid #F2EDE8" }}
                >
                  <div className="px-[16px] py-[8px] border-b border-[#F2EDE8] mb-[4px]">
                    <p className="font-heading font-semibold text-[14px] text-text-dark truncate">
                      {user?.displayName || "CrushSVG user"}
                    </p>
                    <p className="font-body text-[12px] text-text-muted truncate">
                      {user?.email}
                    </p>
                  </div>

                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setActiveDropdown("none")}
                      className="block w-full text-left px-[16px] py-[9px] font-body text-[14px] text-text-dark hover:bg-[#FAF6F3] hover:text-brand-primary transition-colors"
                    >
                      {tNav("adminDashboard")}
                    </Link>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full text-left px-[16px] py-[9px] font-body font-medium text-[14px] text-[#D94A1E] hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    {tNav("logOut")}
                  </button>
                </div>
              )}
            </div>}

            {/* Mobile Hamburger Button */}
            <div className="lg:hidden flex items-center">
              <button
                type="button"
                onMouseDown={(event) => event.stopPropagation()}
                onPointerDown={() => {
                  setActiveDropdown("none");
                  setMobileMenuOpen((v) => !v);
                }}
                className={`p-2 rounded-[8px] text-text-dark hover:text-brand-primary hover:bg-[#FAF6F3] transition-colors cursor-pointer ${
                  mobileMenuOpen ? "text-brand-primary bg-[#FFF5F2]" : ""
                }`}
                aria-label={tNav("openMenu")}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-[66px] left-0 w-full max-h-[calc(100vh-66px)] overflow-y-auto bg-[#FFFCFA] border-b border-[#F2EDE8] shadow-[0px_16px_32px_0px_rgba(0,0,0,0.08)] py-5 px-6 flex flex-col gap-4 z-40 animate-in slide-in-from-top-2">
          {/* Tools Category */}
          <div className="flex flex-col gap-1">
            <span className="font-heading font-semibold text-[11px] uppercase tracking-wider text-text-muted px-2 py-1">
              {tNav("tools")}
            </span>
            <div className="grid grid-cols-1 gap-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-colors ${
                  isSvgToPngActive
                    ? "bg-[#FFF5F2] text-brand-primary font-semibold"
                    : "text-text-dark hover:bg-[#FAF6F3] hover:text-brand-primary"
                }`}
              >
                <span className="w-[26px] h-[26px] rounded-[6px] bg-[#FFF5F2] text-brand-primary flex items-center justify-center shrink-0 border border-brand-primary/20 text-[11px] font-bold">
                  SVG
                </span>
                <span className="font-body text-[15px]">{tNav("svgToPng")}</span>
              </Link>

              <Link
                href="/png-to-svg"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-colors ${
                  isPngToSvgActive
                    ? "bg-[#FFF5F2] text-brand-primary font-semibold"
                    : "text-text-dark hover:bg-[#FAF6F3] hover:text-brand-primary"
                }`}
              >
                <span className="w-[26px] h-[26px] rounded-[6px] bg-[#FFF5F2] text-brand-primary flex items-center justify-center shrink-0 border border-brand-primary/20 text-[11px] font-bold">
                  PNG
                </span>
                <span className="font-body text-[15px]">{tNav("pngToSvg")}</span>
              </Link>

              <Link
                href="/background-remover"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-colors ${
                  pathname === "/background-remover"
                    ? "bg-[#FFF5F2] text-brand-primary font-semibold"
                    : "text-text-dark hover:bg-[#FAF6F3] hover:text-brand-primary"
                }`}
              >
                <span className="w-[26px] h-[26px] rounded-[6px] bg-[#FFF5F2] text-brand-primary flex items-center justify-center shrink-0 border border-brand-primary/20 text-[11px] font-bold">
                  AI
                </span>
                <span className="font-body text-[15px]">{tNav("backgroundRemover")}</span>
              </Link>

              <Link
                href="/image-resizer"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-colors ${
                  pathname === "/image-resizer"
                    ? "bg-[#FFF5F2] text-brand-primary font-semibold"
                    : "text-text-dark hover:bg-[#FAF6F3] hover:text-brand-primary"
                }`}
              >
                <span className="w-[26px] h-[26px] rounded-[6px] bg-[#FFF5F2] text-brand-primary flex items-center justify-center shrink-0 border border-brand-primary/20 text-[11px] font-bold">
                  PX
                </span>
                <span className="font-body text-[15px]">{tNav("imageResizer")}</span>
              </Link>
            </div>
          </div>

          {/* Resources Category */}
          <div className="flex flex-col gap-1 pt-2 border-t border-[#F2EDE8]">
            <span className="font-heading font-semibold text-[11px] uppercase tracking-wider text-text-muted px-2 py-1">
              {tNav("guides")} & {tNav("blog")}
            </span>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="font-body font-medium text-[15px] text-text-dark px-3 py-2 rounded-[8px] hover:bg-[#FAF6F3] hover:text-brand-primary transition-colors"
            >
              {tNav("blog")}
            </Link>
            <Link
              href="/svg-guides"
              onClick={() => setMobileMenuOpen(false)}
              className="font-body font-medium text-[15px] text-text-dark px-3 py-2 rounded-[8px] hover:bg-[#FAF6F3] hover:text-brand-primary transition-colors"
            >
              {tNav("guides")}
            </Link>
            <Link
              href="/contact-us?r=1"
              onClick={() => setMobileMenuOpen(false)}
              className="font-body font-medium text-[15px] text-text-dark px-3 py-2 rounded-[8px] hover:bg-[#FAF6F3] hover:text-brand-primary transition-colors"
            >
              {tNav("needHelp")}
            </Link>
          </div>

          {/* Language Switcher in Mobile Drawer */}
          <div className="flex items-center justify-between pt-3 border-t border-[#F2EDE8] px-2">
            <span className="font-heading font-semibold text-[13px] text-text-dark">
              {tLanguage("label")}
            </span>
            <LanguageSwitcher listboxId="mobile-language-listbox" />
          </div>

          {/* Mobile guest actions */}
          {status === "guest" && (
            <div className="flex flex-col gap-2 pt-3 border-t border-[#F2EDE8]">
              <Button
                href="/login"
                variant="outline"
                className="w-full h-[40px] rounded-[10px] bg-[#FFFFFF] text-[15px]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {tAuth("login")}
              </Button>
              <Button
                href="/signup"
                variant="solid"
                className="w-full h-[40px] rounded-[10px] text-[15px]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {tAuth("signup")}
              </Button>
            </div>
          )}

          {/* Mobile authenticated actions */}
          {isAuthenticated && <div className="flex flex-col gap-2 pt-3 border-t border-[#F2EDE8]">
            <div className="flex items-center gap-3 px-3 py-2 bg-[#FAF6F3] rounded-[10px]">
              <span className="w-[30px] h-[30px] rounded-full bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white flex items-center justify-center font-bricolage font-semibold text-[13px]">
                {(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-body font-medium text-[14px] text-text-dark truncate">
                  {user?.displayName || "User"}
                </span>
                <span className="font-body text-[12px] text-text-muted truncate">
                  {user?.email}
                </span>
              </div>
            </div>

            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="font-body font-medium text-[14px] text-text-dark px-3 py-2 rounded-[8px] hover:bg-[#FAF6F3] hover:text-brand-primary"
              >
                {tNav("adminDashboard")}
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-center py-2.5 rounded-[10px] font-body font-semibold text-[14px] text-[#D94A1E] bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
            >
              {tNav("logOut")}
            </button>
          </div>}
        </div>
      )}
    </header>
  );
}