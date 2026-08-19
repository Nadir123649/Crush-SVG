"use client";

import React, { useState } from "react";

interface CodeBlockProps {
  code: string;
  label?: string;
}

export function CodeBlock({ code, label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between px-[16px] py-[8px] bg-[#2B2F33] rounded-t-[12px] border-b border-white/10">
          <span className="font-body text-[12px] font-medium text-[#A9A9A9] tracking-[0.08em] uppercase">
            {label}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="font-body text-[12px] text-[#FF9A3D] hover:text-white transition-colors cursor-pointer"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
      <pre
        className={`w-full overflow-x-auto bg-[#353A3E] text-[13px] md:text-[14px] leading-[1.6] text-[#F5F0EB] p-[16px] md:p-[20px] font-mono whitespace-pre ${
          label ? "rounded-b-[12px]" : "rounded-[12px]"
        }`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}