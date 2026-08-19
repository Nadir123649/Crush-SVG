import React from "react";
import type { Metadata } from "next";
import { ScrollToTop } from "@/components/utils/ScrollToTop";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { EndpointCard } from "@/components/docs/EndpointCard";
import { PostmanLinks } from "@/components/docs/PostmanLinks";
import { apiSections, rateLimitTable, errorCodeTable } from "@/app/api-docs/endpoints";

export const metadata: Metadata = {
  title: "API Reference | CrushSVG",
  description:
    "Public API documentation for CrushSVG — convert SVG to pixel-perfect PNG programmatically. Authentication, rate limits, endpoints, and code samples.",
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crush-svg.vercel.app";

export default function ApiDocsPage() {
  return (
    <div className="w-full flex flex-col items-center md:py-[60px] min-h-[60vh]">
      <ScrollToTop />

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center max-w-[800px] mb-[40px] md:mb-[60px]">
        <h1 className="font-heading font-semibold text-[32px] leading-[40px] md:text-[56px] md:leading-[61px] tracking-[0.04em] text-text-dark mb-[16px]">
          API <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">Reference</span>
        </h1>
        <p className="font-afacad text-[16px] md:text-[20px] text-text-muted leading-[1.5] max-w-[640px]">
          Convert SVG to pixel-perfect PNG from any application. Authenticate with Bearer tokens,
          convert up to 4000&times;4000 px, and ship production-ready integrations in minutes.
        </p>
        <div className="flex items-center gap-[8px] mt-[20px]">
          <span className="inline-flex items-center h-[28px] px-[12px] bg-white border border-[#F2EDE8] rounded-[8px] font-mono text-[13px] text-text-dark">
            {BASE_URL}
          </span>
          <span className="inline-flex items-center h-[28px] px-[12px] bg-[#FCF1ED] rounded-[8px] font-body text-[13px] font-medium text-text-dark">
            v1
          </span>
        </div>
      </div>

      {/* Quickstart */}
      <div className="w-full max-w-[900px] mb-[40px] md:mb-[60px] flex flex-col gap-[16px]">
        <section className="w-full flex flex-col bg-white rounded-[16px] p-[24px] md:p-[40px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[28px] text-text-dark mb-[8px]">
            Quickstart
          </h2>
          <p className="font-afacad text-[15px] md:text-[16px] text-text-muted leading-[1.6] mb-[16px]">
            Convert your first SVG to PNG in three lines — no account required (guests get 3 free conversions
            per 10 minutes). Sign up for unlimited conversions.
          </p>
          <CodeBlock
            label="First conversion"
            code={`curl -X POST ${BASE_URL}/api/v1/convert \\
  -H "Content-Type: application/json" \\
  -d '{
  "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 100 100\\"><circle cx=\\"50\\" cy=\\"50\\" r=\\"40\\" fill=\\"#D94A1E\\"/></svg>",
  "width": 512
}'`}
          />
          <PostmanLinks />
        </section>

        {/* Response envelope */}
        <section className="w-full flex flex-col bg-white rounded-[16px] p-[24px] md:p-[40px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[28px] text-text-dark mb-[8px]">
            Response Envelope
          </h2>
          <p className="font-afacad text-[15px] md:text-[16px] text-text-muted leading-[1.6] mb-[16px]">
            Every endpoint returns the same envelope. Check <code className="font-mono text-[13px] text-brand-primary">success</code> first —
            when it is <code className="font-mono text-[13px] text-brand-primary">false</code>, read{" "}
            <code className="font-mono text-[13px] text-brand-primary">payload.error.code</code> for a machine-readable error
            identifier. A few legacy routes (e.g. GET /api/me, GET /api/v1/health) return raw objects instead.
          </p>
          <CodeBlock
            label="Success"
            code={`{
  "success": true,
  "version": "1.0.0",
  "payload": { ...data... },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`}
          />
          <div className="h-[12px]" />
          <CodeBlock
            label="Error"
            code={`{
  "success": false,
  "version": "1.0.0",
  "payload": {
    "error": { "code": "validation_error", "message": "..." }
  },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`}
          />
        </section>

        {/* Authentication */}
        <section className="w-full flex flex-col bg-white rounded-[16px] p-[24px] md:p-[40px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[28px] text-text-dark mb-[8px]">
            Authentication
          </h2>
          <p className="font-afacad text-[15px] md:text-[16px] text-text-muted leading-[1.6] mb-[16px]">
            Protected endpoints accept a <strong className="text-text-dark">Bearer access token</strong> in the{" "}
            <code className="font-mono text-[13px] text-brand-primary">Authorization</code> header. Access tokens expire after{" "}
            <strong className="text-text-dark">15 minutes</strong>. When a request returns 401 with code{" "}
            <code className="font-mono text-[13px] text-brand-primary">unauthorized</code>, call{" "}
            <code className="font-mono text-[13px] text-brand-primary">POST /api/v1/auth/refresh</code> — the refresh token is
            stored in the <code className="font-mono text-[13px] text-brand-primary">crushsvg_refresh</code> cookie, which
            same-origin requests send automatically. Guests (no token) are tracked by a{" "}
            <code className="font-mono text-[13px] text-brand-primary">gid</code> cookie and get 3 conversions per 10 minutes.
          </p>
          <CodeBlock
            label="Signed-in request"
            code={`curl ${BASE_URL}/api/v1/profile \\
  -H "Authorization: Bearer <accessToken>"`}
          />
          <div className="h-[12px]" />
          <CodeBlock
            label="Token refresh (same-origin, cookie sent automatically)"
            code={`const res = await fetch("${BASE_URL}/api/v1/auth/refresh", {
  method: "POST"
});
const { payload } = await res.json();
// payload.token.accessToken -> use for subsequent requests`}
          />
        </section>

        {/* Rate limits */}
        <section className="w-full flex flex-col bg-white rounded-[16px] p-[24px] md:p-[40px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[28px] text-text-dark mb-[8px]">
            Rate Limits
          </h2>
          <p className="font-afacad text-[15px] md:text-[16px] text-text-muted leading-[1.6] mb-[16px]">
            Limits are per IP address over a sliding window. On a limit hit the API returns 429 with code{" "}
            <code className="font-mono text-[13px] text-brand-primary">rate_limit_exceeded</code> and a{" "}
            <code className="font-mono text-[13px] text-brand-primary">Retry-After</code> header. Separate from IP limits,
            guests are limited to <strong className="text-text-dark">3 conversions per 10 minutes</strong> (429{" "}
            <code className="font-mono text-[13px] text-brand-primary">limit_reached</code>) and logins lock briefly after
            repeated failures (429 <code className="font-mono text-[13px] text-brand-primary">account_locked</code>).
          </p>
          <div className="w-full overflow-x-auto border border-[#F2EDE8] rounded-[12px]">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="bg-[#FCF1ED]/60">
                  <th className="px-[14px] py-[10px] font-heading font-semibold text-[13px] text-text-dark">Endpoint</th>
                  <th className="px-[14px] py-[10px] font-heading font-semibold text-[13px] text-text-dark">Limit (per IP)</th>
                </tr>
              </thead>
              <tbody>
                {rateLimitTable.map((row) => (
                  <tr key={row.endpoint} className="border-t border-[#F2EDE8]">
                    <td className="px-[14px] py-[10px] font-mono text-[13px] text-text-dark">{row.endpoint}</td>
                    <td className="px-[14px] py-[10px] font-mono text-[13px] text-brand-primary">{row.limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Error codes */}
        <section className="w-full flex flex-col bg-white rounded-[16px] p-[24px] md:p-[40px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[28px] text-text-dark mb-[8px]">
            Error Codes
          </h2>
          <p className="font-afacad text-[15px] md:text-[16px] text-text-muted leading-[1.6] mb-[16px]">
            Machine-readable codes returned in{" "}
            <code className="font-mono text-[13px] text-brand-primary">payload.error.code</code>. Some routes return an empty
            code on generic failures — always fall back to the HTTP status code.
          </p>
          <div className="w-full overflow-x-auto border border-[#F2EDE8] rounded-[12px]">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="bg-[#FCF1ED]/60">
                  <th className="px-[14px] py-[10px] font-heading font-semibold text-[13px] text-text-dark">Status</th>
                  <th className="px-[14px] py-[10px] font-heading font-semibold text-[13px] text-text-dark">Code</th>
                  <th className="px-[14px] py-[10px] font-heading font-semibold text-[13px] text-text-dark">Description</th>
                </tr>
              </thead>
              <tbody>
                {errorCodeTable.map((err) => (
                  <tr key={err.code} className="border-t border-[#F2EDE8]">
                    <td className="px-[14px] py-[10px] font-mono text-[13px] text-text-dark whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center min-w-[36px] h-[22px] px-[6px] rounded-[4px] font-semibold text-[12px] ${
                        err.status >= 500
                          ? "bg-[#EF4444]/10 text-[#DC2626]"
                          : err.status === 429
                            ? "bg-[#F59E0B]/10 text-[#B45309]"
                            : "bg-[#D94A1E]/10 text-brand-primary"
                      }`}>
                        {err.status}
                      </span>
                    </td>
                    <td className="px-[14px] py-[10px] font-mono text-[13px] text-brand-primary whitespace-nowrap">{err.code}</td>
                    <td className="px-[14px] py-[10px] font-afacad text-[13px] text-text-body leading-[1.5]">{err.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Endpoints */}
      <div className="w-full max-w-[900px] flex flex-col gap-[48px] md:gap-[64px]">
        {apiSections.map((section) => (
          <div key={section.title} className="w-full flex flex-col gap-[24px]">
            <div className="flex flex-col gap-[4px]">
              <h2 className="font-heading font-semibold text-[28px] md:text-[36px] text-text-dark tracking-[0.02em]">
                {section.title}
              </h2>
              <p className="font-afacad text-[15px] md:text-[17px] text-text-muted leading-[1.6] max-w-[720px]">
                {section.description}
              </p>
            </div>
            <div className="w-full flex flex-col gap-[24px]">
              {section.endpoints.map((endpoint) => (
                <EndpointCard key={`${endpoint.method} ${endpoint.path}`} endpoint={endpoint} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}