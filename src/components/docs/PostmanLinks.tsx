"use client";

import React, { useSyncExternalStore } from "react";

export function PostmanLinks() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const origin = mounted ? window.location.origin : "";
  const collectionUrl = origin
    ? `${origin}/postman/crushsvg-api.postman_collection.json`
    : "";
  const isLocal = origin ? /^http:\/\/(localhost|127\.0\.0\.1)/.test(origin) : false;

  return (
    <div className="flex flex-col gap-[10px] mt-[16px]">
      <div className="flex flex-wrap items-center gap-[10px]">
        {origin && (
          <a
            href={`https://www.postman.com/auto-detect?collection=${encodeURIComponent(collectionUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center h-[40px] px-[18px] rounded-[10px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-body font-semibold text-[14px] hover:opacity-90 transition-opacity"
          >
            Import into Postman
          </a>
        )}
        {origin && (
          <a
            href={collectionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center h-[40px] px-[18px] rounded-[10px] bg-white border border-[#F2EDE8] text-text-dark font-body font-semibold text-[14px] hover:border-brand-primary/40 transition-colors"
          >
            Download collection (.json)
          </a>
        )}
        <span className="font-afacad text-[13px] text-text-muted">
          Includes all 25 endpoints with pre-configured auth and test scripts.
        </span>
      </div>
      {isLocal && (
        <p className="font-afacad text-[13px] text-text-muted">
          One-click import works on the deployed site. Running locally? Download the
          collection and use Postman&apos;s{" "}
          <strong className="text-text-dark">Import → File</strong> instead.
        </p>
      )}
    </div>
  );
}