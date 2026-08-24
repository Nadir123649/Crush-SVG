"use client";
import React, { useState } from "react";
import Link from "next/link";
import { showToast } from "@/lib/client/toast-bridge";

export default function ContactUsPage() {
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
    // Simulate sending message
    setTimeout(() => {
      setLoading(false);
      showToast("success", "Message sent successfully! We will get back to you soon.");
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
    <div className="w-full flex flex-col items-center md:py-[60px] min-h-[60vh]">

      {/* Header Section */}
      <div className="flex flex-col items-center text-center max-w-[800px] mb-[24px] md:mb-[40px] mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCF1ED] text-brand-primary text-sm font-semibold mb-4 border border-[#F2EDE8]">
          <span>Direct Team Access</span>
        </div>
        <h1 className="font-heading font-semibold text-[30px] leading-[36px] md:text-[56px] md:leading-[61px] tracking-[0.04em] text-text-dark mb-[8px] md:mb-[16px]">
          Contact <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">Us</span>
        </h1>
        <p className="font-afacad text-[16px] md:text-[20px] text-text-muted leading-[1.5] max-w-[600px]">
          Have questions, bug reports, feature requests, or partnership inquiries? Reach out to <Link href="/team" className="text-brand-primary hover:underline font-medium">our team</Link> at <a href="https://www.thenevon.com" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-medium">The Nevon</a>.
        </p>
      </div>

      {/* Quick Self-Help Navigation Cards */}
      <div className="w-full max-w-[600px] grid grid-cols-3 gap-3 mb-6 text-center">
        <Link
          href="/help"
          className="p-3.5 rounded-xl bg-white border border-[#F2EDE8] hover:border-brand-primary transition-all group"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}
        >
          <span className="block font-heading font-semibold text-xs md:text-sm text-text-dark group-hover:text-brand-primary">
            Help & FAQ
          </span>
          <span className="block font-afacad text-[11px] text-text-muted mt-0.5">Quick answers</span>
        </Link>

        <Link
          href="/svg-guides"
          className="p-3.5 rounded-xl bg-white border border-[#F2EDE8] hover:border-brand-primary transition-all group"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}
        >
          <span className="block font-heading font-semibold text-xs md:text-sm text-text-dark group-hover:text-brand-primary">
            SVG Guides
          </span>
          <span className="block font-afacad text-[11px] text-text-muted mt-0.5">Fix formatting</span>
        </Link>

        <Link
          href="/support"
          className="p-3.5 rounded-xl bg-white border border-[#F2EDE8] hover:border-brand-primary transition-all group"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}
        >
          <span className="block font-heading font-semibold text-xs md:text-sm text-text-dark group-hover:text-brand-primary">
            Support Hub
          </span>
          <span className="block font-afacad text-[11px] text-text-muted mt-0.5">Known solutions</span>
        </Link>
      </div>

      {/* Contact Form Section */}
      <div className="w-full max-w-[600px] flex flex-col items-center bg-white rounded-[16px] p-[20px] md:p-[48px] border border-[#F2EDE8]"
        style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
      >
        <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="contact-name" className="font-afacad text-[14px] font-semibold text-brand-primary">Name</label>
            <input 
              id="contact-name"
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
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
            <label htmlFor="contact-email" className="font-afacad text-[14px] font-semibold text-brand-primary">Email Address</label>
            <input 
              id="contact-email"
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
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
            <label htmlFor="contact-message" className="font-afacad text-[14px] font-semibold text-brand-primary">Message</label>
            <textarea 
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help you?"
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
            {loading ? "Sending..." : messageSent ? "Send another message" : "Send Message"}
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
