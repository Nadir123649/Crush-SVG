"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  generateFaviconPack,
  renderImageToCanvas,
  canvasToWebP,
  loadSvgImage,
  type FaviconPackResult,
} from "@/lib/svg/favicon-generator";
import { isValidSvgContent } from "@/lib/client/converter";
import { parseSvgDimensions } from "@/lib/svg/svg-dims";
import { showToast } from "@/lib/client/toast-bridge";
import { trackConversion } from "@/lib/client/analytics";
import { IMAGES } from "@/lib/shared/images";

const SAMPLE_FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="favGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D94A1E" />
      <stop offset="100%" stop-color="#FF9A3D" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#favGrad)" />
  <path d="M160 352 L256 160 L352 352 L288 352 L256 280 L224 352 Z" fill="#FFFFFF" />
  <circle cx="256" cy="230" r="28" fill="#D94A1E" />
</svg>`;

export function FaviconGeneratorUI() {
  const t = useTranslations("favicon_generator_ui");
  const tUpload = useTranslations("upload_interface");
  const tA11y = useTranslations("accessibility");

  const [svgCode, setSvgCode] = useState<string>(SAMPLE_FAVICON_SVG);
  const [appName, setAppName] = useState<string>("My Awesome App");
  const [themeColor, setThemeColor] = useState<string>("#D94A1E");
  const [backgroundColor, setBackgroundColor] = useState<string>("transparent");
  const [paddingPercent, setPaddingPercent] = useState<number>(0);
  const [borderRadiusPercent, setBorderRadiusPercent] = useState<number>(0);
  const [webpQuality, setWebpQuality] = useState<number>(0.9);
  const [activePreviewTab, setActivePreviewTab] = useState<"tab" | "ios" | "android">("tab");

  const [packResult, setPackResult] = useState<FaviconPackResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const dims = useMemo(() => parseSvgDimensions(svgCode), [svgCode]);
  const aspectLabel = dims.width && dims.height ? ` (aspect ratio ${(dims.width / dims.height).toFixed(3)})` : "";
  const isValid = useMemo(() => isValidSvgContent(svgCode), [svgCode]);

  // Generate favicon pack when inputs or options change
  useEffect(() => {
    let active = true;
    if (!isValid || !svgCode.trim()) {
      setPackResult(null);
      return;
    }

    setIsGenerating(true);
    generateFaviconPack(svgCode, {
      appName,
      themeColor,
      backgroundColor,
      paddingPercent,
      borderRadiusPercent,
    })
      .then((res) => {
        if (active) {
          setPackResult(res);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error("Favicon generation error:", err);
        if (active) setIsGenerating(false);
      });

    return () => {
      active = false;
    };
  }, [svgCode, isValid, appName, themeColor, backgroundColor, paddingPercent, borderRadiusPercent]);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.includes("svg") && !file.name.toLowerCase().endsWith(".svg")) {
      showToast("error", t("invalidSvgFile"));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("error", t("fileTooLarge"));
      return;
    }

    try {
      const text = await file.text();
      if (!isValidSvgContent(text)) {
        showToast("error", t("invalidSvgStructure"));
        return;
      }
      setSvgCode(text);
      showToast("success", t("fileLoadedSuccess"));
    } catch {
      showToast("error", t("fileReadError"));
    }
  }

  async function handleDownloadZip() {
    if (!packResult) return;
    setIsZipping(true);
    try {
      const blob = await packResult.zipBlob;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "favicon-pack.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      trackConversion("favicon_generated", { format: "zip" });
      showToast("success", t("zipDownloadedSuccess"));
    } catch (err) {
      console.error("Zip error:", err);
      showToast("error", t("zipFailed"));
    } finally {
      setIsZipping(false);
    }
  }

  function handleDownloadIco() {
    if (!packResult) return;
    const link = document.createElement("a");
    link.href = packResult.icoDataUrl;
    link.download = "favicon.ico";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", t("icoDownloadedSuccess"));
  }

  async function handleDownloadWebP() {
    if (!svgCode || !isValid) return;
    try {
      const img = await loadSvgImage(svgCode);
      const canvas = await renderImageToCanvas(
        img,
        512,
        512,
        paddingPercent,
        borderRadiusPercent,
        backgroundColor
      );
      const { blob } = await canvasToWebP(canvas, webpQuality);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "icon-512x512.webp";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("success", t("webpDownloadedSuccess"));
    } catch {
      showToast("error", t("webpFailed"));
    }
  }

  async function handleCopySnippet() {
    if (!packResult) return;
    try {
      await navigator.clipboard.writeText(packResult.htmlSnippet);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
      showToast("success", t("snippetCopied"));
    } catch {
      showToast("error", t("copyFailed"));
    }
  }

  function handleClear() {
    setSvgCode(SAMPLE_FAVICON_SVG);
    setAppName("My Awesome App");
    setThemeColor("#D94A1E");
    setBackgroundColor("transparent");
    setPaddingPercent(0);
    setBorderRadiusPercent(0);
  }

  const preview32 = packResult?.items.find((i) => i.name === "favicon-32x32.png")?.dataUrl;
  const preview180 = packResult?.items.find((i) => i.name === "apple-touch-icon.png")?.dataUrl;
  const preview192 = packResult?.items.find((i) => i.name === "android-chrome-192x192.png")?.dataUrl;

  return (
    <section
      id="converter"
      className="w-full max-w-[362px] md:max-w-[720px] lg:max-w-[1280px] mx-auto mt-[30px] md:mt-[48px] mb-[60px] md:mb-[100px] scroll-mt-[70px] md:scroll-mt-[96px]"
    >
      {/* Outer Dashed Border Box */}
      <div className="w-full h-auto border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[32px] p-0 md:p-[12px] transition-all duration-300 lg:min-h-[500px]">
        {/* Inner Dashed Border Box */}
        <div className="w-full h-auto bg-transparent md:bg-[#FFFFFF] border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[24px] flex flex-col justify-center px-0 md:px-[40px] py-[20px] transition-all duration-300 lg:min-h-[476px]">
          {/* Top row with columns */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-center w-full gap-[24px] md:gap-[30px]">
            {/* Left Column (SVG Code & Drag Drop) */}
            <div className="w-full lg:w-[537px] flex flex-col">
              <div className="flex items-center justify-between mb-[12px] h-[36px]">
                <h2 className="font-heading font-semibold text-[16px] text-[#475569]">{tUpload("svgCodeTab")}</h2>
                <div className="flex items-center gap-[10px]">
                  <button
                    type="button"
                    onClick={handleClear}
                    aria-label="Reset favicon generator"
                    className="group relative rounded-[6px] px-[12px] py-[4px] font-body font-medium text-[12px] overflow-hidden transition-opacity duration-300 opacity-100 cursor-pointer"
                  >
                    <div
                      className="absolute inset-0 z-0 pointer-events-none"
                      style={{
                        border: "1px solid transparent",
                        background:
                          "linear-gradient(#FFFFFF, #FFFFFF) padding-box, linear-gradient(to right, #D94A1E, #FF9A3D) border-box",
                        borderRadius: "inherit",
                      }}
                    />
                    <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out pointer-events-none bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D]" />
                    <span className="relative z-10 text-[#D94A1E] group-hover:text-white transition-colors duration-300 ease-in-out">
                      {tUpload("clear")}
                    </span>
                  </button>
                </div>
              </div>

              {/* SVG Code Box */}
              <div className="relative w-full h-[200px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] bg-[#FFFFFF] overflow-hidden focus-within:border-brand-primary transition-colors">
                <textarea
                  id="favicon-svg-textarea"
                  value={svgCode}
                  onChange={(e) => setSvgCode(e.target.value)}
                  placeholder={SAMPLE_FAVICON_SVG}
                  spellCheck={false}
                  aria-label="SVG input code"
                  className="w-full h-full p-3 md:p-4 resize-none outline-none border-none bg-transparent font-mono text-[13px] leading-[1.6] text-black placeholder:text-[#94A3B8] whitespace-pre-wrap break-all overflow-auto brand-scrollbar"
                />
                <div className="absolute bottom-0 left-0 right-[16px] h-[13px] md:h-[21px] bg-[#FFFFFF] pointer-events-none rounded-bl-[16px]" />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                aria-label="Upload SVG file for Favicon"
                accept=".svg,image/svg+xml"
                className="absolute w-0 h-0 opacity-0 overflow-hidden"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />

              {/* Drag & Drop Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  void handleFile(e.dataTransfer.files?.[0]);
                }}
                className={`w-full h-[150px] md:h-[167px] rounded-[16px] border border-dashed flex flex-col items-center justify-center p-[20px] md:p-[28px] mt-[16px] md:mt-[20px] cursor-pointer transition-colors ${
                  dragOver
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-[#8F8F8F] hover:border-brand-primary bg-[#FFFFFF]"
                }`}
              >
                <div className="w-[48px] h-[48px] rounded-full bg-[#FAF6F3] flex items-center justify-center mb-[10px] text-brand-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="font-body font-normal text-[14px] md:text-[16px] leading-[19px] text-[#222222] text-center">
                  <span className="font-normal">{tUpload("dragOrSelectSvg")}</span>
                  <span className="font-medium text-brand-primary">{tUpload("selectSvg")}</span>
                </p>
                <p className="font-body font-normal text-[12px] md:text-[14px] text-[#757575] mt-[4px]">
                  {tUpload("maxFileSize")}
                </p>
              </div>

              {/* Bottom Source Text & Privacy */}
              <p className="font-body font-normal text-[12px] md:text-[14px] text-[#475569] mt-[12px] md:mt-[10px]">
                {dims.width && dims.height
                  ? tUpload("sourceSize", { width: dims.width, height: dims.height, aspect: aspectLabel })
                  : tUpload("sourceSizeUnknown")}
              </p>

              <div className="mt-[16px] lg:mt-auto flex flex-col w-full">
                <p className="font-body text-[12px] md:text-[14px] text-[#475569] flex items-center justify-start gap-[6px]">
                  <Image src={IMAGES.lock} alt="Lock" width={12} height={12} className="shrink-0 w-[12px] h-[12px]" style={{ width: "auto", height: "auto" }} />
                  <span>{tUpload("privateNotice")}</span>
                </p>
              </div>
            </div>

            {/* Right Column (Device Previews & Options) */}
            <div className="w-full lg:w-[537px] flex flex-col">
              {/* Preview Tabs */}
              <div className="flex items-center justify-between mb-[12px] h-[36px]">
                <div className="flex items-center gap-[6px] bg-[#F1F5F9] p-[3px] rounded-[8px]">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab("tab")}
                    className={`px-[10px] py-[4px] rounded-[6px] font-body text-[12px] font-medium transition-all ${
                      activePreviewTab === "tab" ? "bg-white text-text-dark shadow-xs font-semibold" : "text-[#64748B] hover:text-text-dark"
                    }`}
                  >
                    {t("tabPreview")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab("ios")}
                    className={`px-[10px] py-[4px] rounded-[6px] font-body text-[12px] font-medium transition-all ${
                      activePreviewTab === "ios" ? "bg-white text-text-dark shadow-xs font-semibold" : "text-[#64748B] hover:text-text-dark"
                    }`}
                  >
                    {t("iosPreview")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab("android")}
                    className={`px-[10px] py-[4px] rounded-[6px] font-body text-[12px] font-medium transition-all ${
                      activePreviewTab === "android" ? "bg-white text-text-dark shadow-xs font-semibold" : "text-[#64748B] hover:text-text-dark"
                    }`}
                  >
                    {t("androidPreview")}
                  </button>
                </div>
                <span className="font-mono text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  {packResult ? t("packReadyBadge") : isGenerating ? t("generatingBadge") : ""}
                </span>
              </div>

              {/* Realistic Preview Window */}
              <div className="w-full h-[200px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] bg-[#FFFFFF] flex flex-col overflow-hidden shadow-inner">
                {/* Browser Tab Mockup View */}
                {activePreviewTab === "tab" && (
                  <div className="w-full h-full flex flex-col bg-[#F1F5F9]">
                    <div className="h-[42px] bg-[#E2E8F0] border-b border-[#CBD5E1] flex items-center px-3 gap-2">
                      <div className="flex items-center gap-1.5 mr-2">
                        <span className="w-3 h-3 rounded-full bg-[#EF4444] inline-block" />
                        <span className="w-3 h-3 rounded-full bg-[#F59E0B] inline-block" />
                        <span className="w-3 h-3 rounded-full bg-[#10B981] inline-block" />
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded-t-lg px-3 py-1.5 h-full max-w-[200px] border-t border-x border-[#CBD5E1] shadow-xs">
                        {preview32 ? (
                          <img src={preview32} alt="Favicon" className="w-4 h-4 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-[#D94A1E]" />
                        )}
                        <span className="font-body text-[12px] text-[#334155] font-medium truncate">
                          {appName || "My App"}
                        </span>
                      </div>
                    </div>
                    <div className="grow flex items-center justify-center p-6 bg-white">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-16 h-16 rounded-2xl border border-[#E2E8F0] p-2 bg-[#FAF6F3] shadow-xs flex items-center justify-center">
                          {preview180 && <img src={preview180} alt="Icon" className="w-full h-full object-contain" />}
                        </div>
                        <p className="font-heading font-semibold text-[15px] text-text-dark">{appName}</p>
                        <p className="font-body text-[12px] text-text-muted">{t("tabPreviewNote")}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* iOS Home Screen Mockup */}
                {activePreviewTab === "ios" && (
                  <div className="w-full h-full bg-gradient-to-b from-[#1E293B] to-[#0F172A] flex flex-col items-center justify-center p-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-20 h-20 rounded-[20px] overflow-hidden shadow-2xl border border-white/20 flex items-center justify-center bg-white">
                        {preview180 && <img src={preview180} alt="Apple Touch Icon" className="w-full h-full object-contain" />}
                      </div>
                      <span className="font-body text-[13px] text-white/90 font-medium tracking-wide">
                        {appName || "App"}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/50 mt-4 font-mono">apple-touch-icon.png (180x180)</span>
                  </div>
                )}

                {/* Android Chrome Mockup */}
                {activePreviewTab === "android" && (
                  <div className="w-full h-full bg-gradient-to-b from-[#0F766E] to-[#115E59] flex flex-col items-center justify-center p-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-20 h-20 rounded-full overflow-hidden shadow-2xl border border-white/20 flex items-center justify-center bg-white">
                        {preview192 && <img src={preview192} alt="Android Chrome Icon" className="w-full h-full object-contain" />}
                      </div>
                      <span className="font-body text-[13px] text-white/90 font-medium tracking-wide">
                        {appName || "App"}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/50 mt-4 font-mono">android-chrome-192x192.png</span>
                  </div>
                )}
              </div>

              {/* Favicon Customization Controls */}
              <div className="w-full mt-[16px] md:mt-[20px] grow shrink-0 flex flex-col justify-between">
                <div className="p-[14px] md:p-[16px] bg-white rounded-[14px] border border-[#8F8F8F] flex flex-col gap-[12px]">
                  <h3 className="font-heading font-semibold text-[14px] text-text-dark">{t("customizationTitle")}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
                    {/* App Name */}
                    <label className="flex flex-col gap-1 font-body text-[12px] text-[#475569]">
                      <span className="font-medium">{t("appNameLabel")}</span>
                      <input
                        type="text"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="My App"
                        className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-[8px] text-[13px] outline-none focus:border-brand-primary"
                      />
                    </label>

                    {/* Theme Color */}
                    <label className="flex flex-col gap-1 font-body text-[12px] text-[#475569]">
                      <span className="font-medium">{t("themeColorLabel")}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="w-8 h-8 rounded border border-[#CBD5E1] cursor-pointer p-0"
                        />
                        <input
                          type="text"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="w-full px-2 py-1.5 border border-[#CBD5E1] rounded-[8px] text-[12px] font-mono outline-none focus:border-brand-primary"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-[10px]">
                    {/* Padding Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] font-body text-[#475569]">
                        <span>{t("paddingLabel")}</span>
                        <span className="font-mono">{paddingPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        value={paddingPercent}
                        onChange={(e) => setPaddingPercent(Number(e.target.value))}
                        className="w-full accent-brand-primary cursor-pointer"
                      />
                    </div>

                    {/* Border Radius Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] font-body text-[#475569]">
                        <span>{t("radiusLabel")}</span>
                        <span className="font-mono">{borderRadiusPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={borderRadiusPercent}
                        onChange={(e) => setBorderRadiusPercent(Number(e.target.value))}
                        className="w-full accent-brand-primary cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Export Options & Actions */}
                <div className="flex flex-wrap items-center gap-[8px] mt-[12px]">
                  <button
                    type="button"
                    onClick={handleDownloadIco}
                    disabled={!packResult}
                    className="grow py-[8px] px-[12px] rounded-[10px] bg-white border border-[#CBD5E1] hover:border-brand-primary text-text-dark hover:text-brand-primary text-[12px] md:text-[13px] font-body font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {t("downloadIcoOnly")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadWebP}
                    disabled={!packResult}
                    className="grow py-[8px] px-[12px] rounded-[10px] bg-white border border-[#CBD5E1] hover:border-brand-primary text-text-dark hover:text-brand-primary text-[12px] md:text-[13px] font-body font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {t("downloadWebpOnly")}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySnippet}
                    disabled={!packResult}
                    className="grow py-[8px] px-[12px] rounded-[10px] bg-white border border-[#CBD5E1] hover:border-brand-primary text-text-dark hover:text-brand-primary text-[12px] md:text-[13px] font-body font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {copiedSnippet ? t("snippetCopied") : t("copyHeadTags")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Primary Action Button */}
          <div className="w-full flex justify-center mt-[30px] md:mt-[40px]">
            <Button
              variant="solid"
              onClick={handleDownloadZip}
              disabled={!packResult || isZipping}
              className="w-[300px] h-[44px] md:h-[48px] rounded-[14px] text-[15px] md:text-[16px] font-medium tracking-[0.02em] shadow-[0px_4px_14px_0px_rgba(217,74,30,0.3)] hover:shadow-[0px_6px_20px_0px_rgba(217,74,30,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isZipping ? t("zippingPack") : t("downloadFullPackZip")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
