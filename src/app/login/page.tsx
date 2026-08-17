import React from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { ScrollToTop } from "@/components/utils/ScrollToTop";

export default function LoginPage() {
  return (
    <div className="w-full flex justify-center py-[40px] md:py-[60px] px-[16px] md:px-0">
      <ScrollToTop />
      <AuthCard type="login" />
    </div>
  );
}
