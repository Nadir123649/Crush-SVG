"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

import "swagger-ui-react/swagger-ui.css";

export default function SwaggerUIPage() {
  const [spec, setSpec] = useState(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/openapi")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load spec: ${res.status}`);
        return res.json();
      })
      .then(setSpec)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-[#E8490F] mb-2">
            Failed to load API spec
          </h1>
          <p className="text-[#94A3B8] font-body">{error}</p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-[#94A3B8] font-body">Loading API docs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI spec={spec} docExpansion="list" deepLinking />
    </div>
  );
}
