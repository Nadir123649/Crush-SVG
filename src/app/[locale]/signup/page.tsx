import React from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/components/auth/AuthCard";
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
    routeKey: "/signup",
    title: "Sign Up | CrushSVG",
    description: "Create a free CrushSVG account to convert SVGs to PNGs without limits.",
    noindex: true,
  });
}

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <GuestOnly>
      <div className="w-full flex justify-center py-[40px] md:py-[60px] px-[16px] md:px-0 min-h-[75vh] items-center">
        <AuthCard type="signup" />
      </div>
    </GuestOnly>
  );
}
