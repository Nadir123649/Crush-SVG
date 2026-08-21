import React from "react";
import { constructMetadata } from "@/lib/seo";
import { ResetPasswordCard } from "@/components/auth/ResetPasswordCard";

export const metadata = constructMetadata({
  title: "Reset Password | CrushSVG",
  description: "Reset your CrushSVG password.",
  noindex: true,
});
export default function ResetPasswordPage() {
  return (
    <div className="w-full flex justify-center py-[40px] md:py-[60px] px-[16px] md:px-0 min-h-[75vh] items-center">
      <ResetPasswordCard />
    </div>
  );
}
