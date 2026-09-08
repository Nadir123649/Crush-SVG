"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { showToast } from "@/lib/client/toast-bridge";
import { Hero } from "@/components/sections/Hero";

export function ContactUsClient() {
  const t = useTranslations("contact_page");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHasSubmitted(true);
    
    if (!name.trim() || name.trim().length < 3) return;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (!message.trim() || message.trim().length < 10) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast("success", t("successMsg"));
      setName("");
      setEmail("");
      setMessage("");
      setHasSubmitted(false);
      setMessageSent(true);
    }, 1000);
  };

  const isNameInvalid = hasSubmitted && (!name.trim() || name.trim().length < 3);
  const isEmailInvalid = hasSubmitted && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  const isMessageInvalid = hasSubmitted && (!message.trim() || message.trim().length < 10);

  return (
    <div className="w-full flex flex-col items-center md:pb-[60px] min-h-[60vh]">
      {/* Header Section */}
      <Hero
        badge={t("badge")}
        title={<>{t("title").split(" ")[0]} <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">{t("title").split(" ").slice(1).join(" ") || "Us"}</span></>}
        subtitle={<>{t("subtitle")} <Link href="/team" className="text-brand-primary hover:underline font-medium">our team</Link> at <a href="https://www.thenevon.com" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-medium">The Nevon</a>.</>}
        className="mb-[24px] md:mb-[40px]"
      />

      {/* Quick Self-Help Navigation Cards */}
      <div className="w-full max-w-[600px] grid grid-cols-3 gap-3 mb-6 text-center">
        <Link
          href="/help"
          className="p-3.5 rounded-xl bg-white border border-[#F2EDE8] hover:border-brand-primary transition-all group"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}
        >
          <span className="block font-heading font-semibold text-xs md:text-sm text-text-dark group-hover:text-brand-primary">
            {t("quickHelp")}
          </span>
          <span className="block font-afacad text-[12px] text-text-muted mt-0.5">{t("quickHelpSub")}</span>
        </Link>

        <Link
          href="/svg-guides"
          className="p-3.5 rounded-xl bg-white border border-[#F2EDE8] hover:border-brand-primary transition-all group"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}
        >
          <span className="block font-heading font-semibold text-xs md:text-sm text-text-dark group-hover:text-brand-primary">
            {t("quickGuides")}
          </span>
          <span className="block font-afacad text-[12px] text-text-muted mt-0.5">{t("quickGuidesSub")}</span>
        </Link>

        <Link
          href="/support"
          className="p-3.5 rounded-xl bg-white border border-[#F2EDE8] hover:border-brand-primary transition-all group"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}
        >
          <span className="block font-heading font-semibold text-xs md:text-sm text-text-dark group-hover:text-brand-primary">
            {t("quickSupport")}
          </span>
          <span className="block font-afacad text-[12px] text-text-muted mt-0.5">{t("quickSupportSub")}</span>
        </Link>
      </div>

      {/* Contact Form Section */}
      <div className="w-full max-w-[600px] flex flex-col items-center bg-white rounded-[16px] px-[20px] py-[12px] md:px-[48px] md:py-[20px] border border-[#F2EDE8]"
        style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
      >
        <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="contact-name" className="font-afacad text-[14px] font-semibold text-brand-primary">{t("nameLabel")}</label>
            <input 
              id="contact-name"
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              aria-required="true"
              className={`w-full h-[40px] rounded-[8px] border-[1px] ${isNameInvalid ? "border-[#EF4444] focus:border-[#EF4444]" : "border-[#C1C1C1] focus:border-brand-primary"} bg-transparent px-[14px] font-afacad text-[14px] outline-none placeholder:text-[#94A3B8] transition-colors`}
            />
            {isNameInvalid && (
              <span className="text-[#EF4444] text-[12px] font-afacad leading-tight mt-[-2px]">
                Name must be at least 3 characters
              </span>
            )}
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="contact-email" className="font-afacad text-[14px] font-semibold text-brand-primary">{t("emailLabel")}</label>
            <input 
              id="contact-email"
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              aria-required="true"
              className={`w-full h-[40px] rounded-[8px] border-[1px] ${isEmailInvalid ? "border-[#EF4444] focus:border-[#EF4444]" : "border-[#C1C1C1] focus:border-brand-primary"} bg-transparent px-[14px] font-afacad text-[14px] outline-none placeholder:text-[#94A3B8] transition-colors`}
            />
            {isEmailInvalid && (
              <span className="text-[#EF4444] text-[12px] font-afacad leading-tight mt-[-2px]">
                Invalid email format
              </span>
            )}
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="contact-message" className="font-afacad text-[14px] font-semibold text-brand-primary">{t("messageLabel")}</label>
            <textarea 
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("messagePlaceholder")}
              aria-required="true"
              rows={5}
              className={`w-full rounded-[8px] border-[1px] ${isMessageInvalid ? "border-[#EF4444] focus:border-[#EF4444]" : "border-[#C1C1C1] focus:border-brand-primary"} bg-transparent p-[14px] font-afacad text-[14px] outline-none placeholder:text-[#94A3B8] transition-colors resize-none overflow-y-auto`}
            ></textarea>
            {isMessageInvalid && (
              <span className="text-[#EF4444] text-[12px] font-afacad leading-tight mt-[-2px]">
                Message must be at least 10 characters
              </span>
            )}
          </div>

          <button 
            type="submit"
            disabled={loading}
            aria-label="Send contact message"
            className="w-full mt-[12px] h-[48px] rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? t("sendingButton") : messageSent ? "Send another message" : t("sendButton")}
          </button>
        </form>

        <div className="w-full flex flex-col items-center justify-center gap-[8px] mt-[16px] md:mt-[24px] pt-[16px] md:pt-[24px] border-t border-[#F2EDE8]">
          <span className="font-afacad text-[16px] text-text-muted">Or email us directly at:</span>
          <a href="mailto:support@crushsvg.net" className="font-afacad font-semibold text-[16px] text-brand-primary hover:underline">
            support@crushsvg.net
          </a>
        </div>
      </div>

      {/* Return to Converter Link */}
      <div className="mt-8">
        <Link href="/" className="text-sm font-semibold text-text-muted hover:text-brand-primary hover:underline transition-colors flex items-center gap-1.5">
          &larr; Back to CrushSVG Converter
        </Link>
      </div>
    </div>
  );
}
