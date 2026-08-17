import React from "react";

export default function Loading() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-[120px]">
      <div className="w-[32px] h-[32px] rounded-full border-[3px] border-[#F2EDE8] border-t-brand-primary animate-spin" />
      <p className="font-body font-normal text-[14px] text-[#64748B] mt-[16px]">Loading…</p>
    </div>
  );
}
