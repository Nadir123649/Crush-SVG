"use client";
 
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Toaster, ToastBar, toast } from "react-hot-toast";
import { dismissStaleToastsOnRoute } from "@/lib/client/toast-bridge";

export function ToastProvider() {
  const pathname = usePathname();
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    dismissStaleToastsOnRoute();
  }, [pathname]);

  return (
    <Toaster
      position="top-right"
      gutter={10}
      containerStyle={{ zIndex: 99999 }}
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
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <>
              {icon}
              <div className="flex-1">{message}</div>
              {t.type !== "loading" && (
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  aria-label="Close"
                  className="ml-2 inline-flex items-center justify-center rounded p-1 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
