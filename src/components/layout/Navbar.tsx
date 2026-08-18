"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IMAGES } from "@/lib/images";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/client/auth-context";
import { useToast } from "@/components/ui/ToastProvider";

export function Navbar() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    await logout();
    addToast("Logged out successfully");
    router.push("/");
    router.refresh();
  }

  const [isScrolled, setIsScrolled] = useState(false);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="w-full h-[66px] md:h-[92px] sticky top-0 z-50">
      <div className={`w-full flex justify-center px-[16px] md:px-[80px] pt-[24px] md:pt-[40px] pb-[10px] transition-all duration-300 absolute top-0 ${isScrolled ? "bg-[#FFFCFA]/95 backdrop-blur-md" : "bg-[#FFFCFA]"}`}>
        <nav className="w-full max-w-[1280px] flex items-center justify-between h-[32px] md:h-[42px]">
        {/* Logo */}
        <Link href="/" onClick={handleLogoClick} className="flex items-center gap-[4px] md:gap-[6px]">
          <Image
            src={IMAGES.logo}
            alt="CrushSVG Icon"
            width={26}
            height={26}
            className="w-[20px] h-[20px] md:w-[26px] md:h-[26px] object-contain"
          />
          <div className="font-heading font-semibold text-[20px] md:text-[26px] leading-[18.67px] tracking-[0%] flex items-center">
            <span className="text-text-dark">Crush</span>
            <span className="text-brand-primary">SVG</span>
          </div>
        </Link>

        {/* Right Side Links & Buttons */}
        {!mounted ? (
          <div className="w-[120px] h-[32px] md:w-[150px] md:h-[42px]" />
        ) : (
          <div className="flex items-center gap-[14px] md:gap-[24px]">
            <Link
              href="/contact-us"
              className="hidden md:inline-block font-body font-semibold text-[16px] leading-[18.67px] tracking-[0.06em] text-text-body hover:text-text-dark transition-colors"
            >
              Need Help?
            </Link>

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex items-center gap-[6px] md:gap-[10px] rounded-full border border-[#F2EDE8] bg-white pl-[4px] pr-[10px] py-[4px] md:pl-[6px] md:pr-[14px] md:py-[6px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] hover:shadow-[0px_2px_16px_0px_rgba(0,0,0,0.1)] transition-shadow"
                >
                  {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt=""
                    width={24}
                    height={24}
                    className="rounded-full object-cover w-[24px] h-[24px] md:w-[30px] md:h-[30px]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="w-[24px] h-[24px] md:w-[30px] md:h-[30px] rounded-full bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white flex items-center justify-center font-bricolage font-semibold text-[12px] md:text-[14px]">
                    {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="font-body font-medium text-[12px] md:text-[14px] text-text-dark max-w-[80px] md:max-w-[140px] truncate">
                  {user.displayName || user.email}
                </span>
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 12 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                >
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="#353A3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[42px] md:top-[52px] w-[200px] bg-white border border-[#F2EDE8] rounded-[12px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.1)] py-[8px] z-50"
                >
                  <div className="px-[16px] py-[8px] border-b border-[#F2EDE8] mb-[4px]">
                    <p className="font-body font-medium text-[13px] text-text-dark truncate">{user.displayName || "CrushSVG user"}</p>
                    <p className="font-body text-[12px] text-text-muted truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/sessions"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                    className="block px-[16px] py-[10px] font-body text-[14px] text-text-body hover:bg-gray-50 hover:text-text-dark transition-colors"
                  >
                    Manage sessions
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full text-left px-[16px] py-[10px] font-body text-[14px] text-[#D94A1E] hover:bg-red-50 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-[14px] md:gap-[16px]">
              <Link href="/login">
                <Button variant="outline" className="w-[80px] h-[32px] rounded-[8px] text-[14px] md:w-[139px] md:h-[42px] md:rounded-[12px] md:text-[16px] bg-[#FFFFFF] px-[0px]">
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="solid" className="w-[80px] h-[32px] rounded-[8px] text-[14px] md:w-[139px] md:h-[42px] md:rounded-[12px] md:text-[16px] px-[0px]">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
        )}
      </nav>
    </div>
    </div>
  );
}
