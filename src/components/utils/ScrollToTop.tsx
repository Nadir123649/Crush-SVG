"use client";

import { useEffect } from "react";

export function ScrollToTop() {
  useEffect(() => {
    // Disable browser's automatic scroll restoration on refresh
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);
  
  return null;
}
