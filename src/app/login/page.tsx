import React from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { GuestOnly } from "@/components/auth/GuestOnly";

import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Log in | CrushSVG",
  description: "Log in to your CrushSVG account to convert SVGs to PNGs without limits.",
  noindex: true,
});

export default function LoginPage() {
  return (
    <GuestOnly>
      <div className="w-full flex justify-center py-[40px] md:py-[60px] px-[16px] md:px-0 min-h-[75vh] items-center">

        <AuthCard type="login" />
      </div>
    </GuestOnly>
  );
}
