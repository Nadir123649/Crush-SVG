import React from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { ScrollToTop } from "@/components/utils/ScrollToTop";

export default function SignupPage() {
  return (
    <div className="w-full flex justify-center py-[40px] md:py-[60px] px-[16px] md:px-0 min-h-[75vh] items-center">
      <ScrollToTop />
      <AuthCard type="signup" />
    </div>
  );
}
