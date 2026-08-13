import React from "react";
import { AuthCard } from "@/components/auth/AuthCard";

export default function SignupPage() {
  return (
    <div className="w-full flex justify-center py-[60px]">
      <AuthCard type="signup" />
    </div>
  );
}
