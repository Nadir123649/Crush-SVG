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

  return (
    <div className="api-docs-page w-full bg-[#FFFCFA]">
      <div className="mx-auto w-full max-w-[1440px] px-[16px] py-[28px] md:px-[40px] md:py-[48px] lg:px-[80px]">
        <section className="mb-[28px] rounded-[20px] border border-[#F2E4DC] bg-gradient-to-br from-white via-[#FFFCFA] to-[#FFF2EB] px-[22px] py-[26px] shadow-[0_8px_32px_rgba(32,36,39,0.05)] md:mb-[36px] md:px-[40px] md:py-[38px]">
          <div className="mb-[12px] inline-flex items-center gap-[8px] rounded-full border border-[#D94A1E]/20 bg-white/80 px-[12px] py-[6px] font-body text-[12px] font-semibold text-[#D94A1E]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#D94A1E]" />
            DEVELOPER RESOURCE
          </div>
          <h1 className="font-heading text-[30px] font-bold leading-tight text-[#202427] md:text-[42px]">
            CrushSVG API documentation
          </h1>
          <p className="mt-[10px] max-w-[720px] font-body text-[15px] leading-relaxed text-[#57534E] md:text-[17px]">
            Explore endpoints, review request and response formats, and try API calls directly in the interactive reference below.
          </p>
          <div className="mt-[20px] flex flex-wrap gap-[8px]">
            {["SVG to PNG", "Raster to SVG", "Background removal", "Usage"].map((item) => (
              <span key={item} className="rounded-[8px] border border-[#EAEAEA] bg-white px-[10px] py-[6px] font-body text-[12px] font-medium text-[#4B5563]">
                {item}
              </span>
            ))}
          </div>
        </section>

        {error ? (
          <div role="alert" className="rounded-[16px] border border-red-200 bg-white p-[24px] text-center shadow-sm">
            <h2 className="font-heading text-[22px] font-bold text-[#202427]">Couldn’t load the API reference</h2>
            <p className="mt-[8px] font-body text-[14px] text-[#64748B]">{error}</p>
          </div>
        ) : !spec ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-[16px] border border-[#F2EDE8] bg-white font-body text-[#64748B] shadow-sm" aria-live="polite">
            Loading API reference…
          </div>
        ) : (
          <div className="api-docs-reference rounded-[16px] border border-[#F2EDE8] bg-white p-[12px] shadow-[0_8px_32px_rgba(32,36,39,0.05)] md:p-[24px]">
            <SwaggerUI spec={spec} docExpansion="list" deepLinking />
          </div>
        )}
      </div>
    </div>
  );
}
