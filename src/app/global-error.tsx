"use client";

import React, { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#FFFCFA" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "24px", textAlign: "center" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#353A3E", marginBottom: "12px" }}>
            Critical error occurred
          </h1>
          <p style={{ fontSize: "15px", color: "#64748B", maxWidth: "420px", lineHeight: "1.5", marginBottom: "28px" }}>
            {error.digest ? `Reference: ${error.digest}` : "A critical system error occurred. Please refresh or try again."}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              height: "44px",
              padding: "0 28px",
              borderRadius: "12px",
              background: "linear-gradient(to right, #D94A1E, #FF9A3D)",
              color: "#FFFFFF",
              fontWeight: "600",
              fontSize: "15px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
