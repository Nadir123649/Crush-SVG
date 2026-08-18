"use client";

import { useEffect } from "react";

export function ScrollToTop() {
  useEffect(() => {
    // Force scroll to top instantly
    window.scrollTo(0, 0);
    // Double ensure for Next.js app router which sometimes delays layout shifts
    const t = setTimeout(() => window.scrollTo(0, 0), 50);
    return () => clearTimeout(t);
  }, []);
  
  return null;
}
