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
    return <span>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>;
  }
  
  if (format === "long") {
    const day = d.getDate();
    const month = d.toLocaleString('en-GB', { month: 'short' });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return <span>{`${day} ${month}, ${year} ${time}`}</span>;
  }

  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'short' });
  return <span>{`${day} ${month}`}</span>;
}
