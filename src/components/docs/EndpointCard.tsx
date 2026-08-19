import React from "react";
import { CodeBlock } from "@/components/docs/CodeBlock";
import type { ApiEndpoint } from "@/app/api-docs/endpoints";

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-[#10B981]/10 text-[#0E9F6E] border-[#10B981]/30",
  POST: "bg-brand-primary/10 text-brand-primary border-brand-primary/30",
  PATCH: "bg-[#F59E0B]/10 text-[#B45309] border-[#F59E0B]/30",
  DELETE: "bg-[#EF4444]/10 text-[#DC2626] border-[#EF4444]/30",
};

const AUTH_LABELS: Record<string, string> = {
  none: "Public",
  guest: "Guest",
  optional: "Optional token",
  bearer: "Bearer token",
  cookie: "Refresh cookie",
};

export function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <section className="w-full flex flex-col bg-white rounded-[16px] p-[24px] md:p-[40px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-[12px] mb-[16px]">
        <span className={`inline-flex items-center justify-center w-[76px] h-[28px] rounded-[6px] border font-body font-semibold text-[13px] tracking-[0.06em] ${METHOD_STYLES[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="font-mono text-[15px] md:text-[17px] text-text-dark font-semibold break-all">
          {endpoint.path}
        </code>
      </div>

      <h3 className="font-heading font-semibold text-[20px] md:text-[24px] text-text-dark mb-[8px]">
        {endpoint.title}
      </h3>
      <p className="font-afacad text-[15px] md:text-[16px] text-text-muted leading-[1.6] mb-[16px]">
        {endpoint.description}
      </p>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-[8px] mb-[20px]">
        <span className="inline-flex items-center h-[26px] px-[10px] bg-[#FCF1ED] rounded-[6px] font-body text-[12px] font-medium text-text-dark">
          Auth: {AUTH_LABELS[endpoint.auth]}
        </span>
        {endpoint.rateLimit && (
          <span className="inline-flex items-center h-[26px] px-[10px] bg-[#FCF1ED] rounded-[6px] font-body text-[12px] font-medium text-text-dark">
            Rate limit: {endpoint.rateLimit}
          </span>
        )}
      </div>

      {/* Request params */}
      {endpoint.params && endpoint.params.length > 0 && (
        <div className="mb-[20px]">
          <h4 className="font-heading font-semibold text-[16px] text-text-dark mb-[10px]">Request Parameters</h4>
          <div className="w-full overflow-x-auto border border-[#F2EDE8] rounded-[12px]">
            <table className="w-full min-w-[480px] text-left">
              <thead>
                <tr className="bg-[#FCF1ED]/60">
                  <th className="px-[14px] py-[10px] font-heading font-semibold text-[13px] text-text-dark">Name</th>
                  <th className="px-[14px] py-[10px] font-heading font-semibold text-[13px] text-text-dark">Type</th>
                  <th className="px-[14px] py-[10px] font-heading font-semibold text-[13px] text-text-dark">Required</th>
                  <th className="px-[14px] py-[10px] font-heading font-semibold text-[13px] text-text-dark">Description</th>
                </tr>
              </thead>
              <tbody>
                {endpoint.params.map((param) => (
                  <tr key={param.name} className="border-t border-[#F2EDE8]">
                    <td className="px-[14px] py-[10px] font-mono text-[13px] text-brand-primary whitespace-nowrap">{param.name}</td>
                    <td className="px-[14px] py-[10px] font-mono text-[13px] text-text-dark whitespace-nowrap">{param.type}</td>
                    <td className="px-[14px] py-[10px] font-body text-[13px] text-text-muted">
                      {param.required ? (
                        <span className="text-[#0E9F6E] font-medium">Yes</span>
                      ) : (
                        "No"
                      )}
                    </td>
                    <td className="px-[14px] py-[10px] font-afacad text-[13px] text-text-body leading-[1.5]">{param.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request example */}
      {endpoint.curl && (
        <div className="mb-[20px] flex flex-col gap-[12px]">
          <CodeBlock code={endpoint.curl} label="Request (cURL)" />
          {endpoint.javascript && (
            <CodeBlock code={endpoint.javascript} label="Request (JavaScript)" />
          )}
        </div>
      )}

      {/* Response example */}
      {endpoint.response && (
        <div className="mb-[20px]">
          <CodeBlock code={endpoint.response} label="Response" />
        </div>
      )}

      {/* Errors */}
      {endpoint.errors && endpoint.errors.length > 0 && (
        <div>
          <h4 className="font-heading font-semibold text-[16px] text-text-dark mb-[10px]">Errors</h4>
          <div className="w-full overflow-x-auto border border-[#F2EDE8] rounded-[12px]">
            <table className="w-full min-w-[480px] text-left">
              <thead>
                <tr className="bg-[#FCF1ED]/60">
                  <th className="px-[14px] py-[10px] font-heading font-semibold text-[13px] text-text-dark">Status</th>
                  <th className="px-[14px] py-[10px] font-heading font-semibold text-[13px] text-text-dark">Code</th>
                  <th className="px-[14px] py-[10px] font-heading font-semibold text-[13px] text-text-dark">Description</th>
                </tr>
              </thead>
              <tbody>
                {endpoint.errors.map((err) => (
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
        </div>
      )}
    </section>
  );
}