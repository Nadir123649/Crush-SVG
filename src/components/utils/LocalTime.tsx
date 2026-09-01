"use client";

import React, { useEffect, useState } from "react";

export function LocalTime({ 
  date, 
  format = "short" 
}: { 
  date: string | Date; 
  format?: "short" | "long" | "time" 
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return empty or a stable fallback to prevent hydration mismatch
    return <span className="opacity-0">Loading...</span>;
  }

  const d = new Date(date);
  
  if (format === "time") {
    return <span>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
  }
  
  if (format === "long") {
    return <span>{d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}</span>;
  }

  return <span>{d.toLocaleString()}</span>;
}
