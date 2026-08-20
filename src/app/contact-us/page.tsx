"use client";
import React, { useState } from "react";
import { showToast } from "@/lib/client/toast-bridge";

export default function ContactUsPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending message
    setTimeout(() => {
      setLoading(false);
      showToast("success", "Message sent successfully! We will get back to you soon.");
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };
  return (
    <div className="w-full flex flex-col items-center md:py-[60px] min-h-[60vh]">

      
      {/* Header Section */}
      <div className="flex flex-col items-center text-center max-w-[800px] mb-[40px]">
        <h1 className="font-heading font-semibold text-[32px] leading-[40px] md:text-[56px] md:leading-[61px] tracking-[0.04em] text-text-dark mb-[16px]">
          Contact <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">Us</span>
        </h1>
        <p className="font-afacad text-[16px] md:text-[20px] text-text-muted leading-[1.5]">
          Have questions, feedback, or need assistance? We&apos;d love to hear from you. Fill out the form below or reach out to us directly.
        </p>
      </div>

      {/* Contact Form Section */}
      <div className="w-full max-w-[600px] flex flex-col items-center bg-white rounded-[16px] p-[20px] md:p-[48px] border border-[#F2EDE8]"
        style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
      >
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[6px]">
            <label className="font-afacad text-[14px] font-semibold text-brand-primary">Name</label>
            <input 
              type="text" 
              required
              placeholder="Enter your name"
              className="w-full h-[40px] rounded-[8px] border-[1px] border-[#C1C1C1] bg-transparent px-[14px] font-afacad text-[14px] outline-none focus:border-brand-primary placeholder:text-[#AEAEAE] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="font-afacad text-[14px] font-semibold text-brand-primary">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="Your email address"
              className="w-full h-[40px] rounded-[8px] border-[1px] border-[#C1C1C1] bg-transparent px-[14px] font-afacad text-[14px] outline-none focus:border-brand-primary placeholder:text-[#AEAEAE] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="font-afacad text-[14px] font-semibold text-brand-primary">Message</label>
            <textarea 
              required
              minLength={10}
              placeholder="How can we help you?"
              rows={5}
              className="w-full rounded-[8px] border-[1px] border-[#C1C1C1] bg-transparent p-[14px] font-afacad text-[14px] outline-none focus:border-brand-primary placeholder:text-[#AEAEAE] transition-colors resize-none overflow-y-auto"
            ></textarea>
            <span className="font-afacad text-[12px] text-[#A1A1AA]">Message must be at least 10 characters</span>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-[12px] h-[48px] rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>

        <div className="w-full flex flex-col items-center justify-center gap-[8px] mt-[16px] md:mt-[24px] pt-[16px] md:pt-[24px] border-t border-[#F2EDE8]">
          <span className="font-afacad text-[16px] text-text-muted">Or email us at:</span>
          <a href="mailto:support@crushsvg.com" className="font-afacad font-semibold text-[16px] text-brand-primary hover:underline">
            support@crushsvg.com
          </a>
        </div>
      </div>
    </div>
  );
}
