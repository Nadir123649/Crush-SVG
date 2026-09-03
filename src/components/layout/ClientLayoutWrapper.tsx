"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/sections/Footer";
import { ScrollToTop } from "@/components/utils/ScrollToTop";

export function ClientLayoutWrapper({ children, logoUrl }: { children: React.ReactNode, logoUrl?: string }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  // Handle hash scrolling on page load/navigation with ResizeObserver to prevent layout shift bugs
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace("#", "");
      
      const scrollToHash = () => {
        const el = document.getElementById(hash);
        if (el) {
          const offset = window.innerWidth >= 768 ? 96 : 70;
          const elementPosition = el.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementPosition - offset,
            behavior: "smooth"
          });
        }
      };

      // Run at key intervals as fallback
      const t1 = setTimeout(scrollToHash, 50);
      const t2 = setTimeout(scrollToHash, 300);
      const t3 = setTimeout(scrollToHash, 800);

      // Observe Hero section height changes (e.g. Firebase Auth badge loading)
      const heroEl = document.getElementById("hero");
      let ro: ResizeObserver | null = null;
      if (heroEl && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => {
          scrollToHash();
        });
        ro.observe(heroEl);
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        if (ro) ro.disconnect();
      };
    }
  }, [pathname]);

  if (isAdmin) {
    return <main id="main-content" className="w-full flex-1 h-screen overflow-hidden bg-[#FFFCFA]">{children}</main>;
  }

  return (
    <>
      <Header logoUrl={logoUrl} />
      <ScrollToTop />
      <div className="w-full max-w-[1440px] mx-auto px-[16px] md:px-[80px] flex flex-col flex-1">
        <main id="main-content" className="w-full flex-1">
          {children}
        </main>
      </div>
      <Footer logoUrl={logoUrl} />
    </>
  );
}
