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
          borderRadius: "14px",
          background: "#FFFFFF",
          color: "#202427",
          border: "1px solid rgba(32, 36, 39, 0.08)",
          fontFamily: "var(--font-afacad)",
          fontSize: "14px",
          lineHeight: "1.45",
          fontWeight: 500,
          padding: "12px 16px",
          maxWidth: "380px",
          boxShadow:
            "0 12px 32px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.06)",
        },
        success: {
          iconTheme: { primary: "#10B981", secondary: "#FFFFFF" },
          duration: 3500,
        },
        error: {
          iconTheme: { primary: "#D94A1E", secondary: "#FFFFFF" },
          duration: 5000,
        },
      }}
    />
  );
}
