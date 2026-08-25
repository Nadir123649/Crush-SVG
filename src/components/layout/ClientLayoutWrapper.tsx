"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/sections/Footer";
import { ScrollToTop } from "@/components/utils/ScrollToTop";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <main id="main-content" className="w-full flex-1 h-screen overflow-hidden bg-[#FFFCFA]">{children}</main>;
  }

  return (
    <>
      <Header />
      <ScrollToTop />
      <div className="w-full max-w-[1440px] mx-auto px-[16px] md:px-[80px] flex flex-col flex-1">
        <main id="main-content" className="w-full flex-1">
          {children}
        </main>
      </div>
      <Footer />
    </>
  );
}
