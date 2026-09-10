"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button";
import { SignupPromptModal } from "@/components/modals/SignupPromptModal";
import { useAuth, type AuthStatus } from "@/lib/client/auth-context";
import {
  convertText,
  isValidSvgContent,
  svgToDataUrl,
  type ConvertRequest,
  type ConvertResponse,
} from "@/lib/client/converter";
import { parseSvgDimensions } from "@/lib/svg/svg-dims";
import { formatSvgCode } from "@/lib/svg/format-svg";
import { ApiError, getAccessToken } from "@/lib/client/http";
import { getUsage } from "@/lib/client/sessions";
import type { UsageInfo } from "@/lib/shared/shared-types";
import { showToast } from "@/lib/client/toast-bridge";
import { trackConversion } from "@/lib/client/analytics";
import { IMAGES } from "@/lib/shared/images";
import { RasterToSvgConverter } from "@/components/sections/RasterToSvgConverter";

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

function normalizeHex(input: string): string {
  let hex = input.trim();
  if (!hex.startsWith("#")) hex = "#" + hex;
  if (hex.length === 4) {
    hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toUpperCase();
  return "#FFFFFF";
}

const formatDimensionLabel = (val: string, currentUnit: string) => {
  if (val === "Original" || val === "Auto" || val === "Custom") return val;
  return `${val} ${currentUnit}`;
};

export function ConverterUI({ mode = "svg-to-png" }: { mode?: "svg-to-png" | "raster-to-svg" }) {
  if (mode === "raster-to-svg") {
    return <RasterToSvgConverter />;
  }
  return <SvgToPngConverter />;
}

function SvgToPngConverter() {
  const tUpload = useTranslations("upload_interface");
  const tDownload = useTranslations("download_interface");
  const tStates = useTranslations("conversion_states");
  const tUsage = useTranslations("usage");
  const tToast = useTranslations("toasts");
  const tA11y = useTranslations("accessibility");
  const { status, sessionVersion } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<"width" | "height" | "scale" | "unit" | null>(null);
  const [selectedWidth, setSelectedWidth] = useState("Original");
  const [selectedHeight, setSelectedHeight] = useState("Auto");
  const [selectedScale, setSelectedScale] = useState("2x");
  const [unit, setUnit] = useState<"px" | "cm">("px");
  const [isCustomWidth, setIsCustomWidth] = useState(false);
  const [isCustomHeight, setIsCustomHeight] = useState(false);
  const [isCustomScale, setIsCustomScale] = useState(false);
  const [transparent, setTransparent] = useState(false);
  const [bgOption, setBgOption] = useState<"Transparent" | "White" | "Black" | "Custom">("White");
  const [customBgColor, setCustomBgColor] = useState("#FFFFFF");
  const [svgCode, setSvgCode] = useState(SAMPLE_SVG);
  const [converting, setConverting] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [usageFailed, setUsageFailed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const [dragOver, setDragOver] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [limitDownloadDone, setLimitDownloadDone] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const widthRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storageRestoredRef = useRef(false);
  const [storageRestored, setStorageRestored] = useState(false);
  const prevStatusRef = useRef<AuthStatus | null>(null);
  const convertAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (prev === "authed" && status !== "authed") {
      convertAbortRef.current?.abort();
      setSvgCode(SAMPLE_SVG);
      setResult(null);
      setError(null);
      setPreviewError(false);
      setUsage(null);
      setUsageFailed(false);
      setShowSignupPrompt(false);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("crush_converter_state");
        sessionStorage.removeItem("crush_vectorizer_state");
      }
    }
  }, [status]);

  const dims = useMemo(() => parseSvgDimensions(svgCode), [svgCode]);
  const aspectLabel = dims.width && dims.height ? ` (aspect ratio ${(dims.width / dims.height).toFixed(3)})` : "";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.tagName?.toLowerCase() === "label") {
        setOpenDropdown(null);
        return;
      }
      if (openDropdown === "width" && widthRef.current && !widthRef.current.contains(target)) {
        setOpenDropdown(null);
      }
      if (openDropdown === "height" && heightRef.current && !heightRef.current.contains(target)) {
        setOpenDropdown(null);
      }
      if (openDropdown === "scale" && scaleRef.current && !scaleRef.current.contains(target)) {
        setOpenDropdown(null);
      }
      if (openDropdown === "unit" && unitRef.current && !unitRef.current.contains(target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  useEffect(() => {
    // Authenticated users are unlimited — set immediately to avoid flash of stale guest data
    if (status === "authed") {
      queueMicrotask(() => {
        setUsage({ conversionsUsed: 0, remaining: null, isUnlimited: true, limitReached: false });
      });
    }

    if (status === "loading") return;
    if (status === "authed" && !getAccessToken()) return;

    let cancelled = false;
    getUsage()
      .then((u) => {
        if (!cancelled) setUsage(u);
      })
      .catch(() => {
        if (cancelled) return;
        if (status !== "authed") {
          setUsage(null);
          setUsageFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status, sessionVersion]);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = sessionStorage.getItem(CONVERTER_STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        const savedSvg = saved as { svgCode?: unknown; result?: unknown };
        if (typeof savedSvg.svgCode === "string" && savedSvg.svgCode.trim() !== "") {
          setSvgCode(savedSvg.svgCode);
        }
        const savedResult = savedSvg.result as ConvertResponse | undefined;
        if (savedResult && typeof savedResult.data === "string" && typeof savedResult.format === "string") {
          setResult(savedResult);
        }
      } catch {}
      finally {
        storageRestoredRef.current = true;
        setStorageRestored(true);
      }
    });
  }, [status, sessionVersion]);

  useEffect(() => {
    if (!storageRestoredRef.current) return;
    try {
      const persistableResult =
        result && result.data && result.data.length <= MAX_PERSISTED_RESULT_CHARS ? result : null;
      sessionStorage.setItem(CONVERTER_STORAGE_KEY, JSON.stringify({ svgCode, result: persistableResult }));
    } catch {}
  }, [svgCode, result]);

  const previewSvgUrl = useMemo(() => {
    if (!svgCode || svgCode.trim() === "") return "";
    return svgToDataUrl(svgCode);
  }, [svgCode]);

  const isValidSvg = useMemo(() => isValidSvgContent(svgCode), [svgCode]);
  const showCustomPreview = svgCode !== SAMPLE_SVG && svgCode.trim() !== "" && svgCode !== DUMMY_CODE && isValidSvg;
  const isPlaceholderCode = svgCode === SAMPLE_SVG || svgCode === DUMMY_CODE;
  const previewUrl = showCustomPreview ? previewSvgUrl : "";

  const resultImageUrl = useMemo(() => {
    if (!result?.data) return "";
    return `data:${result.mimeType || "image/png"};base64,${result.data}`;
  }, [result]);

  const activePreviewUrl = resultImageUrl || previewUrl;

  function handleSvgChange(value: string) {
    setSvgCode(value);
    setResult(null);
    setError(null);
    setPreviewError(false);
  }

  function resetConversion() {
    if (result) setResult(null);
    if (error) setError(null);
  }

  function resetDropdowns() {
    setSelectedWidth("Original");
    setSelectedHeight("Auto");
    setSelectedScale("2x");
    setUnit("px");
    setIsCustomWidth(false);
    setIsCustomHeight(false);
    setIsCustomScale(false);
    setTransparent(false);
    setBgOption("White");
    setCustomBgColor("#FFFFFF");
  }

  function handleClearSvg() {
    setSvgCode(SAMPLE_SVG);
    setResult(null);
    setError(null);
    setPreviewError(false);
    resetDropdowns();
    try {
      sessionStorage.removeItem(CONVERTER_STORAGE_KEY);
    } catch {}
  }

  useEffect(() => {
    function handleGlobalPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const text = e.clipboardData?.getData("text");
      if (text && isValidSvgContent(text)) {
        e.preventDefault();
        handleSvgChange(text.trim());
        resetDropdowns();
        showToast("success", tToast("svgPasted"));
      }
    }
    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [tToast]);

  function handleFormatSvg() {
    if (!svgCode || isPlaceholderCode || converting || isFormatting) return;
    if (svgCode.length > 1_000_000) {
      showToast("error", tToast("formatError") || "SVG code is too large to safely format (>1MB).");
      return;
    }

    setIsFormatting(true);
    // Yield to event loop so button disabled/loading state renders immediately without blocking UI
    setTimeout(() => {
      try {
        const { formatted, changed } = formatSvgCode(svgCode);
        if (!changed) {
          showToast("success", tToast("svgAlreadyFormatted"));
          return;
        }
        setSvgCode(formatted);
        showToast("success", tToast("svgFormatted"));
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : tToast("formatError"));
      } finally {
        setIsFormatting(false);
      }
    }, 16);
  }

  async function handleCopySvgCode() {
    const textToCopy = svgCode === SAMPLE_SVG || svgCode === DUMMY_CODE ? "" : svgCode;
    if (!textToCopy) {
      showToast("error", tToast("noSvgToCopy"));
      return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      showToast("success", tToast("svgCopied"));
    } catch {
      showToast("error", tToast("copyFailed"));
    }
  }

  async function handleFile(file: File | undefined | null) {
    if (converting) return;
    setError(null);
    if (!file) return;
    resetDropdowns();

    if (!file.type.includes("svg") && !file.name.toLowerCase().endsWith(".svg")) {
      setError(tToast("invalidSvgFile"));
      return;
    }
    if (Number(file.size) > 10 * 1024 * 1024) {
      setError(tToast("fileTooLarge"));
      return;
    }
    try {
      const text = await file.text();
      handleSvgChange(text.trimEnd());
    } catch {
      setError(tToast("fileReadError"));
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (converting) return;
    setError(null);
    void handleFile(e.dataTransfer.files?.[0]);
  }

  async function handleConvert() {
    if (isPlaceholderCode || svgCode.trim() === "") {
      showToast("error", tToast("pasteToStart"));
      return;
    }
    if (!isValidSvgContent(svgCode)) {
      setError(tToast("invalidSvgCode"));
      showToast("error", tToast("invalidSvgCode"));
      return;
    }
    setError(null);
    const resolvedBg = transparent ? "Transparent" : bgOption;
    const options: ConvertRequest = {
      transparent,
      bgOption: resolvedBg,
      bgColor: !transparent && bgOption === "Custom" ? normalizeHex(customBgColor) : undefined,
    };

    if (selectedWidth !== "Original" && selectedWidth.trim() !== "") {
      let wNum = parseFloat(selectedWidth);
      if (Number.isNaN(wNum)) {
        setError(tToast("invalidWidth", { max: MAX_CUSTOM_PX, maxCm: (MAX_CUSTOM_PX / PX_PER_CM).toFixed(1) }));
        return;
      }
      if (unit === "cm") wNum = wNum * PX_PER_CM;
      options.width = Math.round(wNum);
      if (options.width < 1 || options.width > MAX_CUSTOM_PX) {
        setError(tToast("invalidWidth", { max: MAX_CUSTOM_PX, maxCm: (MAX_CUSTOM_PX / PX_PER_CM).toFixed(1) }));
        return;
      }
    }

    if (selectedHeight !== "Auto" && selectedHeight.trim() !== "") {
      let hNum = parseFloat(selectedHeight);
      if (Number.isNaN(hNum)) {
        setError(tToast("invalidHeight", { max: MAX_CUSTOM_PX, maxCm: (MAX_CUSTOM_PX / PX_PER_CM).toFixed(1) }));
        return;
      }
      if (unit === "cm") hNum = hNum * PX_PER_CM;
      options.height = Math.round(hNum);
      if (options.height < 1 || options.height > MAX_CUSTOM_PX) {
        setError(tToast("invalidHeight", { max: MAX_CUSTOM_PX, maxCm: (MAX_CUSTOM_PX / PX_PER_CM).toFixed(1) }));
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
    const controller = new AbortController();
    convertAbortRef.current = controller;

    try {
      const res = await convertText(svgCode, { ...options, signal: controller.signal });
      if (controller.signal.aborted) return;

      setResult(res);
      const outputExt = (res.format ?? "png").toUpperCase();
      showToast("success", tToast("conversionComplete", { format: outputExt }));
      trackConversion("svg_converted", {
        output_format: res.format ?? "png",
        width: options.width,
        height: options.height,
        scale: options.scale,
      });
      if (status === "authed") {
        setUsage((prev) => ({
          conversionsUsed: res.conversionsUsed ?? (prev?.conversionsUsed ? prev.conversionsUsed + 1 : 1),
          remaining: null,
          isUnlimited: true,
          limitReached: false,
        }));
      } else if (res.remaining !== undefined) {
        const reached = res.remaining === 0;
        const updatedUsage = {
          conversionsUsed: res.conversionsUsed,
          remaining: res.remaining,
          isUnlimited: false,
          limitReached: reached,
        };
        setUsage(updatedUsage);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("crush_usage_info", JSON.stringify(updatedUsage));
          } catch {}
        }
        window.dispatchEvent(
          new CustomEvent("crushUsageUpdated", {
            detail: { conversionsUsed: res.conversionsUsed, remaining: res.remaining },
          })
        );
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof ApiError && err.code === "limit_reached" && status !== "authed") {
        setShowSignupPrompt(true);
        return;
      }
      if (err instanceof DOMException && err.name === "TimeoutError") {
        showToast("error", tToast("conversionTimedOut"));
        return;
      }
      let msg = err instanceof Error ? err.message : tToast("conversionFailed");
      if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("network")) {
        msg = "Conversion request failed. The SVG code or image may be too large or the network connection was interrupted.";
      }
      showToast("error", msg);
    } finally {
      if (!controller.signal.aborted) setConverting(false);
    }
  }

  function handleDownload() {
    if (!result?.data) return;
    const downloadUrl = `data:${result.mimeType};base64,${result.data}`;
    const ext = result.format === "jpeg" ? "jpg" : result.format;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `crushsvg-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast("success", tToast("downloadStarted"));
    trackConversion("png_downloaded", { output_format: ext });
    if (limitReached && status !== "authed") {
      setLimitDownloadDone(true);
      setShowSignupPrompt(true);
    }
  }

  const cmPresets = ["5", "10", "15", "20", "30", "50", "75", "100"];
  const widthOptions = ["Original", "Custom", ...(unit === "cm" ? cmPresets : PRESET_SIZES)];
  const heightOptions = ["Auto", "Custom", ...(unit === "cm" ? cmPresets : PRESET_SIZES)];
  const isScaleDisabled = selectedWidth !== "Original" || selectedHeight !== "Auto";
  const limitReached = usage !== null && !usage.isUnlimited && usage.limitReached;

  let validationError: string | null = null;
  if (isCustomWidth) {
    if (selectedWidth.trim() === "") {
      validationError = tToast("customWidthRequired");
    } else {
      let wNum = parseFloat(selectedWidth);
      if (Number.isNaN(wNum)) {
        validationError = tToast("invalidWidth", { max: MAX_CUSTOM_PX, maxCm: (MAX_CUSTOM_PX / PX_PER_CM).toFixed(1) });
      } else {
        if (unit === "cm") wNum = wNum * PX_PER_CM;
        if (wNum < 1 || wNum > MAX_CUSTOM_PX) {
          validationError = tToast("invalidWidth", { max: MAX_CUSTOM_PX, maxCm: (MAX_CUSTOM_PX / PX_PER_CM).toFixed(1) });
        }
      }
    }
  }

  if (!validationError && isCustomHeight) {
    if (selectedHeight.trim() === "") {
      validationError = tToast("customHeightRequired");
    } else {
      let hNum = parseFloat(selectedHeight);
      if (Number.isNaN(hNum)) {
        validationError = tToast("invalidHeight", { max: MAX_CUSTOM_PX, maxCm: (MAX_CUSTOM_PX / PX_PER_CM).toFixed(1) });
      } else {
        if (unit === "cm") hNum = hNum * PX_PER_CM;
        if (hNum < 1 || hNum > MAX_CUSTOM_PX) {
          validationError = tToast("invalidHeight", { max: MAX_CUSTOM_PX, maxCm: (MAX_CUSTOM_PX / PX_PER_CM).toFixed(1) });
        }
      }
    }
  }

  return (
    <>
      <section
        id="converter"
        aria-busy={converting}
        className="w-full max-w-[362px] md:max-w-[720px] lg:max-w-[1280px] mx-auto mt-[30px] md:mt-[48px] mb-[60px] md:mb-[100px] scroll-mt-[70px] md:scroll-mt-[96px]"
      >
        {/* Outer Dashed Border Box */}
        <div className="w-full h-auto border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[32px] p-0 md:p-[12px] transition-all duration-300 lg:min-h-[500px]">
          {/* Inner Dashed Border Box */}
          <div className="w-full h-auto bg-transparent md:bg-[#FFFFFF] border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[24px] flex flex-col justify-center px-0 md:px-[40px] py-[20px] transition-all duration-300 lg:min-h-[476px]">
            {/* Top row with columns */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-center w-full gap-[24px] md:gap-[30px]">
              {/* Left Column (SVG Code) */}
              <div className="w-full lg:w-[537px] flex flex-col">
                <div className="flex items-center justify-between mb-[12px] h-[36px]">
                  <h2 className="font-heading font-semibold text-[16px] text-[#475569]">{tUpload("svgCodeTab")}</h2>
                  <div className="flex items-center gap-[10px]">
                    {svgCode !== SAMPLE_SVG && !isPlaceholderCode && (
                      <button
                        type="button"
                        onClick={handleFormatSvg}
                        disabled={converting || isFormatting}
                        aria-label="Format SVG code"
                        className={`rounded-[6px] border px-[8px] py-[4px] font-body font-medium text-[12px] transition-colors ${
                          converting || isFormatting
                            ? "border-gray-300 text-gray-400 cursor-not-allowed pointer-events-none"
                            : "border-[#8F8F8F] text-[#475569] hover:text-brand-primary hover:border-brand-primary cursor-pointer"
                        }`}
                        title="Format SVG Code"
                      >
                        {isFormatting ? "Formatting…" : tUpload("formatCode")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleClearSvg}
                      disabled={converting}
                      aria-label="Clear SVG editor"
                      className={`group relative rounded-[6px] px-[12px] py-[4px] font-body font-medium text-[12px] md:text-[12px] overflow-hidden transition-opacity duration-300 ${
                        svgCode !== SAMPLE_SVG
                          ? converting
                            ? "opacity-50 cursor-not-allowed pointer-events-none"
                            : "opacity-100"
                          : "opacity-0 pointer-events-none"
                      }`}
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
                    <span suppressHydrationWarning className="font-body font-normal text-[12px] md:text-[14px] text-[#475569]">
                      {status === "loading"
                        ? "\u00A0"
                        : status === "authed" || usage?.isUnlimited
                        ? tUsage("unlimitedConversions")
                        : usage && !usageFailed
                        ? tUsage("conversionsUsed", {
                            used: usage.conversionsUsed,
                            total: usage.conversionsUsed + (usage.remaining ?? 0),
                          })
                        : "\u00A0"}
                    </span>
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
                    className="w-full h-full p-3 md:p-4 resize-none outline-none border-none bg-transparent font-body font-normal text-[16px] leading-[18.67px] text-black placeholder:text-[#94A3B8] whitespace-pre-wrap overflow-auto brand-scrollbar"
                  />
                  <div className="absolute bottom-0 left-0 right-[16px] h-[13px] md:h-[21px] bg-[#FFFFFF] pointer-events-none rounded-bl-[16px]" />
                  <button
                    type="button"
                    onClick={handleCopySvgCode}
                    disabled={svgCode === SAMPLE_SVG || !svgCode}
                    aria-label={copiedCode ? "SVG code copied" : "Copy SVG code"}
                    title={copiedCode ? "Copied!" : "Copy code"}
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
                  id="svg-file-upload"
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
                  aria-label="Drag and drop or select an SVG file"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                  }}
                  className={`w-full h-[150px] md:h-[167px] rounded-[16px] border ${
                    dragOver
                      ? "border-solid border-brand-primary bg-gray-50"
                      : "border-dashed md:border-solid border-[#8F8F8F] bg-transparent"
                  } mt-[16px] flex flex-col items-center justify-center gap-[8px] md:gap-[10px] p-[16px] md:p-[40px] cursor-pointer hover:bg-gray-50 focus-visible:border-brand-primary focus-visible:border-solid focus:outline-none active:border-brand-primary active:border-solid transition-colors`}
                >
                  <Image src={IMAGES.drag} alt="Drag Cloud" width={64} height={64} className="object-contain w-[56px] h-[56px] md:w-[64px] md:h-[64px] transition-transform duration-300 group-hover:scale-105" style={{ width: "auto", height: "auto" }} />
                  <div className="font-body text-[14px] md:text-[16px] leading-[18.67px] text-text-dark">
                    <span className="font-normal">{tUpload("dragOrSelectSvg")}</span>
                    <span className="font-medium text-brand-primary">{tUpload("selectSvg")}</span>
                  </div>
                </div>

                {/* Bottom Source Text */}
                <p className="font-body font-normal text-[12px] md:text-[14px] text-[#475569] mt-[12px] md:mt-[10px]">
                  {dims.width && dims.height
                    ? tUpload("sourceSize", { width: dims.width, height: dims.height, aspect: aspectLabel })
                    : tUpload("sourceSizeUnknown")}
                </p>

                <div className="mt-[16px] lg:mt-auto flex flex-col w-full">
                  {/* Feature Guide Box (when Custom is selected) */}
                  {(isCustomWidth || isCustomHeight) && (
                    <div className="w-full rounded-[12px] border border-[#8F8F8F] bg-white p-[14px] md:p-[16px] flex flex-col justify-center mt-[4px] mb-[12px] gap-[8px]">
                      <div className="font-heading font-semibold text-[13px] text-[#475569] flex items-center gap-1.5">
                        <span>{tUpload("proPngExport")}</span>
                      </div>
                      <ul className="text-[12px] md:text-[13px] text-[#64748B] flex flex-col gap-[5px]">
                        <li className="flex items-center gap-2">
                          <span className="text-brand-primary font-bold">✓</span>
                          <span>{tUpload("crispRendering")}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-brand-primary font-bold">✓</span>
                          <span>{tUpload("maintainsRatio")}</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  <p className="font-body text-[12px] md:text-[14px] text-[#475569] flex items-center justify-start gap-[6px]">
                    <Image src={IMAGES.lock} alt="Lock" width={12} height={12} className="shrink-0 w-[12px] h-[12px]" style={{ width: "auto", height: "auto" }} />
                    <span>{tUpload("privateNotice")}</span>
                  </p>
                </div>
              </div>

              {/* Right Column (Live Preview) */}
              <div className="w-full lg:w-[537px] flex flex-col">
                <div className="flex items-center justify-between mb-[12px] h-[36px]">
                  <h2 className="font-heading font-semibold text-[16px] text-[#475569]">
                    {result ? tDownload("convertedPngPreview") : tDownload("livePreview")}
                  </h2>
                  {result && (
                    <span className="font-body text-[11px] md:text-[12px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {tDownload("pngReady")}{result.width && result.height ? ` (${result.width}×${result.height})` : ""}
                    </span>
                  )}
                </div>

                {/* Live Preview Box */}
                <div className="w-full h-[200px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] flex items-center justify-center relative overflow-hidden bg-transparent md:bg-gray-50/30 p-[24px] md:p-[40px]">
                  {result && transparent && (
                    <div
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                        backgroundSize: "16px 16px",
                        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                      }}
                    />
                  )}
                  {converting ? (
                    <div className="flex flex-col items-center justify-center gap-3 z-20">
                      <div className="w-10 h-10 border-3 border-[#E2E8F0] border-t-brand-primary rounded-full animate-spin" />
                      <span className="font-body font-medium text-[14px] text-[#353A3E]">
                        {tStates("converting")}
                      </span>
                    </div>
                  ) : storageRestored && activePreviewUrl && !previewError ? (
                    <img
                      src={activePreviewUrl}
                      alt={result ? tA11y("convertedPngPreview") : tA11y("svgPreview")}
                      className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-md z-10"
                      onError={() => setPreviewError(true)}
                    />
                  ) : storageRestored ? (
                    <img
                      src={IMAGES.uploadImage}
                      alt={tA11y("uploadPlaceholder")}
                      className="max-w-full max-h-full w-auto h-auto object-contain"
                    />
                  ) : null}
                </div>

                {/* Settings & Controls */}
                <div className="w-full mt-[16px] md:mt-[20px] grow shrink-0 flex flex-col">
                  <div
                    className={`w-full h-full flex flex-col justify-between transition-all duration-300 ${
                      converting ? "hidden md:flex md:pointer-events-none opacity-50" : ""
                    }`}
                  >
                    {/* Dropdowns Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-[12px] md:gap-[20px] w-full">
                      {/* Width Input */}
                      <div className="flex flex-col flex-1 gap-[6px] md:gap-[8px] relative" ref={widthRef}>
                        <label className="text-[#475569] font-heading font-semibold text-[14px] md:text-[16px] leading-[18.67px]">
                          {tDownload("width")}
                        </label>
                        <div
                          className={`relative w-full h-[48px] md:h-[60px] rounded-[12px] border ${
                            openDropdown === "width" ? "border-[#D94A1E]" : "border-[#8F8F8F]"
                          } flex items-center justify-between bg-transparent md:bg-white focus-within:border-[#D94A1E] transition-colors overflow-hidden`}
                        >
                          <div
                            onClick={() => setOpenDropdown(openDropdown === "width" ? null : "width")}
                            className="flex-1 min-w-0 h-full pl-[8px] md:pl-[12px] pr-[2px] flex items-center font-body font-medium text-[14px] md:text-[16px] text-[#353A3E] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
                          >
                            {isCustomWidth ? "Custom" : formatDimensionLabel(selectedWidth, unit)}
                          </div>
                          <button
                            type="button"
                            aria-label="Toggle width dropdown"
                            aria-haspopup="listbox"
                            aria-expanded={openDropdown === "width"}
                            onClick={() => setOpenDropdown(openDropdown === "width" ? null : "width")}
                            className="px-[8px] md:px-[12px] h-full flex items-center justify-center cursor-pointer bg-transparent shrink-0"
                          >
                            <svg
                              width="12"
                              height="8"
                              viewBox="0 0 12 8"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className={`transition-transform duration-200 ${
                                openDropdown === "width" ? "rotate-180" : ""
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

                        {openDropdown === "width" && (
                          <div className="absolute top-[80px] md:top-[90px] left-0 w-full max-h-[200px] bg-white border border-[#8F8F8F] rounded-[12px] shadow-lg z-10 overflow-hidden flex flex-col">
                            <div role="listbox" className="w-full max-h-[198px] overflow-y-auto py-[8px] brand-scrollbar">
                              {widthOptions.map((opt: string) => (
                                <button
                                  type="button"
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
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Height Input */}
                      <div className="flex flex-col flex-1 gap-[6px] md:gap-[8px] relative" ref={heightRef}>
                        <label className="text-[#475569] font-heading font-semibold text-[14px] md:text-[16px] leading-[18.67px]">
                          {tDownload("height")}
                        </label>
                        <div
                          className={`relative w-full h-[48px] md:h-[60px] rounded-[12px] border ${
                            openDropdown === "height" ? "border-[#D94A1E]" : "border-[#8F8F8F]"
                          } flex items-center justify-between bg-transparent md:bg-white focus-within:border-[#D94A1E] transition-colors overflow-hidden`}
                        >
                          <div
                            onClick={() => setOpenDropdown(openDropdown === "height" ? null : "height")}
                            className="flex-1 min-w-0 h-full pl-[8px] md:pl-[12px] pr-[2px] flex items-center font-body font-medium text-[14px] md:text-[16px] text-[#353A3E] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
                          >
                            {isCustomHeight ? "Custom" : formatDimensionLabel(selectedHeight, unit)}
                          </div>
                          <button
                            type="button"
                            aria-label="Toggle height dropdown"
                            aria-haspopup="listbox"
                            aria-expanded={openDropdown === "height"}
                            onClick={() => setOpenDropdown(openDropdown === "height" ? null : "height")}
                            className="px-[8px] md:px-[12px] h-full flex items-center justify-center cursor-pointer bg-transparent shrink-0"
                          >
                            <svg
                              width="12"
                              height="8"
                              viewBox="0 0 12 8"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className={`transition-transform duration-200 ${
                                openDropdown === "height" ? "rotate-180" : ""
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

                        {openDropdown === "height" && (
                          <div className="absolute top-[80px] md:top-[90px] left-0 w-full max-h-[200px] bg-white border border-[#8F8F8F] rounded-[12px] shadow-lg z-10 overflow-hidden flex flex-col">
                            <div role="listbox" className="w-full max-h-[198px] overflow-y-auto py-[8px] brand-scrollbar">
                              {heightOptions.map((opt: string) => (
                                <button
                                  type="button"
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
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Unit / Scale Dropdown */}
                      {isScaleDisabled ? (
                        <div className="flex flex-col flex-1 gap-[6px] md:gap-[8px] relative" ref={unitRef}>
                          <label className="text-[#475569] font-heading font-semibold text-[14px] md:text-[16px] leading-[18.67px]">
                            {tDownload("unit")}
                          </label>
                          <div
                            className={`relative w-full h-[48px] md:h-[60px] rounded-[12px] border ${
                              openDropdown === "unit" ? "border-[#D94A1E]" : "border-[#8F8F8F]"
                            } flex items-center justify-between bg-transparent md:bg-white focus-within:border-[#D94A1E] transition-colors overflow-hidden`}
                          >
                            <div
                              onClick={() => setOpenDropdown(openDropdown === "unit" ? null : "unit")}
                              className="flex-1 min-w-0 h-full pl-[8px] md:pl-[12px] pr-[2px] flex items-center font-body font-medium text-[14px] md:text-[16px] text-[#353A3E] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
                            >
                              {unit}
                            </div>
                            <button
                              type="button"
                              aria-label="Toggle unit dropdown"
                              aria-haspopup="listbox"
                              aria-expanded={openDropdown === "unit"}
                              onClick={() => setOpenDropdown(openDropdown === "unit" ? null : "unit")}
                              className="px-[8px] md:px-[12px] h-full flex items-center justify-center cursor-pointer bg-transparent shrink-0"
                            >
                              <svg
                                width="12"
                                height="8"
                                viewBox="0 0 12 8"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className={`transition-transform duration-200 ${
                                  openDropdown === "unit" ? "rotate-180" : ""
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

                          {openDropdown === "unit" && (
                            <div className="absolute top-[80px] md:top-[90px] left-0 w-full max-h-[200px] bg-white border border-[#8F8F8F] rounded-[12px] shadow-lg z-10 overflow-hidden flex flex-col">
                              <div role="listbox" className="w-full py-[8px] brand-scrollbar">
                                {["px", "cm"].map((opt) => (
                                  <button
                                    type="button"
                                    key={opt}
                                    role="option"
                                    aria-selected={unit === opt}
                                    onClick={() => {
                                      setUnit(opt as "px" | "cm");
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
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col flex-1 gap-[6px] md:gap-[8px] relative" ref={scaleRef}>
                          <label
                            htmlFor="scale-multiplier-input"
                            className="text-[#475569] font-heading font-semibold text-[14px] md:text-[16px] leading-[18.67px]"
                          >
                            {tDownload("scale")}
                          </label>
                          <div
                            className={`relative w-full h-[48px] md:h-[60px] rounded-[12px] border ${
                              openDropdown === "scale" ? "border-[#D94A1E]" : "border-[#8F8F8F]"
                            } flex items-center justify-between bg-transparent md:bg-white focus-within:border-[#D94A1E] transition-colors overflow-hidden`}
                          >
                            <input
                              id="scale-multiplier-input"
                              type="text"
                              value={selectedScale}
                              onChange={(e) => {
                                setSelectedScale(e.target.value);
                                resetConversion();
                              }}
                              onFocus={() => setOpenDropdown("scale")}
                              readOnly={!isCustomScale}
                              aria-label="Scale multiplier factor"
                              placeholder={isCustomScale ? "e.g. 6x" : "e.g. 2x"}
                              className={`flex-1 min-w-0 h-full bg-transparent pl-[8px] md:pl-[12px] pr-[2px] font-body font-medium text-[14px] md:text-[16px] text-[#353A3E] outline-none text-ellipsis ${
                                !isCustomScale ? "cursor-default" : ""
                              }`}
                            />
                            <button
                              type="button"
                              aria-label="Toggle scale dropdown"
                              aria-haspopup="listbox"
                              aria-expanded={openDropdown === "scale"}
                              onClick={() => setOpenDropdown(openDropdown === "scale" ? null : "scale")}
                              className="px-[8px] md:px-[12px] h-full flex items-center justify-center cursor-pointer shrink-0"
                            >
                              <svg
                                width="12"
                                height="8"
                                viewBox="0 0 12 8"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className={`transition-transform duration-200 ${
                                  openDropdown === "scale" ? "rotate-180" : ""
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

                          {openDropdown === "scale" && (
                            <div className="absolute top-[80px] md:top-[90px] left-0 w-full max-h-[200px] bg-white border border-[#8F8F8F] rounded-[12px] shadow-lg z-10 overflow-hidden flex flex-col">
                              <div role="listbox" className="w-full max-h-[198px] overflow-y-auto py-[8px] brand-scrollbar">
                                {SCALE_OPTIONS.map((opt: string) => (
                                  <button
                                    type="button"
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
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Custom Width / Height Inputs */}
                    {(isCustomWidth || isCustomHeight) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] md:gap-[20px] w-full mt-[12px] md:mt-[16px]">
                        <div className="flex flex-col flex-1 gap-[6px] md:gap-[8px] w-full">
                          <label
                            htmlFor="custom-width-input"
                            className="text-[#475569] font-heading font-semibold text-[14px] md:text-[16px] leading-[18.67px]"
                          >
                            {tDownload("customWidth")}
                          </label>
                          <div className="relative w-full h-[48px] md:h-[60px] rounded-[12px] border border-[#8F8F8F] bg-transparent md:bg-white focus-within:border-[#D94A1E] transition-colors flex items-center px-[12px] md:px-[16px]">
                            <input
                              id="custom-width-input"
                              type="text"
                              value={
                                isCustomWidth
                                  ? selectedWidth
                                  : selectedWidth === "Original"
                                  ? ""
                                  : selectedWidth.replace(/[^0-9.]/g, "")
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^[0-9.]*$/.test(val)) {
                                  setSelectedWidth(val);
                                  setIsCustomWidth(true);
                                }
                                resetConversion();
                              }}
                              placeholder={unit === "cm" ? "e.g. 50" : "e.g. 500"}
                              aria-label="Custom width in pixels or centimeters"
                              autoComplete="off"
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
                          <label
                            htmlFor="custom-height-input"
                            className="text-[#475569] font-heading font-semibold text-[14px] md:text-[16px] leading-[18.67px]"
                          >
                            {tDownload("customHeight")}
                          </label>
                          <div className="relative w-full h-[48px] md:h-[60px] rounded-[12px] border border-[#8F8F8F] bg-transparent md:bg-white focus-within:border-[#D94A1E] transition-colors flex items-center px-[12px] md:px-[16px]">
                            <input
                              id="custom-height-input"
                              type="text"
                              value={
                                isCustomHeight
                                  ? selectedHeight
                                  : selectedHeight === "Auto"
                                  ? ""
                                  : selectedHeight.replace(/[^0-9.]/g, "")
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^[0-9.]*$/.test(val)) {
                                  setSelectedHeight(val);
                                  setIsCustomHeight(true);
                                }
                                resetConversion();
                              }}
                              placeholder={unit === "cm" ? "e.g. 50" : "e.g. 500"}
                              aria-label="Custom height in pixels or centimeters"
                              autoComplete="off"
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
                    <label
                      htmlFor="transparent-bg-toggle"
                      className="w-full h-[48px] md:h-[60px] rounded-[12px] border border-[#8F8F8F] mt-[12px] md:mt-[16px] px-[12px] md:px-[16px] flex items-center justify-between cursor-pointer hover:bg-gray-50 bg-transparent md:bg-white focus-within:border-[#D94A1E] transition-colors"
                    >
                      <span className="font-body font-normal text-[14px] md:text-[20px] leading-[18.67px] text-[#353A3E]">
                        {tDownload("transparent")} {tDownload("background")}
                      </span>
                      <input
                        id="transparent-bg-toggle"
                        type="checkbox"
                        checked={transparent}
                        aria-label="Enable transparent background for PNG output"
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setTransparent(isChecked);
                          setBgOption(isChecked ? "Transparent" : "White");
                          resetConversion();
                        }}
                        className="w-[18px] h-[18px] md:w-[20px] md:h-[20px] rounded border-[#8F8F8F] accent-brand-primary cursor-pointer"
                      />
                    </label>

                    {/* Custom Background Color Selection when Transparent is unchecked
                    {!transparent && (
                      <div className="w-full rounded-[12px] border border-[#8F8F8F] mt-[12px] p-[12px] md:p-[16px] bg-white flex flex-col gap-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="font-body font-medium text-[13px] md:text-[15px] text-[#353A3E]">
                            Background Color
                          </span>
                          <div className="flex items-center gap-1.5">
                            {(["White", "Black", "Custom"] as const).map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setBgOption(opt);
                                  resetConversion();
                                }}
                                className={`px-2.5 py-1 rounded-[6px] font-body text-[12px] md:text-[13px] font-medium transition-all cursor-pointer ${
                                  bgOption === opt
                                    ? "bg-brand-primary text-white shadow-xs"
                                    : "bg-gray-100 text-[#475569] hover:bg-gray-200"
                                }`}
                              >
                                {opt === "Custom" ? "Custom Color" : opt}
                              </button>
                            ))}
                          </div>
                        </div>

                        {bgOption === "Custom" && (
                          <div className="pt-[8px] border-t border-gray-100 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              {COLOR_PRESETS.map((c) => (
                                <button
                                  key={c.hex}
                                  type="button"
                                  onClick={() => {
                                    setCustomBgColor(c.hex);
                                    resetConversion();
                                  }}
                                  title={c.name}
                                  style={{ backgroundColor: c.hex }}
                                  className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                                    customBgColor.toLowerCase() === c.hex.toLowerCase()
                                      ? "border-[#D94A1E] scale-110 shadow-xs ring-2 ring-[#D94A1E]/30"
                                      : "border-gray-300 hover:scale-105"
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <label
                                htmlFor="custom-bg-color-picker"
                                className="w-8 h-8 rounded-[6px] border border-gray-300 cursor-pointer overflow-hidden flex items-center justify-center shrink-0"
                                style={{ backgroundColor: customBgColor }}
                              >
                                <input
                                  id="custom-bg-color-picker"
                                  type="color"
                                  value={normalizeHex(customBgColor)}
                                  onChange={(e) => {
                                    setCustomBgColor(e.target.value);
                                    resetConversion();
                                  }}
                                  className="opacity-0 w-0 h-0 cursor-pointer"
                                />
                              </label>
                              <input
                                type="text"
                                value={customBgColor}
                                onChange={(e) => {
                                  setCustomBgColor(e.target.value);
                                  resetConversion();
                                }}
                                maxLength={7}
                                placeholder="#FFFFFF"
                                className="w-24 h-8 px-2 rounded-[6px] border border-gray-300 font-mono text-[12px] text-[#353A3E] outline-none focus:border-[#D94A1E]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    */}
                  </div>
                </div>

                {validationError && (
                  <div
                    role="alert"
                    className="rounded-[8px] border border-red-200 bg-red-50 px-[14px] py-[10px] mt-[10px] mb-[4px] font-body text-[14px] leading-[18px] text-red-700 w-full text-center"
                  >
                    {validationError}
                  </div>
                )}

                {/* Action Buttons Row */}
                {converting ? (
                  <div
                    className="w-full h-[42px] mt-[12px] md:mt-[16px] flex flex-col items-center justify-center gap-[6px] relative"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="w-full sm:w-[280px] lg:w-[340px] h-[6px] bg-[#E2E8F0] rounded-full overflow-hidden relative">
                      <div
                        className="absolute top-0 left-0 h-full bg-[#D94A1E] rounded-full animate-[indeterminate_1.8s_ease-in-out_infinite]"
                        style={{ width: "40%" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-[12px] md:gap-[16px] mt-[12px] md:mt-[16px] relative">
                    {mounted && limitReached && status !== "authed" && (limitDownloadDone || !result?.data) ? (
                      <button
                        type="button"
                        onClick={() => setShowSignupPrompt(true)}
                        className="w-[300px] h-[42px] px-[16px] md:px-[24px] rounded-[8px] md:rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-body font-medium text-[14px] md:text-[16px] flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        {tUsage("signUpForFree")}
                      </button>
                    ) : result?.data ? (
                      <>
                        <Button
                          className="w-[300px] h-[44px] md:h-[48px] px-[12px] md:px-[32px] rounded-[12px] gap-[8px] shadow-sm"
                          onClick={handleDownload}
                          disabled={converting || isPlaceholderCode || !!validationError}
                        >
                          <span className="flex items-center justify-center gap-[6px] md:gap-[8px] text-[14px] md:text-[16px] w-full">
                            {tDownload("downloadPng")}
                            <Image
                              src={IMAGES.exportIcon}
                              alt=""
                              width={16}
                              height={16}
                              className="brightness-0 invert"
                            />
                          </span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="w-[300px] h-[44px] md:h-[48px] px-[12px] md:px-[32px] rounded-[12px] gap-[8px] shadow-sm"
                        onClick={handleConvert}
                        disabled={converting || isPlaceholderCode || !!validationError}
                      >
                        <span className="flex items-center justify-center gap-[8px] text-[16px] w-full">
                          {tDownload("convertButton")}
                          <Image
                            src={IMAGES.exportIcon}
                            alt=""
                            width={20}
                            height={20}
                            className="brightness-0 invert"
                          />
                        </span>
                      </Button>
                    )}

                    {result && result.warnings && result.warnings.length > 0 && (
                      <div
                        role="alert"
                        className="absolute top-full mt-[4px] rounded-[8px] border border-amber-200 bg-amber-50 px-[14px] py-[10px] font-body text-[12px] leading-[14px] text-amber-800 w-[300px] z-10 shadow-sm"
                      >
                        {result.warnings.map((w) => (
                          <p key={w}>{w}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      {showSignupPrompt && status !== "authed" && (
        <SignupPromptModal onClose={() => setShowSignupPrompt(false)} />
      )}
    </>
  );
}
