"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  generateSvgCode,
  parseSvgRoot,
  type TargetFramework,
  type SvgToCodeOptions,
} from "@/lib/svg/svg-to-code";
import { isValidSvgContent, svgToDataUrl } from "@/lib/client/converter";
import { parseSvgDimensions } from "@/lib/svg/svg-dims";
import { showToast } from "@/lib/client/toast-bridge";
import { trackConversion } from "@/lib/client/analytics";
import { IMAGES } from "@/lib/shared/images";

const SAMPLE_SVGS: Record<string, { label: string; name: string; svg: string }> = {
  rocket: {
    label: "Rocket Icon",
    name: "RocketIcon",
    svg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#D94A1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-2.05 11a22.77 22.77 0 0 1-3.95 2z"/>
  <path d="M9 12H4s.55-3.03 2-4.5c1.62-1.63 5-2 5-2"/>
  <path d="M12 15v5s3.03-.55 4.5-2c1.63-1.62 2-5 2-5"/>
</svg>`,
  },
  shield: {
    label: "Shield Check",
    name: "ShieldCheckIcon",
    svg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#D94A1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  <path d="m9 12 2 2 4-4"/>
</svg>`,
  },
  star: {
    label: "Star Badge",
    name: "StarBadgeIcon",
    svg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#D94A1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</svg>`,
  },
  lightning: {
    label: "Lightning",
    name: "LightningIcon",
    svg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#D94A1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
</svg>`,
  },
  heart: {
    label: "Heart Icon",
    name: "HeartIcon",
    svg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#D94A1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
</svg>`,
  },
};

const FRAMEWORK_TABS: { id: TargetFramework; label: string; ext: string }[] = [
  { id: "react-tsx", label: "React (TSX)", ext: "tsx" },
  { id: "react-jsx", label: "React (JSX)", ext: "jsx" },
  { id: "vue", label: "Vue 3", ext: "vue" },
  { id: "svelte", label: "Svelte", ext: "svelte" },
  { id: "tailwind", label: "Tailwind HTML", ext: "html" },
  { id: "react-native", label: "React Native", ext: "tsx" },
];

export function SvgToCodeUI() {
  const t = useTranslations("svg_to_code_ui");
  const tUpload = useTranslations("upload_interface");
  const tA11y = useTranslations("accessibility");

  const [svgInput, setSvgInput] = useState<string>(SAMPLE_SVGS.rocket.svg);
  const [componentName, setComponentName] = useState<string>("RocketIcon");
  const [activeTab, setActiveTab] = useState<TargetFramework>("react-tsx");
  const [currentColor, setCurrentColor] = useState<boolean>(true);
  const [forwardRef, setForwardRef] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedDataUri, setCopiedDataUri] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const dims = useMemo(() => parseSvgDimensions(svgInput), [svgInput]);
  const aspectLabel = dims.width && dims.height ? ` (aspect ratio ${(dims.width / dims.height).toFixed(3)})` : "";
  const isValid = useMemo(() => isValidSvgContent(svgInput), [svgInput]);

  const cleanSvgMarkup = useMemo(() => {
    if (!isValid || !svgInput.trim()) return "";
    return svgInput
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "");
  }, [isValid, svgInput]);

  const options: SvgToCodeOptions = useMemo(
    () => ({
      componentName,
      currentColor,
      forwardRef,
    }),
    [componentName, currentColor, forwardRef]
  );

  const generatedCode = useMemo(() => {
    if (!svgInput.trim()) return "";
    try {
      return generateSvgCode(svgInput, activeTab, options);
    } catch {
      return "// Could not transform SVG. Please verify your SVG markup.";
    }
  }, [svgInput, activeTab, options]);

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
      setSvgInput(text.trim());
      const baseName = file.name.replace(/\.svg$/i, "");
      setComponentName(baseName.replace(/[^a-zA-Z0-9_-]/g, "") || "CustomIcon");
      showToast("success", t("fileLoaded"));
    } catch {
      showToast("error", t("fileReadError"));
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files?.[0]);
  }

  async function handleCopyCode() {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopiedCode(true);
      showToast("success", t("codeCopied"));
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      showToast("error", t("copyFailed"));
    }
  }

  async function handleCopyDataUri() {
    if (!svgInput) return;
    try {
      const dataUri = svgToDataUrl(svgInput);
      await navigator.clipboard.writeText(dataUri);
      setCopiedDataUri(true);
      showToast("success", "Data URI copied!");
      setTimeout(() => setCopiedDataUri(false), 2000);
    } catch {
      showToast("error", t("copyFailed"));
    }
  }

  function handleDownload() {
    if (!generatedCode) return;
    const currentTabObj = FRAMEWORK_TABS.find((tab) => tab.id === activeTab);
    const ext = currentTabObj?.ext || "tsx";
    const filename = `${componentName || "Icon"}.${ext}`;

    const blob = new Blob([generatedCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("success", t("fileDownloaded"));
    trackConversion("svg_to_react", {
      framework: activeTab,
      component_name: componentName,
    });
  }

  function handleClearSvg() {
    setSvgInput(SAMPLE_SVGS.rocket.svg);
    setComponentName(SAMPLE_SVGS.rocket.name);
  }

  return (
    <section
      id="converter"
      className="w-full max-w-[362px] md:max-w-[720px] lg:max-w-[1280px] mx-auto mt-[30px] md:mt-[48px] mb-[60px] md:mb-[100px] scroll-mt-[70px] md:scroll-mt-[96px]"
    >
      {/* Outer Dashed Border Box */}
      <div className="w-full h-auto border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[32px] p-0 md:p-[12px] transition-all duration-300 lg:min-h-[500px]">
        {/* Inner Dashed Border Box */}
        <div className="w-full h-auto bg-transparent md:bg-[#FFFFFF] border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[24px] flex flex-col justify-center px-0 md:px-[40px] py-[20px] transition-all duration-300 lg:min-h-[476px]">
          
          {/* Top row with symmetrical 537px columns */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-center w-full gap-[24px] md:gap-[30px]">
            
            {/* Left Column (SVG Code & Drag Drop) - 537px Width */}
            <div className="w-full lg:w-[537px] flex flex-col">
              <div className="flex items-center justify-between mb-[12px] h-[36px]">
                <h2 className="font-heading font-semibold text-[16px] text-[#475569]">
                  {tUpload("svgCodeTab")}
                </h2>
                <div className="flex items-center gap-[10px]">
                  <button
                    type="button"
                    onClick={handleClearSvg}
                    aria-label="Clear SVG editor"
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
                  <span className="font-mono text-[12px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
                    {svgInput.length} chars
                  </span>
                </div>
              </div>

              {/* SVG Code Textarea Box */}
              <div className="relative w-full h-[200px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] bg-[#FFFFFF] overflow-hidden focus-within:border-brand-primary transition-colors">
                <textarea
                  id="react-svg-textarea"
                  value={svgInput}
                  onChange={(e) => setSvgInput(e.target.value)}
                  placeholder="<svg ...>...</svg>"
                  spellCheck={false}
                  aria-label="SVG input code"
                  className="w-full h-full p-3 md:p-4 resize-none outline-none border-none bg-transparent font-mono text-[13px] leading-[1.6] text-black placeholder:text-[#94A3B8] whitespace-pre-wrap break-all overflow-auto brand-scrollbar"
                />
                <div className="absolute bottom-0 left-0 right-[16px] h-[13px] md:h-[21px] bg-[#FFFFFF] pointer-events-none rounded-bl-[16px]" />
                <button
                  type="button"
                  onClick={handleCopyDataUri}
                  disabled={!svgInput}
                  aria-label="Copy Data URI"
                  title="Copy Data URI"
                  className="absolute top-2 right-2 md:top-3 md:right-3 bg-white border border-[#E2E8F0] hover:border-brand-primary text-[#475569] hover:text-brand-primary rounded-[6px] p-1 md:p-1.5 flex items-center justify-center z-30 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                aria-label="Upload SVG file"
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
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                aria-label="Upload SVG file"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                }}
                className={`w-full h-[150px] md:h-[167px] rounded-[16px] border ${
                  dragOver
                    ? "border-solid border-brand-primary bg-gray-50"
                    : "border-dashed md:border-solid border-[#8F8F8F] bg-transparent"
                } mt-[16px] flex flex-col items-center justify-center gap-[8px] md:gap-[10px] p-[16px] md:p-[40px] cursor-pointer hover:bg-gray-50 focus-visible:border-brand-primary focus-visible:border-solid focus:outline-none active:border-brand-primary active:border-solid transition-colors`}
              >
                <Image
                  src={IMAGES.drag}
                  alt="Drag Cloud"
                  width={64}
                  height={64}
                  className="object-contain w-[56px] h-[56px] md:w-[64px] md:h-[64px] transition-transform duration-300 group-hover:scale-105"
                  style={{ width: "auto", height: "auto" }}
                />
                <div className="font-body text-[14px] md:text-[16px] leading-[18.67px] text-text-dark">
                  <span className="font-normal">{tUpload("dragOrSelectSvg")}</span>
                  <span className="font-medium text-brand-primary">{tUpload("selectSvg")}</span>
                </div>
              </div>

              {/* Bottom Source Text & Privacy Notice */}
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

            {/* Right Column (Visual Preview & Framework Output) - 537px Width */}
            <div className="w-full lg:w-[537px] flex flex-col">
              <div className="flex items-center justify-between mb-[12px] h-[36px]">
                <h2 className="font-heading font-semibold text-[16px] text-[#475569]">
                  {t("livePreview")}
                </h2>
                <div className="flex items-center gap-[6px]">
                  <span className="font-body text-[11px] md:text-[12px] font-medium text-brand-primary bg-[#FFF5F2] px-2.5 py-0.5 rounded-full border border-brand-primary/20">
                    {dims.width || 24} × {dims.height || 24} px
                  </span>
                </div>
              </div>

              {/* Live Vector Visual Preview Box */}
              <div
                className="w-full h-[200px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] flex items-center justify-center relative overflow-hidden bg-transparent md:bg-gray-50/30 p-[24px] md:p-[40px]"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                }}
              >
                {cleanSvgMarkup ? (
                  <div
                    className="w-full h-full flex items-center justify-center p-2 [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto drop-shadow-sm z-10"
                    dangerouslySetInnerHTML={{ __html: cleanSvgMarkup }}
                  />
                ) : (
                  <div className="text-text-muted text-[14px] text-center">No preview available</div>
                )}
              </div>

              {/* Controls & Framework Settings Card */}
              <div className="w-full mt-[16px] md:mt-[20px] grow shrink-0 flex flex-col justify-between">
                <div className="p-[14px] md:p-[16px] bg-white rounded-[14px] border border-[#8F8F8F] flex flex-col gap-[12px]">
                  
                  {/* Framework Pill Tabs */}
                  <div className="flex items-center gap-[6px] overflow-x-auto pb-[2px] brand-scrollbar">
                    {FRAMEWORK_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-[10px] py-[5px] rounded-[8px] font-heading font-semibold text-[12px] whitespace-nowrap transition-all cursor-pointer ${
                          activeTab === tab.id
                            ? "bg-brand-primary text-white shadow-xs"
                            : "bg-[#FAF6F3] text-text-dark hover:bg-[#FFF5F2] hover:text-brand-primary border border-[#E8DED7]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Component Options Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[10px] pt-[8px] border-t border-[#E8DED7] flex-wrap">
                    <div className="flex items-center gap-[8px] w-full sm:w-auto">
                      <label className="font-heading font-semibold text-[13px] text-text-dark shrink-0">
                        {t("componentNameLabel")}:
                      </label>
                      <input
                        type="text"
                        value={componentName}
                        onChange={(e) => setComponentName(e.target.value)}
                        placeholder="RocketIcon"
                        className="px-[10px] py-[4px] rounded-[6px] border border-[#E8DED7] font-mono text-[12.5px] text-text-dark focus:outline-none focus:border-brand-primary w-full sm:w-[150px]"
                      />
                    </div>

                    <div className="flex items-center gap-[14px] flex-wrap">
                      <label className="inline-flex items-center gap-[6px] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={currentColor}
                          onChange={(e) => setCurrentColor(e.target.checked)}
                          className="w-4 h-4 accent-brand-primary rounded cursor-pointer"
                        />
                        <span className="font-body text-[12px] text-text-dark">
                          {t("useCurrentColor")}
                        </span>
                      </label>

                      {(activeTab === "react-tsx" || activeTab === "react-jsx") && (
                        <label className="inline-flex items-center gap-[6px] cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={forwardRef}
                            onChange={(e) => setForwardRef(e.target.checked)}
                            className="w-4 h-4 accent-brand-primary rounded cursor-pointer"
                          />
                          <span className="font-body text-[12px] text-text-dark">
                            forwardRef
                          </span>
                        </label>
                      )}
                    </div>
                  </div>

                </div>

                {/* Primary Export Button Row */}
                <div className="flex flex-col items-center justify-center gap-[12px] md:gap-[16px] mt-[12px] md:mt-[16px] relative">
                  <Button
                    className="w-[300px] h-[44px] md:h-[48px] px-[12px] md:px-[32px] rounded-[12px] gap-[8px] shadow-sm cursor-pointer"
                    onClick={handleDownload}
                    disabled={!generatedCode}
                  >
                    <span className="flex items-center justify-center gap-[6px] md:gap-[8px] text-[14px] md:text-[16px] w-full font-semibold">
                      {t("downloadFile")}
                      <Image
                        src={IMAGES.exportIcon}
                        alt=""
                        width={16}
                        height={16}
                        className="brightness-0 invert"
                      />
                    </span>
                  </Button>

                  {/* Secondary Copy Code Button */}
                  <div className="flex items-center gap-[16px] mt-[2px]">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      disabled={!generatedCode}
                      className="font-body text-[13px] font-medium text-[#475569] hover:text-brand-primary transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      {copiedCode ? t("copied") : t("copyCode")}
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
