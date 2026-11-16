"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/client/http";

type SubscribeState = "idle" | "loading" | "success" | "error";

function NewsletterIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 220"
      className="h-[126px] w-[184px] shrink-0 sm:h-[150px] sm:w-[220px] lg:h-[176px] lg:w-[260px]"
      fill="none"
    >
      {/* Soft backdrop and dotted flight path from the reference artwork */}
      <path d="M40 141c-23-21-12-58 16-67 5-30 41-43 65-26 22-21 61-10 68 19 31-3 51 27 39 52 23 25 8 63-24 65H67c-31 0-48-19-27-43Z" fill="#FBE1D7" />
      <path d="M184 57c25 8 40-5 41-21 1-14-14-21-27-17" stroke="#D8C6BF" strokeWidth="2.5" strokeDasharray="5 7" strokeLinecap="round" />
      <path d="m224 20 58-16-31 56-9-23-18-17Z" fill="#FF763B" />
      <path d="m242 37 40-33-31 56-9-23Z" fill="#D94A1E" />
      <path d="m31 75 12 14m-22 9 19 3m-3-38 7 16" stroke="#E95220" strokeWidth="4" strokeLinecap="round" />
      {/* Envelope back sits behind the letter */}
      <path d="m43 113 84-47c7-4 15-4 22 0l86 47-18 78c-2 9-10 14-19 13l-133-17c-9-1-15-9-14-18l-8-56Z" fill="#F45B23" />
      {/* Letter, clearly visible above the envelope edge */}
      <path d="m77 72 101-18c8-2 15 3 17 11l15 80-123 22-19-80c-2-7 2-13 9-15Z" fill="#FFFCFA" />
      <path d="m94 90 65-12m-60 28 73-13m-69 29 73-13" stroke="#DED8D4" strokeWidth="7" strokeLinecap="round" />
      {/* Folded envelope front */}
      <path d="m43 113 92 59 100-59-9 80c-1 9-9 14-18 13l-133-17c-9-1-15-9-14-18l-8-58Z" fill="#FF9A66" />
      <path d="m43 113 92 59-65 44c-9 6-22 0-23-11l-4-92Z" fill="#E94A1D" />
      <path d="m235 113-100 59 67 39c10 6 22-1 23-12l10-86Z" fill="#D94A1E" />
      <path d="m43 113 92 59 100-59-17 91-83-25-82 23-10-89Z" fill="#F96B35" />
    </svg>
  );
}

export function NewsletterSignup() {
  const t = useTranslations("footer");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubscribeState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading" || !email.trim()) return;

    setStatus("loading");
    try {
      await apiFetch<{ message: string }>("/api/v1/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), source: "footer" }),
      });
      setEmail("");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section
      aria-labelledby="footer-newsletter-title"
      className="w-full max-w-[1536px] mx-auto px-[16px] sm:px-[32px] md:px-[40px] pt-[28px] pb-[12px]"
    >
      <div className="relative isolate overflow-hidden rounded-[22px] border border-[#F4D4C8] bg-gradient-to-br from-[#FFF8F5] to-[#FCE8DF] px-[20px] py-[24px] sm:px-[32px] sm:py-[28px] lg:px-[40px] lg:py-[26px]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 -z-10 h-56 w-56 rounded-full bg-[#F8CDBD]/20" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-12 -z-10 h-44 w-44 rounded-full bg-[#F8CDBD]/20" />

        <div className="grid items-center gap-x-7 gap-y-5 xl:grid-cols-[250px_minmax(0,1fr)_minmax(390px,0.95fr)]">
          <div className="hidden items-center justify-center xl:flex">
            <NewsletterIllustration />
          </div>

          <div className="min-w-0 text-center xl:text-left">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#F5C6B5] bg-[#FFE5DB] px-4 py-2 text-[13px] font-semibold text-brand-primary xl:mx-0">
              <svg aria-hidden="true" viewBox="0 0 20 16" className="h-4 w-5" fill="none">
                <rect x="1.25" y="1.25" width="17.5" height="13.5" rx="2.5" stroke="currentColor" strokeWidth="2" />
                <path d="m2.5 3 7.5 5.5L17.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t("newsletterEyebrow")}
            </div>

            <h2 id="footer-newsletter-title" className="mt-3 font-heading text-[22px] font-semibold leading-tight tracking-tight text-[#202427] sm:text-[27px] lg:text-[29px]">
              {t("newsletterTitleMain")} <span className="text-brand-primary">{t("newsletterTitleHighlight")}</span>
            </h2>
            <p className="mt-3 font-body text-[14px] leading-5 text-[#4B5563] sm:text-[15px]">
              {t("newsletterDescription")}
            </p>
          </div>

          <div className="w-full min-w-0">
            {status === "success" ? (
              <div role="status" className="flex min-h-[58px] items-center justify-center gap-2 rounded-[14px] border border-[#B8E4CF] bg-white/90 px-4 text-center font-body text-[14px] font-medium text-[#18794E]">
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 shrink-0" fill="none">
                  <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="m6 10 2.6 2.6L14.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t("newsletterSuccess")}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
                <label htmlFor="footer-newsletter-email" className="sr-only">{t("newsletterEmailLabel")}</label>
                <div className="flex h-[56px] min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-[#E7D7D0] bg-white/95 px-4 shadow-[0_2px_8px_rgba(32,36,39,0.04)] focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15">
                  <svg aria-hidden="true" viewBox="0 0 22 18" className="h-[18px] w-[22px] shrink-0 text-[#64748B]" fill="none">
                    <rect x="1.25" y="1.25" width="19.5" height="15.5" rx="3" stroke="currentColor" strokeWidth="2" />
                    <path d="m2.5 3 8.5 6.3L19.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder={t("newsletterEmailPlaceholder")}
                    disabled={status === "loading"}
                    className="min-w-0 flex-1 bg-transparent font-body text-[14px] text-text-dark outline-none placeholder:text-[#64748B] disabled:opacity-60 sm:text-[15px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading" || !email.trim()}
                  className="inline-flex h-[56px] shrink-0 items-center justify-center gap-3 rounded-[14px] bg-gradient-to-r from-[#D94A1E] to-[#FF7130] px-6 font-heading text-[14px] font-semibold text-white shadow-[0_3px_10px_rgba(217,74,30,0.18)] transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:px-7"
                >
                  {status === "loading" ? t("newsletterSubmitting") : t("newsletterSubscribe")}
                  <svg aria-hidden="true" viewBox="0 0 22 16" className="h-4 w-[22px]" fill="none">
                    <path d="M1 8h19M13 1l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            )}

            {status === "error" && (
              <p role="alert" className="mt-2 text-center font-body text-[13px] text-red-600 sm:text-left">
                {t("newsletterError")}
              </p>
            )}

            <p className="mt-3 flex items-center justify-center gap-2 font-body text-[12px] text-[#4B5563] sm:justify-start sm:pl-1 sm:text-[13px]">
              <svg aria-hidden="true" viewBox="0 0 20 24" className="h-[20px] w-[17px] shrink-0" fill="none">
                <path d="m10 1 8 3v6c0 5.2-3.4 9.7-8 12-4.6-2.3-8-6.8-8-12V4l8-3Z" fill="#10A66A" />
                <path d="m6 11 2.5 2.5L14 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t("newsletterPrivacy")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
