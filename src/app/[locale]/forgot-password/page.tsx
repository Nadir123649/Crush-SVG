import React from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ForgotPasswordCard } from "@/components/auth/ForgotPasswordCard";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { constructLocalizedMetadata } from "@/lib/seo";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return constructLocalizedMetadata({
    locale,
    routeKey: "/forgot-password",
    title: "Forgot Password | CrushSVG",
    description: "Reset your CrushSVG password.",
    noindex: true,
  });
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <GuestOnly>
      <div className="w-full flex justify-center py-[40px] md:py-[60px] px-[16px] md:px-0 min-h-[75vh] items-center">
        <ForgotPasswordCard />
      </div>
    </GuestOnly>
  );
}
