import React from "react";
import { ScrollToTop } from "@/components/utils/ScrollToTop";

export default function ContactUsPage() {
  return (
    <div className="w-full flex flex-col items-center py-[40px] md:py-[60px] px-[16px] md:px-0 min-h-[60vh]">
      <ScrollToTop />
      
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
      <div className="w-full max-w-[600px] flex flex-col items-center bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]"
        style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
      >
        <form className="w-full flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[6px]">
            <label className="font-afacad text-[14px] font-semibold text-brand-primary">Name</label>
            <input 
              type="text" 
              placeholder="Your full name"
              className="w-full h-[40px] rounded-[8px] border-[1px] border-[#C1C1C1] bg-transparent px-[14px] font-afacad text-[14px] outline-none focus:border-brand-primary placeholder:text-[#AEAEAE] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="font-afacad text-[14px] font-semibold text-brand-primary">Email Address</label>
            <input 
              type="email" 
              placeholder="Your email address"
              className="w-full h-[40px] rounded-[8px] border-[1px] border-[#C1C1C1] bg-transparent px-[14px] font-afacad text-[14px] outline-none focus:border-brand-primary placeholder:text-[#AEAEAE] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="font-afacad text-[14px] font-semibold text-brand-primary">Message</label>
            <textarea 
              placeholder="How can we help you?"
              rows={5}
              className="w-full rounded-[8px] border-[1px] border-[#C1C1C1] bg-transparent p-[14px] font-afacad text-[14px] outline-none focus:border-brand-primary placeholder:text-[#AEAEAE] transition-colors resize-none overflow-y-auto"
            ></textarea>
          </div>

          <button 
            type="button"
            className="w-full mt-[12px] h-[48px] rounded-[12px] bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity"
          >
            Send Message
          </button>
        </form>

        <div className="w-full flex items-center justify-center gap-[8px] mt-[16px] md:mt-[24px] pt-[16px] md:pt-[24px] border-t border-[#F2EDE8]">
          <span className="font-afacad text-[16px] text-text-muted">Or email us at:</span>
          <a href="mailto:support@crushsvg.com" className="font-afacad font-semibold text-[16px] text-brand-primary hover:underline">
            support@crushsvg.com
          </a>
        </div>
      </div>
    </div>
  );
}
