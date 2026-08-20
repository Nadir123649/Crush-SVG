"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "12px",
          background: "#FFFFFF",
          color: "#1E293B",
          fontFamily: "var(--font-afacad)",
          fontSize: "14px",
          lineHeight: "1.35",
          padding: "12px 16px",
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.12)",
        },
        success: {
          iconTheme: { primary: "#10B981", secondary: "#FFFFFF" },
        },
        error: {
          iconTheme: { primary: "#D94A1E", secondary: "#FFFFFF" },
        },
      }}
    />
  );
}
