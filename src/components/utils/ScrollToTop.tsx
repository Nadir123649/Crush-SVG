"use client";

import { useEffect } from "react";

export function ScrollToTop() {
  useEffect(() => {
    // Disable browser's automatic scroll restoration on refresh
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Fix cross-page hash navigation for Next.js App Router
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          const isMobile = window.innerWidth < 768;
          const navbarHeight = isMobile ? 66 : 92;
          const gap = 4;
          const offset = navbarHeight + gap;
          const elementPosition = el.getBoundingClientRect().top + window.scrollY;
          
          window.scrollTo({
            top: elementPosition - offset,
            behavior: "smooth"
          });
        }
      }, 100);
    }
  }, []);
  
  return null;
}
