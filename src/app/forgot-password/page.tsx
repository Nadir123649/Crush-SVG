import React from "react";
import { ForgotPasswordCard } from "@/components/auth/ForgotPasswordCard";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Forgot Password | CrushSVG",
  description: "Reset your CrushSVG password.",
  noindex: true,
});

export default function ForgotPasswordPage() {
  return (
    <div className="w-full flex justify-center py-[40px] md:py-[60px] px-[16px] md:px-0 min-h-[75vh] items-center">
      <ForgotPasswordCard />
    </div>
  );
}
