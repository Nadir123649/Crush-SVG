"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { optimizeSvg, type SvgOptimizerOptions, type SvgOptimizerResult } from "@/lib/svg/svg-optimizer";
import { isValidSvgContent, svgToDataUrl } from "@/lib/client/converter";
import { parseSvgDimensions } from "@/lib/svg/svg-dims";
import { showToast } from "@/lib/client/toast-bridge";
import { trackConversion } from "@/lib/client/analytics";
import { IMAGES } from "@/lib/shared/images";

const SAMPLE_OPTIMIZE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 500 500" width="500" height="500" data-name="Layer 1">
  <!-- Generator: Adobe Illustrator 28.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0 -->
  <defs>
    <linearGradient id="crushGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D94A1E" stop-opacity="1.000000" />
      <stop offset="100%" stop-color="#FF9A3D" stop-opacity="1.000000" />
    </linearGradient>
  </defs>
  <g id="illustration" data-name="Layer_1_1">
    <rect x="50.0000" y="50.0000" width="400.0000" height="400.0000" rx="80.0000" fill="url(#crushGrad)" />
    <circle cx="250.0000" cy="250.0000" r="120.0000" fill="#ffffff" />
    <path d="M 210.0000 190.0000 L 310.0000 250.0000 L 210.0000 310.0000 Z" fill="#D94A1E" />
  </g>
</svg>`;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

export function SvgOptimizerUI() {
  const t = useTranslations("svg_optimizer_ui");
  const tUpload = useTranslations("upload_interface");
  const tA11y = useTranslations("accessibility");

  const [svgCode, setSvgCode] = useState(SAMPLE_OPTIMIZE_SVG);
  const [precision, setPrecision] = useState<number>(2);
  const [stripComments, setStripComments] = useState(true);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [removeEmptyContainers, setRemoveEmptyContainers] = useState(true);
  const [minifyColors, setMinifyColors] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDataUri, setCopiedDataUri] = useState(false);
  const [fileName, setFileName] = useState<string>("optimized.svg");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const dims = useMemo(() => parseSvgDimensions(svgCode), [svgCode]);
  const aspectLabel = dims.width && dims.height ? ` (aspect ratio ${(dims.width / dims.height).toFixed(3)})` : "";

  const options: SvgOptimizerOptions = useMemo(
    () => ({
      precision,
      stripComments,
      stripMetadata,
      removeEmptyContainers,
      minifyColors,
      cleanAttributes: true,
      collapseWhitespace: true,
    }),
    [precision, stripComments, stripMetadata, removeEmptyContainers, minifyColors]
  );

  const optimization: SvgOptimizerResult = useMemo(() => {
    if (!svgCode || svgCode.trim() === "") {
      return {
        originalSvg: "",
        optimizedSvg: "",
        originalBytes: 0,
        optimizedBytes: 0,
        bytesSaved: 0,
        percentSaved: 0,
        warnings: [],
      };
    }
    return optimizeSvg(svgCode, options);
  }, [svgCode, options]);

  const isValid = useMemo(() => isValidSvgContent(svgCode), [svgCode]);
  const previewUrl = useMemo(() => {
    if (!isValid || !optimization.optimizedSvg) return "";
    return svgToDataUrl(optimization.optimizedSvg);
  }, [isValid, optimization.optimizedSvg]);

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
      setSvgCode(text.trim());
      setFileName(file.name.replace(/\.svg$/i, "-min.svg"));
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

  function handleDownload() {
    if (!optimization.optimizedSvg) return;
    const blob = new Blob([optimization.optimizedSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.endsWith(".svg") ? fileName : `${fileName}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("success", t("downloadStarted"));
    trackConversion("svg_optimized", {
      original_bytes: optimization.originalBytes,
      optimized_bytes: optimization.optimizedBytes,
      percent_saved: optimization.percentSaved,
    });
  }

  async function handleCopyCode() {
    if (!optimization.optimizedSvg) return;
    try {
      await navigator.clipboard.writeText(optimization.optimizedSvg);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      showToast("success", t("codeCopied"));
    } catch {
      showToast("error", t("copyFailed"));
    }
  }

  async function handleCopyDataUri() {
    if (!optimization.optimizedSvg) return;
    try {
      const dataUri = svgToDataUrl(optimization.optimizedSvg);
      await navigator.clipboard.writeText(dataUri);
      setCopiedDataUri(true);
      setTimeout(() => setCopiedDataUri(false), 2000);
      showToast("success", t("dataUriCopied"));
    } catch {
      showToast("error", t("copyFailed"));
    }
  }

  function handleClear() {
    setSvgCode(SAMPLE_OPTIMIZE_SVG);
    setFileName("optimized.svg");
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
                    {formatBytes(optimization.originalBytes)}
                  </span>
                </div>
              </div>

              {/* SVG Code Box */}
              <div className="relative w-full h-[200px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] bg-[#FFFFFF] overflow-hidden focus-within:border-brand-primary transition-colors">
                <textarea
                  id="optimizer-svg-textarea"
                  value={svgCode}
                  onChange={(e) => setSvgCode(e.target.value)}
                  placeholder={SAMPLE_OPTIMIZE_SVG}
                  spellCheck={false}
                  aria-label="SVG input code"
                  className="w-full h-full p-3 md:p-4 resize-none outline-none border-none bg-transparent font-mono text-[13px] leading-[1.6] text-black placeholder:text-[#94A3B8] whitespace-pre-wrap break-all overflow-auto brand-scrollbar"
                />
                <div className="absolute bottom-0 left-0 right-[16px] h-[13px] md:h-[21px] bg-[#FFFFFF] pointer-events-none rounded-bl-[16px]" />
                <button
                  type="button"
                  onClick={handleCopyCode}
                  disabled={!svgCode}
                  aria-label={copiedCode ? t("copied") : t("copyCode")}
                  title={copiedCode ? t("copied") : t("copyCode")}
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
                aria-label="Upload SVG file for optimization"
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

            {/* Right Column (Live Preview & Optimization Controls) */}
            <div className="w-full lg:w-[537px] flex flex-col">
              <div className="flex items-center justify-between mb-[12px] h-[36px]">
                <h2 className="font-heading font-semibold text-[16px] text-[#475569]">{t("previewTitle")}</h2>
                {optimization.percentSaved > 0 && (
                  <span className="font-body text-[11px] md:text-[12px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {t("savingsBadge", { percent: optimization.percentSaved })}
                  </span>
                )}
              </div>

              {/* Live Preview Box */}
              <div
                className="w-full h-[200px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] flex items-center justify-center relative overflow-hidden bg-transparent md:bg-gray-50/30 p-[24px] md:p-[40px]"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={tA11y("svgPreview")}
                    className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-sm z-10"
                  />
                ) : (
                  <div className="text-text-muted text-[14px] text-center">{t("invalidSvgNotice")}</div>
                )}
              </div>

              {/* Settings & Controls */}
              <div className="w-full mt-[16px] md:mt-[20px] grow shrink-0 flex flex-col justify-between">
                <div className="p-[14px] md:p-[16px] bg-white rounded-[14px] border border-[#8F8F8F] flex flex-col gap-[10px]">
                  <h3 className="font-heading font-semibold text-[14px] text-text-dark">{t("optionsTitle")}</h3>
                  <div className="grid grid-cols-2 gap-[8px] text-[12px] md:text-[13px] font-body text-[#475569]">
                    <label className="flex items-center gap-[8px] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={stripMetadata}
                        onChange={(e) => setStripMetadata(e.target.checked)}
                        className="accent-brand-primary w-4 h-4 rounded cursor-pointer"
                      />
                      <span className="truncate">{t("stripMetadata")}</span>
                    </label>
                    <label className="flex items-center gap-[8px] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={stripComments}
                        onChange={(e) => setStripComments(e.target.checked)}
                        className="accent-brand-primary w-4 h-4 rounded cursor-pointer"
                      />
                      <span className="truncate">{t("stripComments")}</span>
                    </label>
                    <label className="flex items-center gap-[8px] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={removeEmptyContainers}
                        onChange={(e) => setRemoveEmptyContainers(e.target.checked)}
                        className="accent-brand-primary w-4 h-4 rounded cursor-pointer"
                      />
                      <span className="truncate">{t("cleanEmptyTags")}</span>
                    </label>
                    <label className="flex items-center gap-[8px] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={minifyColors}
                        onChange={(e) => setMinifyColors(e.target.checked)}
                        className="accent-brand-primary w-4 h-4 rounded cursor-pointer"
                      />
                      <span className="truncate">{t("minifyColors")}</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-[8px] border-t border-[#E8DED7] text-[12px] md:text-[13px]">
                    <span className="font-medium text-text-dark">{t("precisionLabel")}</span>
                    <div className="flex gap-[6px]">
                      {[1, 2, 3, -1].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPrecision(p)}
                          className={`px-[8px] py-[3px] rounded-[6px] font-mono text-[11px] md:text-[12px] font-medium transition-colors cursor-pointer ${
                            precision === p
                              ? "bg-brand-primary text-white"
                              : "bg-[#FAF6F3] border border-[#CBD5E1] text-[#475569] hover:bg-gray-100"
                          }`}
                        >
                          {p === -1 ? t("precisionExact") : `${p} dec`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-[8px] md:gap-[12px] mt-[12px]">
                  <div className="flex flex-col p-[8px] md:p-[10px] bg-white rounded-[10px] border border-[#8F8F8F] text-center">
                    <span className="text-[10px] md:text-[11px] uppercase tracking-wider text-text-muted font-heading font-semibold">
                      {t("statOriginal")}
                    </span>
                    <span className="font-mono text-[13px] md:text-[15px] font-bold text-text-dark mt-[2px]">
                      {formatBytes(optimization.originalBytes)}
                    </span>
                  </div>
                  <div className="flex flex-col p-[8px] md:p-[10px] bg-white rounded-[10px] border border-[#8F8F8F] text-center">
                    <span className="text-[10px] md:text-[11px] uppercase tracking-wider text-text-muted font-heading font-semibold">
                      {t("statOptimized")}
                    </span>
                    <span className="font-mono text-[13px] md:text-[15px] font-bold text-brand-primary mt-[2px]">
                      {formatBytes(optimization.optimizedBytes)}
                    </span>
                  </div>
                  <div className="flex flex-col p-[8px] md:p-[10px] bg-emerald-50 rounded-[10px] border border-emerald-200 text-center">
                    <span className="text-[10px] md:text-[11px] uppercase tracking-wider text-emerald-700 font-heading font-semibold">
                      {t("statSavings")}
                    </span>
                    <span className="font-mono text-[13px] md:text-[15px] font-bold text-emerald-700 mt-[2px]">
                      -{optimization.percentSaved}%
                    </span>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-col items-center justify-center gap-[12px] md:gap-[16px] mt-[12px] md:mt-[16px] relative">
                  <Button
                    className="w-[300px] h-[44px] md:h-[48px] px-[12px] md:px-[32px] rounded-[12px] gap-[8px] shadow-sm"
                    onClick={handleDownload}
                    disabled={!optimization.optimizedSvg || !isValid}
                  >
                    <span className="flex items-center justify-center gap-[6px] md:gap-[8px] text-[14px] md:text-[16px] w-full">
                      {t("downloadMinifiedSvg")}
                      <Image
                        src={IMAGES.exportIcon}
                        alt=""
                        width={16}
                        height={16}
                        className="brightness-0 invert"
                      />
                    </span>
                  </Button>

                  {/* Secondary Actions */}
                  <div className="flex items-center gap-[16px] mt-[2px]">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      disabled={!optimization.optimizedSvg || !isValid}
                      className="font-body text-[13px] font-medium text-[#475569] hover:text-brand-primary transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      {copiedCode ? t("copied") : t("copyCode")}
                    </button>
                    <span className="text-[#CBD5E1]">&bull;</span>
                    <button
                      type="button"
                      onClick={handleCopyDataUri}
                      disabled={!optimization.optimizedSvg || !isValid}
                      className="font-body text-[13px] font-medium text-[#475569] hover:text-brand-primary transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                      {copiedDataUri ? t("copied") : t("copyDataUri")}
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
