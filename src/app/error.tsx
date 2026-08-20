"use client";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="w-full flex flex-col items-center py-[100px] text-center px-[24px]">
      <h1 className="font-heading font-bold text-[28px] leading-[100%] text-[#353A3E]">Something went wrong</h1>
      <p className="font-body font-normal text-[15px] text-[#64748B] mt-[12px] max-w-[420px] leading-[22px]">
        {error.digest ? `An unexpected error occurred. Reference: ${error.digest}` : "An unexpected error occurred. Please try again."}
      </p>
      <div className="flex items-center gap-[12px] mt-[28px]">
        <button
          type="button"
          onClick={reset}
          className="h-[42px] px-[24px] rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-body font-medium text-[15px] hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
        <Link
          href="/"
          className="h-[42px] px-[24px] rounded-[12px] border border-[#8F8F8F] text-[#353A3E] font-body font-medium text-[15px] flex items-center hover:bg-gray-50 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
