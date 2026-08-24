"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { IMAGES } from "@/lib/shared/images";
import { Button } from "@/components/ui/Button";
import { SignupPromptModal } from "@/components/modals/SignupPromptModal";
import { useAuth, type AuthStatus } from "@/lib/client/auth-context";
import { convertText, isValidSvgContent, svgToDataUrl, type ConvertRequest, type ConvertResponse } from "@/lib/client/converter";
import { parseSvgDimensions } from "@/lib/svg/svg-dims";
import { ApiError, getAccessToken } from "@/lib/client/http";
import { getUsage } from "@/lib/client/sessions";
import type { UsageInfo } from "@/lib/shared/shared-types";
import { showToast } from "@/lib/client/toast-bridge";
import { trackConversion } from "@/lib/client/analytics";

const SCALE_OPTIONS = ["Custom", "1x", "2x", "3x", "4x", "5x", "8x", "10x", "16x"];
const PRESET_SIZES = ["120", "240", "480", "720", "1080", "1920", "2560", "3840"];
const PX_PER_CM = 96 / 2.54;
const MAX_CUSTOM_PX = 4000;
const CONVERTER_STORAGE_KEY = "crush_converter_state";
const MAX_PERSISTED_RESULT_CHARS = 1_500_000;

const SAMPLE_SVG = `<svg width="104" height="104" viewBox="0 0 104 104" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect width="103.276" height="103.257" fill="url(#pattern0_4824_15804)"/>
<rect x="66.6987" y="47.3262" width="36.5768" height="36.5702" rx="17" fill="#DA582D"/>
<path d="M90.9871 63.9144L84.9871 57.6113L78.9871 63.9144M84.9871 57.6113L84.4871 73.6113" stroke="white" stroke-width="2" stroke-linecap="round"/>
<defs>
<pattern id="pattern0_4824_15804" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_4824_15804" transform="scale(0.0104167 0.0104186)"/>
</pattern>
<image id="image0_4824_15804" width="96" height="96" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/>
</defs>
</svg>`;

const DUMMY_CODE = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Paste your SVG code here! -->
  <rect x="10" y="10" width="80" height="80" rx="15" fill="#DA582D"/>
  <circle cx="50" cy="50" r="20" fill="#FFFFFF"/>
  <path d="M45 40L55 50L45 60" stroke="#DA582D" stroke-width="4" stroke-linecap="round"/>
</svg>`;

const formatDimensionLabel = (val: string, currentUnit: string) => {
  if (val === "Original" || val === "Auto" || val === "Custom") return val;
  return `${val} ${currentUnit}`;
};

export function ConverterUI() {
  const { status, sessionVersion } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<"width" | "height" | "scale" | "unit" | null>(null);
  const [selectedWidth, setSelectedWidth] = useState("480");
  const [selectedHeight, setSelectedHeight] = useState("Auto");
  const [selectedScale, setSelectedScale] = useState("2x");
  const [unit, setUnit] = useState<"px" | "cm">("px");
  const [isCustomWidth, setIsCustomWidth] = useState(false);
  const [isCustomHeight, setIsCustomHeight] = useState(false);
  const [isCustomScale, setIsCustomScale] = useState(false);
  const [transparent, setTransparent] = useState(false);
  const [svgCode, setSvgCode] = useState(SAMPLE_SVG);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [usageFailed, setUsageFailed] = useState(false);

  const [dragOver, setDragOver] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [limitDownloadDone, setLimitDownloadDone] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (converting) {
      const timer = setTimeout(() => setProgress(100), 50);
      return () => clearTimeout(timer);
    }
    queueMicrotask(() => setProgress(0));
  }, [converting]);

  const [previewError, setPreviewError] = useState(false);
  const widthRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storageRestoredRef = useRef(false);
  const [storageRestored, setStorageRestored] = useState(false);
  const prevStatusRef = useRef<AuthStatus | null>(null);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    // The previous user signed out (or their session ended): wipe the editor
    // so no private SVG lingers on screen or in memory for the next user.
    if (prev === "authed" && status !== "authed") {
      setSvgCode(SAMPLE_SVG);
      setResult(null);
      setError(null);
      setPreviewError(false);
      setUsage(null);
      setUsageFailed(false);
      setShowSignupPrompt(false);
    }
  }, [status]);

  const dims = useMemo(() => parseSvgDimensions(svgCode), [svgCode]);

  const aspectLabel = dims.width && dims.height ? ` (aspect ratio ${(dims.width / dims.height).toFixed(3)})` : "";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;

      // Close dropdown if clicking on any label
      if (target.tagName?.toLowerCase() === 'label') {
        setOpenDropdown(null);
        return;
      }

      if (openDropdown === "width" && widthRef.current) {
        if (!widthRef.current.contains(target) || target === widthRef.current) {
          setOpenDropdown(null);
        }
      }
      if (openDropdown === "height" && heightRef.current) {
        if (!heightRef.current.contains(target) || target === heightRef.current) {
          setOpenDropdown(null);
        }
      }
      if (openDropdown === "scale" && scaleRef.current) {
        if (!scaleRef.current.contains(target) || target === scaleRef.current) {
          setOpenDropdown(null);
        }
      }
      if (openDropdown === "unit" && unitRef.current) {
        if (!unitRef.current.contains(target) || target === unitRef.current) {
          setOpenDropdown(null);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  useEffect(() => {
    if (status === 'loading') return;
    // When authed, wait until the access token is actually attached: a
    // restored session (page refresh) sets status to 'authed' before
    // refreshSession resolves, and fetching in that gap would make the server
    // fall back to the guest quota and flash the wrong "3 of 3" counter.
    if (status === 'authed' && !getAccessToken()) return;
    let cancelled = false;
    getUsage()
      .then((u) => {
        if (!cancelled) {
          setUsage(u);
        }
      })
      .catch(() => {
        // Guest usage unavailable — the server still enforces the limit, so
        // the converter must not get stuck waiting on this request.
        if (!cancelled) {
          setUsage(null);
          setUsageFailed(true);
        }
      })
    return () => { cancelled = true }
  }, [status, sessionVersion]);

  useEffect(() => {
    // Restore the saved SVG + conversion result after hydration. sessionStorage
    // keeps the work across a refresh of the same tab but is cleared when the
    // tab (or browser) is closed — an uploaded SVG never lingers for the next
    // visit. Reading storage during render (useState initializers) would make
    // the client's first render differ from the server's. Deferred to a
    // microtask so it runs before the next paint without violating the "no
    // synchronous setState in effects" rule.
    queueMicrotask(() => {
      try {
        const raw = sessionStorage.getItem(CONVERTER_STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw) as { svgCode?: unknown; result?: unknown };
        if (typeof saved.svgCode === "string" && saved.svgCode.trim() !== "") {
          setSvgCode(saved.svgCode);
        }
        const savedResult = saved.result as ConvertResponse | undefined;
        if (savedResult && typeof savedResult.data === "string" && typeof savedResult.format === "string") {
          setResult(savedResult);
        }
      } catch { }
      finally {
        storageRestoredRef.current = true;
        setStorageRestored(true);
      }
    });
  }, []);

  useEffect(() => {
    // Never save before the first restore: the save effect runs on mount with
    // the default sample SVG and would otherwise overwrite the persisted
    // state before the restore microtask gets to read it.
    if (!storageRestoredRef.current) return;
    try {
      // Large PNGs (base64) can exceed storage quota — drop the result
      // from persistence when it's too big so the SVG itself still survives.
      const persistableResult =
        result && result.data && result.data.length <= MAX_PERSISTED_RESULT_CHARS ? result : null;
      sessionStorage.setItem(CONVERTER_STORAGE_KEY, JSON.stringify({ svgCode, result: persistableResult }));
    } catch { }
  }, [svgCode, result]);

  const previewSvgUrl = useMemo(() => {
    if (!svgCode || svgCode.trim() === "") return "";
    return svgToDataUrl(svgCode);
  }, [svgCode]);

  const isValidSvg = useMemo(() => isValidSvgContent(svgCode), [svgCode]);

  const showCustomPreview = svgCode !== SAMPLE_SVG && svgCode.trim() !== "" && svgCode !== DUMMY_CODE && isValidSvg;

  // The sample/dummy code is a demo placeholder only — converting or
  // downloading it is blocked.
  const isPlaceholderCode = svgCode === SAMPLE_SVG || svgCode === DUMMY_CODE;

  const previewUrl = showCustomPreview ? previewSvgUrl : "";

  function handleSvgChange(value: string) {
    setSvgCode(value);
    setResult(null);
    setError(null);
    setPreviewError(false);
  }

  function resetConversion() {
    if (result) {
      setResult(null);
    }
  }

  function handleClearSvg() {
    setSvgCode(SAMPLE_SVG);
    setResult(null);
    setError(null);
    setPreviewError(false);
    try {
      sessionStorage.removeItem(CONVERTER_STORAGE_KEY);
    } catch { }
  }

  useEffect(() => {
    function handleGlobalPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const text = e.clipboardData?.getData("text");
      if (text && isValidSvgContent(text)) {
        e.preventDefault();
        handleSvgChange(text.trim());
        showToast("success", "SVG code pasted from clipboard!");
      }
    }
    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, []);

  function handleFormatSvg() {
    if (!svgCode || isPlaceholderCode) return;
    try {
      let formatted = "";
      const reg = /(>)(<)(\/*)/g;
      const xml = svgCode.replace(reg, "$1\r\n$2$3");
      let pad = 0;
      xml.split("\r\n").forEach((line) => {
        let indent = 0;
        if (line.match(/.+<\/\w[^>]*>$/)) {
          indent = 0;
        } else if (line.match(/^<\/\w/)) {
          if (pad !== 0) pad -= 1;
        } else if (line.match(/^<\w[^>]*[^\/]>$/)) {
          indent = 1;
        } else {
          indent = 0;
        }
        formatted += "  ".repeat(pad) + line.trim() + "\n";
        pad += indent;
      });
      setSvgCode(formatted.trim());
      showToast("success", "SVG code formatted!");
    } catch {
      showToast("error", "Could not format SVG code.");
    }
  }

  async function handleCopyImage() {
    if (!result || !result.data) return;
    try {
      const response = await fetch(result.data);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      showToast("success", "PNG image copied to clipboard!");
    } catch {
      showToast("error", "Could not copy image to clipboard. Try downloading instead.");
    }
  }

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.includes("svg") && !file.name.toLowerCase().endsWith(".svg")) {
      setError("Please choose an SVG file (.svg).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("SVG file too large. Maximum size is 5MB.");
      return;
    }
    try {
      const text = await file.text();
      handleSvgChange(text.trimEnd());
    } catch {
      setError("Could not read that file. Please try again.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files?.[0]);
  }

  async function handleConvert() {
    if (isPlaceholderCode || svgCode.trim() === "") {
      showToast("error", "SVG code is empty. Paste your SVG code to convert.");
      return;
    }
    setError(null);
    const options: ConvertRequest = { transparent };

    if (selectedWidth !== "Original") {
      let wNum = parseFloat(selectedWidth);
      if (Number.isNaN(wNum) || wNum <= 0) {
        setError(`Invalid width value. Enter a number like 480 or 12.7.`);
        return;
      }
      if (unit === "cm") {
        wNum = wNum * PX_PER_CM;
      }
      options.width = Math.round(wNum);
      if (options.width < 1 || options.width > MAX_CUSTOM_PX) {
        setError(`Width must be between 1 and ${MAX_CUSTOM_PX} px (max ${(MAX_CUSTOM_PX / PX_PER_CM).toFixed(1)} cm).`);
        return;
      }
    }

    if (selectedHeight !== "Auto") {
      let hNum = parseFloat(selectedHeight);
      if (Number.isNaN(hNum) || hNum <= 0) {
        setError(`Invalid height value. Enter a number like 480 or 12.7.`);
        return;
      }
      if (unit === "cm") {
        hNum = hNum * PX_PER_CM;
      }
      options.height = Math.round(hNum);
      if (options.height < 1 || options.height > MAX_CUSTOM_PX) {
        setError(`Height must be between 1 and ${MAX_CUSTOM_PX} px (max ${(MAX_CUSTOM_PX / PX_PER_CM).toFixed(1)} cm).`);
        return;
      }
    }

    if (!isScaleDisabled) {
      const sStr = selectedScale.trim().toLowerCase();
      const sNum = parseFloat(sStr.replace("x", ""));
      if (!Number.isNaN(sNum) && sNum > 0) {
        options.scale = sNum;
      }
    }

    setConverting(true);
    try {
      const [res] = await Promise.all([
        convertText(svgCode, options),
        new Promise((resolve) => setTimeout(resolve, 2000))
      ]);

      setResult(res);
      showToast("success", "Conversion successful! Ready to download.");
      trackConversion("svg_converted", {
        output_format: res.format ?? "png",
        width: options.width,
        height: options.height,
        scale: options.scale,
      });
      if (res.remaining !== undefined) {
        const reached = res.remaining === 0;
        setUsage({
          conversionsUsed: res.conversionsUsed,
          remaining: res.remaining,
          isUnlimited: false,
          limitReached: reached,
        });
        window.dispatchEvent(new CustomEvent("crushUsageUpdated", { detail: { conversionsUsed: res.conversionsUsed, remaining: res.remaining } }));
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === "limit_reached" && status !== "authed") {
        setShowSignupPrompt(true);
        return;
      }
      if (err instanceof DOMException && err.name === "TimeoutError") {
        showToast("error", "Conversion timed out. Please try again.");
        return;
      }
      showToast("error", err instanceof Error ? err.message : "Conversion failed. Please try again.");
    } finally {
      setConverting(false);
    }
  }

  function handleDownload() {
    if (!result?.data) return;
    const dataUrl = `data:${result.mimeType};base64,${result.data}`;
    const ext = result.format === "jpeg" ? "jpg" : result.format;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `crushsvg-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast("success", "Downloading…");
    trackConversion("png_downloaded", { output_format: ext });
    if (limitReached && status !== "authed") {
      setLimitDownloadDone(true);
      setShowSignupPrompt(true);
    }
  }

  const cmPresets = ["5", "10", "15", "20", "30", "50", "75", "100"];
  const widthOptions = ["Original", "Custom", ...(unit === "cm" ? cmPresets : PRESET_SIZES)];
  const heightOptions = ["Auto", "Custom", ...(unit === "cm" ? cmPresets : PRESET_SIZES)];
  // Scale only applies when the SVG is converted at its intrinsic size — the
  // server ignores it once a width or height is set.
  const isScaleDisabled = selectedWidth !== "Original" || selectedHeight !== "Auto";

  const limitReached = usage !== null && !usage.isUnlimited && usage.limitReached;
  const isCheckingUsage = status === 'loading' || (status === 'guest' && usage === null && !usageFailed);

  return (
    <>
      <section id="converter" className="w-full max-w-[362px] md:max-w-[720px] lg:max-w-[1280px] mx-auto mt-[30px] md:mt-[48px] mb-[60px] md:mb-[100px] scroll-mt-[70px] md:scroll-mt-[96px]">
        {/* Outer Dashed Border Box */}
        <div className="w-full h-auto lg:h-[650px] border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[32px] p-0 md:p-[12px]">

          {/* Inner Dashed Border Box */}
          <div className="w-full h-auto lg:h-[626px] bg-transparent md:bg-[#FFFFFF] border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[24px] flex flex-col lg:flex-row justify-center px-0 md:px-[40px] py-0 md:py-[20px] gap-[24px] md:gap-[30px]">

            {/* Left Column (SVG Code) */}
            <div className="w-full lg:w-[537px] flex flex-col">
              <div className="flex items-center justify-between mb-[12px] h-[36px]">
                <h2 className="font-heading font-semibold text-[16px] text-[#475569]">
                  SVG Code
                </h2>
                <div className="flex items-center gap-[10px]">
                  {svgCode !== SAMPLE_SVG && !isPlaceholderCode && (
                    <button
                      type="button"
                      onClick={handleFormatSvg}
                      aria-label="Format SVG code"
                      className="rounded-[6px] border border-[#8F8F8F] px-[8px] py-[4px] font-body font-medium text-[12px] text-[#475569] hover:text-brand-primary hover:border-brand-primary transition-colors"
                      title="Format SVG Code"
                    >
                      Format Code
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleClearSvg}
                    aria-label="Clear SVG editor"
                    className={`group relative rounded-[6px] px-[12px] py-[4px] font-body font-medium text-[12px] md:text-[12px] overflow-hidden transition-opacity duration-300 ${svgCode !== SAMPLE_SVG ? "opacity-100" : "opacity-0 pointer-events-none"
                      }`}
                  >
                    <div
                      className="absolute inset-0 z-0 pointer-events-none"
                      style={{
                        border: "1px solid transparent",
                        background: "linear-gradient(#FFFFFF, #FFFFFF) padding-box, linear-gradient(to right, #D94A1E, #FF9A3D) border-box",
                        borderRadius: "inherit"
                      }}
                    />
                    <div
                      className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out pointer-events-none bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D]"
                    />
                    <span className="relative z-10 text-[#D94A1E] group-hover:text-white transition-colors duration-300 ease-in-out">
                      Clear
                    </span>
                  </button>
                  {usage && (
                    <span className="font-body font-normal text-[12px] md:text-[13px] text-[#475569]">
                      {usage.isUnlimited
                        ? "Unlimited conversions"
                        : `${usage.conversionsUsed} of ${usage.conversionsUsed + usage.remaining} free conversions used`}
                    </span>
                  )}
                </div>
              </div>

              {/* SVG Code Box */}
              <div className="relative w-full h-[200px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] bg-[#FFFFFF] overflow-hidden focus-within:border-brand-primary transition-colors">
                <textarea
                  id="svg-code-textarea"
                  value={svgCode === SAMPLE_SVG ? "" : svgCode}
                  placeholder={DUMMY_CODE}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      handleSvgChange(SAMPLE_SVG);
                    } else {
                      handleSvgChange(val);
                    }
                  }}
                  spellCheck={false}
                  aria-label="SVG code editor"
                  className="w-full h-full pt-[13px] px-[16px] pb-[26px] md:pt-[21px] md:px-[24px] md:pb-[42px] resize-none outline-none border-none bg-transparent font-body font-normal text-[16px] leading-[18.67px] text-black placeholder:text-[#94A3B8] whitespace-pre-wrap overflow-auto brand-scrollbar"
                />
                {/* Fake bottom padding overlay to fix WebKit textarea bug without shrinking scrollbar */}
                <div className="absolute bottom-0 left-0 right-[16px] h-[13px] md:h-[21px] bg-[#FFFFFF] pointer-events-none rounded-bl-[16px]" />
              </div>

              <input
                ref={fileInputRef}
                id="svg-file-upload"
                type="file"
                aria-label="Upload SVG file"
                accept=".svg,image/svg+xml"
                className="absolute w-0 h-0 opacity-0 overflow-hidden"
                onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = "" }}
              />

              {/* Drag & Drop Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                aria-label="Drag and drop or select an SVG file"
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click() }}
                className={`w-full h-[150px] md:h-[167px] rounded-[16px] border ${dragOver ? "border-solid border-brand-primary bg-gray-50" : "border-dashed md:border-solid border-[#8F8F8F] bg-transparent"} mt-[16px] flex flex-col items-center justify-center gap-[8px] md:gap-[10px] p-[16px] md:p-[40px] cursor-pointer hover:bg-gray-50 transition-colors`}
              >
                <Image src={IMAGES.drag} alt="Drag Cloud" width={64} height={64} style={{ width: "auto", height: "auto" }} className="object-contain w-[48px] md:w-[64px]" />
                <div className="font-body text-[14px] md:text-[16px] leading-[18.67px] text-text-dark">
                  <span className="font-normal">Drag & Drop or </span>
                  <span className="font-medium text-brand-primary">Select SVG</span>
                </div>
              </div>

              {/* Bottom Source Text */}
              <p className="font-body font-normal text-[12px] md:text-[14px] text-[#475569] mt-[12px] md:mt-[10px] ">
                {dims.width && dims.height
                  ? `Source size: ${dims.width} x ${dims.height} px${aspectLabel}`
                  : "Source size: unknown — set width/height or viewBox on your SVG"}
              </p>

              <p className="font-body text-[12px] md:text-[14px] text-[#475569] flex items-center justify-start gap-[6px] mt-[6px]">
                <Image src={IMAGES.lock} alt="Lock" width={12} height={12} style={{ width: "auto", height: "auto" }} className="w-[12px] object-contain" />
                <span>100% Private &amp; Secure — Files and SVG code are never shared or stored publicly.</span>
              </p>

            </div>

            {/* Right Column (Live Preview) */}
            <div className="w-full lg:w-[537px] flex flex-col">
              <div className="flex items-center justify-between mb-[12px] h-[36px]">
                <h2 className="font-heading font-semibold text-[16px] text-[#475569]">
                  Live Preview
                </h2>
              </div>

              {/* Live Preview Box */}
              <div className="w-full h-[200px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] flex items-center justify-center relative overflow-hidden bg-transparent md:bg-gray-50/30 p-[56px] md:p-[80px]">
                {storageRestored && previewUrl && !previewError ? (
                  <img
                    src={previewUrl}
                    alt="SVG preview"
                    className="w-full h-full object-contain drop-shadow-md"
                    onError={() => setPreviewError(true)}
                  />
                ) : storageRestored ? (
                  <img
                    src={IMAGES.uploadImage}
                    alt="Upload placeholder"
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                  />
                ) : null}
              </div>

              {/* Settings & Controls */}
              <div className="w-full mt-[16px] md:mt-[20px]">
                {/* Dropdowns Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[12px] md:gap-[20px] w-full">

                  {/* Width Input */}
                  <div className="flex flex-col flex-1 gap-[6px] md:gap-[8px] relative" ref={widthRef}>
                    <label className="text-[#475569] font-heading font-semibold text-[14px] md:text-[16px] leading-[18.67px]">Width</label>
                    <div className={`relative w-full h-[48px] md:h-[60px] rounded-[12px] border ${openDropdown === "width" ? "border-[#D94A1E]" : "border-[#8F8F8F]"} flex items-center justify-between bg-transparent md:bg-white focus-within:border-[#D94A1E] transition-colors overflow-hidden`}>
                      <div
                        onClick={() => setOpenDropdown(openDropdown === "width" ? null : "width")}
                        className="flex-1 min-w-0 h-full pl-[8px] md:pl-[12px] pr-[2px] flex items-center font-body font-medium text-[14px] md:text-[16px] text-[#353A3E] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
                      >
                        {isCustomWidth ? "Custom" : formatDimensionLabel(selectedWidth, unit)}
                      </div>
                      <button
                        type="button"
                        aria-label="Toggle width dropdown"
                        onClick={() =>
                          setOpenDropdown(openDropdown === "width" ? null : "width")
                        }
                        className="px-[8px] md:px-[12px] h-full flex items-center justify-center cursor-pointer bg-transparent shrink-0"
                      >
                        <svg
                          width="12"
                          height="8"
                          viewBox="0 0 12 8"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className={`transition-transform duration-200 ${openDropdown === "width" ? "rotate-180" : ""
                            }`}
                        >
                          <path
                            d="M1 1.5L6 6.5L11 1.5"
                            stroke="#353A3E"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Width Dropdown Menu */}
                    {openDropdown === "width" && (
                      <div className="absolute top-[80px] md:top-[90px] left-0 w-full max-h-[200px] bg-white border border-[#8F8F8F] rounded-[12px] shadow-lg z-10 overflow-hidden flex flex-col">
                        <div role="listbox" className="w-full max-h-[198px] overflow-y-auto py-[8px] brand-scrollbar">
                          {widthOptions.map((opt: string) => (
                            <div
                              key={opt}
                              role="option"
                              aria-selected={selectedWidth === opt}
                              onClick={() => {
                                if (opt === "Custom") {
                                  setIsCustomWidth(true);
                                  setSelectedWidth("");
                                } else {
                                  setIsCustomWidth(false);
                                  setSelectedWidth(opt);
                                }
                                setOpenDropdown(null);
                                resetConversion();
                              }}
                              className="px-[16px] py-[10px] font-body text-[14px] md:text-[16px] text-[#353A3E] hover:bg-gray-100 cursor-pointer transition-colors"
                            >
                              {formatDimensionLabel(opt, unit)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Height Input */}
                  <div className="flex flex-col flex-1 gap-[6px] md:gap-[8px] relative" ref={heightRef}>
                    <label className="text-[#475569] font-heading font-semibold text-[14px] md:text-[16px] leading-[18.67px]">Height</label>
                    <div className={`relative w-full h-[48px] md:h-[60px] rounded-[12px] border ${openDropdown === "height" ? "border-[#D94A1E]" : "border-[#8F8F8F]"} flex items-center justify-between bg-transparent md:bg-white focus-within:border-[#D94A1E] transition-colors overflow-hidden`}>
                      <div
                        onClick={() => setOpenDropdown(openDropdown === "height" ? null : "height")}
                        className="flex-1 min-w-0 h-full pl-[8px] md:pl-[12px] pr-[2px] flex items-center font-body font-medium text-[14px] md:text-[16px] text-[#353A3E] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
                      >
                        {isCustomHeight ? "Custom" : formatDimensionLabel(selectedHeight, unit)}
                      </div>
                      <button
                        type="button"
                        aria-label="Toggle height dropdown"
                        onClick={() => setOpenDropdown(openDropdown === "height" ? null : "height")}
                        className="px-[8px] md:px-[12px] h-full flex items-center justify-center cursor-pointer bg-transparent shrink-0"
                      >
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform duration-200 ${openDropdown === "height" ? "rotate-180" : ""}`}>
                          <path d="M1 1.5L6 6.5L11 1.5" stroke="#353A3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>

                    {/* Height Dropdown Menu */}
                    {openDropdown === "height" && (
                      <div className="absolute top-[80px] md:top-[90px] left-0 w-full max-h-[200px] bg-white border border-[#8F8F8F] rounded-[12px] shadow-lg z-10 overflow-hidden flex flex-col">
                        <div role="listbox" className="w-full max-h-[198px] overflow-y-auto py-[8px] brand-scrollbar">
                          {heightOptions.map((opt: string) => (
                            <div
                              key={opt}
                              role="option"
                              aria-selected={selectedHeight === opt}
                              onClick={() => {
                                if (opt === "Custom") {
                                  setIsCustomHeight(true);
                                  setSelectedHeight("");
                                } else {
                                  setIsCustomHeight(false);
                                  setSelectedHeight(opt);
                                }
                                setOpenDropdown(null);
                                resetConversion();
                              }}
                              className="px-[16px] py-[10px] font-body text-[14px] md:text-[16px] text-[#353A3E] hover:bg-gray-100 cursor-pointer transition-colors"
                            >
                              {formatDimensionLabel(opt, unit)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Unit Dropdown Input */}
                  {isScaleDisabled ? (
                    <div className="flex flex-col flex-1 gap-[6px] md:gap-[8px] relative" ref={unitRef}>
                      <label className="text-[#475569] font-heading font-semibold text-[14px] md:text-[16px] leading-[18.67px]">Unit</label>
                      <div className={`relative w-full h-[48px] md:h-[60px] rounded-[12px] border ${openDropdown === "unit" ? "border-[#D94A1E]" : "border-[#8F8F8F]"} flex items-center justify-between bg-transparent md:bg-white focus-within:border-[#D94A1E] transition-colors overflow-hidden`}>
                        <div
                          onClick={() => setOpenDropdown(openDropdown === "unit" ? null : "unit")}
                          className="flex-1 min-w-0 h-full pl-[8px] md:pl-[12px] pr-[2px] flex items-center font-body font-medium text-[14px] md:text-[16px] text-[#353A3E] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
                        >
                          {unit}
                        </div>
                        <button
                          type="button"
                          aria-label="Toggle unit dropdown"
                          onClick={() => setOpenDropdown(openDropdown === "unit" ? null : "unit")}
                          className="px-[8px] md:px-[12px] h-full flex items-center justify-center cursor-pointer bg-transparent shrink-0"
                        >
                          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform duration-200 ${openDropdown === "unit" ? "rotate-180" : ""}`}>
                            <path d="M1 1.5L6 6.5L11 1.5" stroke="#353A3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>

                      {/* Unit Dropdown Menu */}
                      {openDropdown === "unit" && (
                        <div className="absolute top-[80px] md:top-[90px] left-0 w-full max-h-[200px] bg-white border border-[#8F8F8F] rounded-[12px] shadow-lg z-10 overflow-hidden flex flex-col">
                          <div role="listbox" className="w-full py-[8px] brand-scrollbar">
                            {["px", "cm"].map((opt: any) => (
                              <div
                                key={opt}
                                role="option"
                                aria-selected={unit === opt}
                                onClick={() => {
                                  setUnit(opt);
                                  setSelectedWidth("Original");
                                  setSelectedHeight("Auto");
                                  setIsCustomWidth(false);
                                  setIsCustomHeight(false);
                                  setOpenDropdown(null);
                                  resetConversion();
                                }}
                                className="px-[16px] py-[10px] font-body text-[14px] md:text-[16px] text-[#353A3E] hover:bg-gray-100 cursor-pointer transition-colors"
                              >
                                {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col flex-1 gap-[6px] md:gap-[8px] relative" ref={scaleRef}>
                      <label htmlFor="scale-multiplier-input" className="text-[#475569] font-heading font-semibold text-[14px] md:text-[16px] leading-[18.67px]">Scale</label>
                      <div className={`relative w-full h-[48px] md:h-[60px] rounded-[12px] border ${openDropdown === "scale" ? "border-[#D94A1E]" : "border-[#8F8F8F]"} flex items-center justify-between bg-transparent md:bg-white focus-within:border-[#D94A1E] transition-colors overflow-hidden`}>
                        <input
                          id="scale-multiplier-input"
                          type="text"
                          value={selectedScale}
                          onChange={(e) => { setSelectedScale(e.target.value); resetConversion(); }}
                          onFocus={() => setOpenDropdown("scale")}
                          readOnly={!isCustomScale}
                          aria-label="Scale multiplier factor"
                          placeholder={isCustomScale ? "e.g. 6x" : "e.g. 2x"}
                          className={`flex-1 min-w-0 h-full bg-transparent pl-[8px] md:pl-[12px] pr-[2px] font-body font-medium text-[14px] md:text-[16px] text-[#353A3E] outline-none text-ellipsis ${!isCustomScale ? "cursor-default" : ""}`}
                        />
                        <button
                          type="button"
                          aria-label="Toggle scale dropdown"
                          onClick={() => setOpenDropdown(openDropdown === "scale" ? null : "scale")}
                          className="px-[8px] md:px-[12px] h-full flex items-center justify-center cursor-pointer shrink-0"
                        >
                          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform duration-200 ${openDropdown === "scale" ? "rotate-180" : ""}`}>
                            <path d="M1 1.5L6 6.5L11 1.5" stroke="#353A3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>

                      {/* Scale Dropdown Menu */}
                      {openDropdown === "scale" && (
                        <div className="absolute top-[80px] md:top-[90px] left-0 w-full max-h-[200px] bg-white border border-[#8F8F8F] rounded-[12px] shadow-lg z-10 overflow-hidden flex flex-col">
                          <div role="listbox" className="w-full max-h-[198px] overflow-y-auto py-[8px] brand-scrollbar">
                            {SCALE_OPTIONS.map((opt: string) => (
                              <div
                                key={opt}
                                role="option"
                                aria-selected={selectedScale === opt}
                                onClick={() => {
                                  if (opt === "Custom") {
                                    setIsCustomScale(true);
                                    setSelectedScale("");
                                  } else {
                                    setIsCustomScale(false);
                                    setSelectedScale(opt);
                                  }
                                  setOpenDropdown(null);
                                  resetConversion();
                                }}
                                className="px-[16px] py-[10px] font-body text-[14px] md:text-[16px] text-[#353A3E] hover:bg-gray-100 cursor-pointer transition-colors"
                              >
                                {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Custom Edit Row */}
                {(isCustomWidth || isCustomHeight) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] md:gap-[20px] w-full mt-[12px] md:mt-[16px]">
                    <div className="flex flex-col flex-1 gap-[6px] md:gap-[8px] w-full">
                      <label htmlFor="custom-width-input" className="text-[#475569] font-heading font-semibold text-[14px] md:text-[16px] leading-[18.67px]">Custom Width</label>
                      <div className="relative w-full h-[48px] md:h-[60px] rounded-[12px] border border-[#8F8F8F] bg-transparent md:bg-white focus-within:border-[#D94A1E] transition-colors flex items-center px-[12px] md:px-[16px]">
                        <input
                          id="custom-width-input"
                          type="text"
                          value={isCustomWidth ? selectedWidth : (selectedWidth === "Original" ? "" : selectedWidth.replace(/[^0-9.]/g, ''))}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^[0-9.]*$/.test(val)) {
                              setSelectedWidth(val);
                              setIsCustomWidth(true);
                            }
                            resetConversion();
                          }}
                          placeholder="e.g. 500"
                          aria-label="Custom width in pixels or centimeters"
                          className="flex-1 min-w-0 h-full bg-transparent outline-none font-body font-medium text-[14px] md:text-[16px] text-[#353A3E]"
                        />
                        {selectedWidth !== "Original" && selectedWidth !== "" && (
                          <span className="font-body font-medium text-[14px] md:text-[16px] text-[#475569] ml-[4px] pointer-events-none select-none">
                            {unit}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 gap-[6px] md:gap-[8px] w-full">
                      <label htmlFor="custom-height-input" className="text-[#475569] font-heading font-semibold text-[14px] md:text-[16px] leading-[18.67px]">Custom Height</label>
                      <div className="relative w-full h-[48px] md:h-[60px] rounded-[12px] border border-[#8F8F8F] bg-transparent md:bg-white focus-within:border-[#D94A1E] transition-colors flex items-center px-[12px] md:px-[16px]">
                        <input
                          id="custom-height-input"
                          type="text"
                          value={isCustomHeight ? selectedHeight : (selectedHeight === "Auto" ? "" : selectedHeight.replace(/[^0-9.]/g, ''))}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^[0-9.]*$/.test(val)) {
                              setSelectedHeight(val);
                              setIsCustomHeight(true);
                            }
                            resetConversion();
                          }}
                          placeholder="e.g. 500"
                          aria-label="Custom height in pixels or centimeters"
                          className="flex-1 min-w-0 h-full bg-transparent outline-none font-body font-medium text-[14px] md:text-[16px] text-[#353A3E]"
                        />
                        {selectedHeight !== "Auto" && selectedHeight !== "" && (
                          <span className="font-body font-medium text-[14px] md:text-[16px] text-[#475569] ml-[4px] pointer-events-none select-none">
                            {unit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Transparent Background Box */}
                <label htmlFor="transparent-bg-toggle" className="w-full h-[48px] md:h-[60px] rounded-[12px] border border-[#8F8F8F] mt-[12px] md:mt-[16px] px-[12px] md:px-[16px] flex items-center justify-between cursor-pointer hover:bg-gray-50 bg-transparent md:bg-white focus-within:border-[#D94A1E] transition-colors">
                  <span className="font-body font-normal text-[15px] md:text-[20px] leading-[18.67px] text-[#353A3E]">
                    Transparent Background
                  </span>
                  <input
                    id="transparent-bg-toggle"
                    type="checkbox"
                    checked={transparent}
                    aria-label="Enable transparent background for PNG output"
                    onChange={(e) => { setTransparent(e.target.checked); resetConversion(); }}
                    className="w-[18px] h-[18px] md:w-[20px] md:h-[20px] rounded border-[#8F8F8F] accent-brand-primary cursor-pointer"
                  />
                </label>

                {error && (
                  <div role="alert" className="rounded-[8px] border border-red-200 bg-red-50 px-[14px] py-[10px] mt-[12px] font-body text-[13px] leading-[18px] text-red-700">
                    {error}
                  </div>
                )}

                {/* Action Buttons Row */}
                {converting ? (
                  <div className="w-full h-[42px] mt-[16px] flex flex-col items-center justify-center gap-[6px] relative">
                    <div className="w-full sm:w-[280px] lg:w-[340px] h-[6px] bg-[#E2E8F0] rounded-full overflow-hidden relative">
                      <div
                        className="absolute top-0 left-0 h-full bg-[#D94A1E] transition-all duration-[2000ms] ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-[12px] md:gap-[16px] mt-[16px] relative">
                    {limitReached && status !== "authed" && (limitDownloadDone || !result?.data) ? (
                      <button
                        type="button"
                        onClick={() => setShowSignupPrompt(true)}
                        className="w-[300px] h-[42px] px-[16px] md:px-[24px] rounded-[8px] md:rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-body font-medium text-[14px] md:text-[16px] flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        Sign up for unlimited conversions
                      </button>
                    ) : result?.data ? (
                      <Button
                        className="w-[300px] h-[42px] px-[12px] md:px-[32px] rounded-[8px] md:rounded-[12px] gap-[6px] md:gap-[8px]"
                        onClick={handleDownload}
                        disabled={converting || isPlaceholderCode}
                      >
                        <span className="flex items-center justify-center gap-[6px] md:gap-[8px] text-[14px] md:text-[16px] w-full">
                          Download PNG
                          <Image src={IMAGES.exportIcon} alt="" width={16} height={16} style={{ width: "auto", height: "auto" }} className="brightness-0 invert md:w-[18px]" />
                        </span>
                      </Button>
                    ) : (
                      <Button
                        className="w-[300px] h-[42px] px-[12px] md:px-[32px] rounded-[8px] md:rounded-[12px] gap-[6px] md:gap-[8px]"
                        onClick={handleConvert}
                        disabled={converting}
                      >
                        <span className="flex items-center justify-center gap-[8px] text-[16px] w-full">
                          Convert
                          <Image src={IMAGES.exportIcon} alt="" width={20} height={20} style={{ width: "auto", height: "auto" }} className="brightness-0 invert md:w-[18px]" />
                        </span>
                      </Button>
                    )}

                    {result && result.warnings && result.warnings.length > 0 && (
                      <div role="alert" className="absolute top-full mt-[4px] rounded-[8px] border border-amber-200 bg-amber-50 px-[14px] py-[10px] font-body text-[11px] leading-[14px] text-amber-800 w-[300px] z-10 shadow-sm">
                        {result.warnings.map((w) => <p key={w}>{w}</p>)}
                      </div>
                    )}

                    {result && result.size !== undefined && (
                      <p className="absolute top-full mt-[4px] text-center font-body font-normal text-[10px] md:text-[11px] text-[#64748B] whitespace-nowrap">
                        {result.format.toUpperCase()} · {(result.size / 1024).toFixed(1)} KB
                        {result.width && result.height ? ` · ${result.width} x ${result.height} px` : ""}
                      </p>
                    )}
                  </div>
                )}


              </div>

            </div>

          </div>
        </div>
      </section>
      {showSignupPrompt && status !== "authed" && <SignupPromptModal onClose={() => setShowSignupPrompt(false)} />}
    </>
  );
}
