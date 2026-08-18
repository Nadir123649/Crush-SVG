import React from "react";
import { ForgotPasswordCard } from "@/components/auth/ForgotPasswordCard";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { ScrollToTop } from "@/components/utils/ScrollToTop";

export default function ForgotPasswordPage() {
  return (
    <GuestOnly>
      <div className="w-full flex justify-center py-[40px] md:py-[60px] px-[16px] md:px-0">
        <ScrollToTop />
        <ForgotPasswordCard />
      </div>
    </GuestOnly>
  );
}
