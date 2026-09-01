"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/Button";
import { SignupPromptModal } from "@/components/modals/SignupPromptModal";
import { useAuth, type AuthStatus } from "@/lib/client/auth-context";
import { svgToDataUrl } from "@/lib/client/converter";
import { convertPngToSvg, type QualityLevel } from "@/lib/png-to-svg";
import { getAccessToken } from "@/lib/client/http";
import { getUsage } from "@/lib/client/sessions";
import type { UsageInfo } from "@/lib/shared/shared-types";
import { showToast } from "@/lib/client/toast-bridge";
import { trackConversion } from "@/lib/client/analytics";
import { IMAGES } from "@/lib/shared/images";

const STORAGE_KEY = "crush_vectorizer_state";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_PERSISTED_RESULT_CHARS = 1_500_000;

interface DropdownOption {
  value: string;
  label: string;
  desc: string;
}

const QUALITY_OPTIONS: DropdownOption[] = [
  { value: "standard", label: "Standard", desc: "Balanced detail & file size" },
  { value: "max", label: "High", desc: "Maximum detail & sharp edges" },
  { value: "draft", label: "Low", desc: "Smooth, lightweight paths" },
];

const QUALITY_MAP: Record<string, QualityLevel> = {
  draft: "low",
  standard: "standard",
  max: "high",
};

const COLOR_OPTIONS: DropdownOption[] = [
  { value: "Auto", label: "Auto", desc: "Engine picks the best palette" },
  { value: "8", label: "Limited (8)", desc: "Flat palette for icons & logos" },
  { value: "24", label: "Rich (24)", desc: "More colors for detailed graphics" },
  { value: "48", label: "Full (48)", desc: "High color depth for photos" },
];

const MODE_OPTIONS: DropdownOption[] = [
  { value: "auto", label: "Auto", desc: "Detect logo, line art, or photo" },
  { value: "logo", label: "Logo / Icon", desc: "Posterized color shapes" },
  { value: "line-art", label: "Line Art", desc: "Monochrome vector outlines" },
  { value: "photo", label: "Photo", desc: "Stylized posterized artwork" },
];

const BACKGROUND_OPTIONS: DropdownOption[] = [
  { value: "Preserve", label: "Preserve", desc: "Keep original image background" },
  { value: "Transparent", label: "Transparent", desc: "Remove background, alpha vector" },
  { value: "Custom", label: "Custom Color", desc: "Fill with chosen background color" },
];

const COLOR_PRESETS = [
  { name: "White", hex: "#ffffff" },
  { name: "Black", hex: "#000000" },
  { name: "Slate", hex: "#1e293b" },
  { name: "Orange", hex: "#d94a1e" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Emerald", hex: "#059669" },
];

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}


interface CustomDropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (val: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  customColor?: string;
  onCustomColorChange?: (color: string) => void;
}

function VectorDropdown({
  label,
  value,
  options,
  onChange,
  isOpen,
  onToggle,
  dropdownRef,
  disabled,
  customColor,
  onCustomColorChange,
}: CustomDropdownProps) {
  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div className="flex flex-col flex-1 gap-[6px] relative" ref={dropdownRef}>
      <label className="text-[#475569] font-heading font-semibold text-[13px] md:text-[15px] leading-[18px]">
        {label}
      </label>
      <div
        onClick={() => {
          if (!disabled) onToggle();
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className={`relative w-full h-[46px] md:h-[52px] rounded-[12px] border ${
          isOpen ? "border-[#D94A1E]" : "border-[#8F8F8F]"
        } flex items-center justify-between bg-white px-[12px] md:px-[14px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-colors select-none ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[#D94A1E]"
        }`}
      >
        {value === "Custom" && customColor ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-body font-medium text-[13px] md:text-[15px] text-[#353A3E] truncate">
              Custom
            </span>
            <span
              className="w-[16px] h-[16px] rounded-full border border-gray-300 shrink-0 inline-block shadow-2xs"
              style={{ backgroundColor: customColor }}
            />
            <span className="font-mono text-[11px] md:text-[12px] text-brand-primary font-semibold uppercase shrink-0">
              {customColor}
            </span>
          </div>
        ) : (
          <span className="font-body font-medium text-[13px] md:text-[15px] text-[#353A3E] truncate">
            {selected.label}
          </span>
        )}
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Toggle ${label} options`}
          className="h-full flex items-center justify-center cursor-pointer bg-transparent shrink-0 pl-2 pointer-events-none"
        >
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full max-h-[260px] bg-white border border-[#8F8F8F] rounded-[12px] shadow-xl z-40 overflow-hidden flex flex-col">
          <div role="listbox" className="w-full max-h-[258px] overflow-y-auto py-[6px] brand-scrollbar">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onChange(opt.value)}
                  className={`px-[14px] py-[8px] flex flex-col gap-[2px] cursor-pointer transition-colors ${
                    isSelected ? "bg-[#FFF1EC] text-[#D94A1E]" : "hover:bg-[#FFF7F4] text-[#353A3E]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-body font-semibold text-[13px] md:text-[14px]">
                      {opt.label}
                    </span>
                    {isSelected && (
                      <svg
                        width="12"
                        height="10"
                        viewBox="0 0 14 11"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="shrink-0"
                      >
                        <path
                          d="M1.5 5.5L5 9L12.5 1.5"
                          stroke="#D94A1E"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="font-body text-[11px] md:text-[12px] text-[#64748B]">
                    {opt.desc}
                  </span>

                  {opt.value === "Custom" && onCustomColorChange && customColor && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1.5 pt-1.5 border-t border-gray-200/80 flex items-center justify-between gap-1 flex-wrap"
                    >
                      <div className="flex items-center gap-1 flex-wrap">
                        {COLOR_PRESETS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            title={c.name}
                            onClick={(e) => {
                              e.stopPropagation();
                              onCustomColorChange(c.hex);
                            }}
                            className={`w-[18px] h-[18px] rounded-full border border-gray-300 transition-transform ${
                              customColor.toLowerCase() === c.hex.toLowerCase()
                                ? "scale-115 ring-2 ring-brand-primary"
                                : "hover:scale-105"
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => onCustomColorChange(e.target.value)}
                          className="w-[20px] h-[20px] p-0 border-none rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={customColor}
                          onChange={(e) => onCustomColorChange(e.target.value)}
                          maxLength={7}
                          className="w-[58px] h-[22px] px-1 font-mono text-[10px] border border-gray-300 rounded outline-none focus:border-brand-primary uppercase text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function RasterToSvgConverter() {
  const { status, sessionVersion } = useAuth();

  // Settings
  const [rasterQuality, setRasterQuality] = useState("standard");
  const [rasterColors, setRasterColors] = useState("Auto");
  const [rasterMode, setRasterMode] = useState("auto");
  const [rasterBackground, setRasterBackground] = useState("Preserve");
  const [rasterBgColor, setRasterBgColor] = useState("#ffffff");

  // File & State
  const [rasterFile, setRasterFile] = useState<File | null>(null);
  const [rasterDataUrl, setRasterDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<number | null>(null);
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);

  // Conversion result
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    svg: string;
    size: number;
    modeUsed?: "pixel" | "vector";
    qualityUsed?: QualityLevel;
    conversionsUsed?: number;
    remaining?: number;
    imageClass?: string;
    advisory?: string;
  } | null>(null);

  // Preview & Dropdowns
  const [previewMode, setPreviewMode] = useState<"vector" | "source" | "code">("vector");
  const [copiedCode, setCopiedCode] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"quality" | "colors" | "mode" | "background" | null>(null);

  // Auth & Quota
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [usageFailed, setUsageFailed] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [limitDownloadDone, setLimitDownloadDone] = useState(false);

  // Storage
  const [storageRestored, setStorageRestored] = useState(false);
  const storageRestoredRef = useRef(false);
  const prevStatusRef = useRef<AuthStatus | null>(null);

  // Refs for outside click
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qualityRef = useRef<HTMLDivElement>(null);
  const colorsRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  // Wipe data when signing out
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (prev === "authed" && status !== "authed") {
      setRasterFile(null);
      setRasterDataUrl(null);
      setImageName(null);
      setImageSize(null);
      setImageDims(null);
      setResult(null);
      setError(null);
      setUsage(null);
      setUsageFailed(false);
      setShowSignupPrompt(false);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, [status]);

  // Usage polling
  useEffect(() => {
    if (status === "loading") return;
    if (status === "authed" && !getAccessToken()) return;
    let cancelled = false;
    getUsage()
      .then((u) => {
        if (!cancelled) setUsage(u);
      })
      .catch(() => {
        if (!cancelled) {
          setUsage(null);
          setUsageFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status, sessionVersion]);

  // Outside click listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.tagName?.toLowerCase() === "label") {
        setOpenDropdown(null);
        return;
      }
      if (openDropdown === "quality" && qualityRef.current && !qualityRef.current.contains(target)) {
        setOpenDropdown(null);
      }
      if (openDropdown === "colors" && colorsRef.current && !colorsRef.current.contains(target)) {
        setOpenDropdown(null);
      }
      if (openDropdown === "background" && backgroundRef.current && !backgroundRef.current.contains(target)) {
        setOpenDropdown(null);
      }
      if (openDropdown === "mode" && modeRef.current && !modeRef.current.contains(target)) {
        setOpenDropdown(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenDropdown(null);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openDropdown]);

  // Smooth progress bar during conversion
  useEffect(() => {
    if (converting) {
      const timer = setTimeout(() => setProgress(90), 50);
      return () => clearTimeout(timer);
    }
    queueMicrotask(() => setProgress(0));
  }, [converting]);

  // Restore state from sessionStorage after hydration
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (typeof saved.rasterDataUrl === "string") {
            setRasterDataUrl(saved.rasterDataUrl);
          }
          if (typeof saved.imageName === "string") {
            setImageName(saved.imageName);
          }
          if (typeof saved.imageSize === "number") {
            setImageSize(saved.imageSize);
          }
          if (saved.imageDims && typeof saved.imageDims.width === "number") {
            setImageDims(saved.imageDims);
          }
          if (typeof saved.quality === "string") setRasterQuality(saved.quality);
          if (typeof saved.colors === "string") setRasterColors(saved.colors);
          if (typeof saved.background === "string") setRasterBackground(saved.background);
          if (typeof saved.bgColor === "string") setRasterBgColor(saved.bgColor);
          if (typeof saved.mode === "string") setRasterMode(saved.mode);
          if (saved.result && typeof saved.result.svg === "string") {
            setResult(saved.result);
          }
        }
      } catch {}
      finally {
        storageRestoredRef.current = true;
        setStorageRestored(true);
      }
    });
  }, []);

  // Save state to sessionStorage
  useEffect(() => {
    if (!storageRestoredRef.current) return;
    try {
      const persistableResult =
        result && result.svg && result.svg.length <= MAX_PERSISTED_RESULT_CHARS ? result : null;
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          rasterDataUrl,
          imageName,
          imageSize,
          imageDims,
          quality: rasterQuality,
          colors: rasterColors,
          background: rasterBackground,
           bgColor: rasterBgColor,
           mode: rasterMode,
           result: persistableResult,
        })
      );
    } catch {}
  }, [
    rasterDataUrl,
    imageName,
    imageSize,
    imageDims,
    rasterQuality,
    rasterColors,
    rasterMode,
    rasterBackground,
    rasterBgColor,
    result,
  ]);

  // Global clipboard paste listener
  useEffect(() => {
    function handleGlobalPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.clipboardData && e.clipboardData.items) {
        const items = Array.from(e.clipboardData.items);
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              void handleFile(file);
              showToast("success", "Image pasted from clipboard");
              return;
            }
          }
        }
      }
    }
    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, []);

  function handleFile(file: File | undefined | null) {
    if (!file) return;
    setError(null);

    const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    const isJpg =
      file.type === "image/jpeg" ||
      file.name.toLowerCase().endsWith(".jpg") ||
      file.name.toLowerCase().endsWith(".jpeg");
    const isWebp = file.type === "image/webp" || file.name.toLowerCase().endsWith(".webp");

    if (!isPng && !isJpg && !isWebp) {
      setError("Please choose a valid PNG, JPG, or WebP image file.");
      showToast("error", "Unsupported file type. Please upload PNG, JPG, or WebP.");
      return;
    }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setError(`Image too large (${sizeMB}MB). Maximum allowed size is 10MB.`);
        showToast("error", "Image exceeds 10MB limit.");
        return;
      }

    setRasterFile(file);
    setImageName(file.name);
    setImageSize(file.size);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setRasterDataUrl(dataUrl);

      const img = new window.Image();
      img.onload = () => {
        setImageDims({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files?.[0]);
  }

  function handleClear() {
    setRasterFile(null);
    setRasterDataUrl(null);
    setImageName(null);
    setImageSize(null);
    setImageDims(null);
    setResult(null);
    setError(null);
    setPreviewMode("vector");
    setRasterQuality("standard");
    setRasterColors("Auto");
    setRasterMode("auto");
    setRasterBackground("Preserve");
    setRasterBgColor("#ffffff");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    showToast("success", "Cleared image and converter settings");
  }

  async function handleLoadSample() {
    try {
      const res = await fetch("/apple-touch-icon.png");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const file = new File([blob], "crushsvg-icon.png", { type: "image/png" });
      handleFile(file);
      showToast("success", "Loaded sample CrushSVG icon");
    } catch {
      showToast("error", "Could not load sample image");
    }
  }

  async function handleConvert() {
    if (!rasterFile && !rasterDataUrl) {
      showToast("error", "No image selected. Upload a PNG or JPG to convert.");
      return;
    }
    setError(null);
    setConverting(true);

    try {
      let fileToConvert: File;
      if (rasterFile) {
        fileToConvert = rasterFile;
      } else {
        const res = await fetch(rasterDataUrl!);
        const blob = await res.blob();
        fileToConvert = new File([blob], imageName || "restored-image.png", { type: blob.type });
      }

      const res = await convertPngToSvg(fileToConvert, {
        quality: QUALITY_MAP[rasterQuality] ?? "standard",
      });

      setResult({
        svg: res.svg,
        size: res.outputSize,
        modeUsed: res.modeUsed,
        qualityUsed: res.qualityUsed,
      });
      setPreviewMode("vector");
      showToast("success", "Vectorization complete! Ready to download.");
      trackConversion("raster_vectorized", { output_format: "svg" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Vectorization failed. Please try again.";
      setError(msg);
      showToast("error", msg);
    } finally {
      setConverting(false);
    }
  }

  function handleDownload() {
    if (!result?.svg) return;
    const blob = new Blob([result.svg], { type: "image/svg+xml;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const baseName = (imageName || "vectorized").replace(/\.[^/.]+$/, "");
    a.href = downloadUrl;
    a.download = `crushsvg-${baseName}-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(downloadUrl);
    showToast("success", "Your SVG download has started");
    trackConversion("svg_downloaded", { output_format: "svg" });

    if (limitReached && status !== "authed") {
      setLimitDownloadDone(true);
      setShowSignupPrompt(true);
    }
  }

  async function handleCopySvg() {
    if (!result?.svg) return;
    try {
      await navigator.clipboard.writeText(result.svg);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      showToast("success", "SVG vector markup copied to clipboard");
    } catch {
      showToast("error", "Failed to copy SVG. You can download the file instead.");
    }
  }

  const limitReached = usage !== null && !usage.isUnlimited && usage.limitReached;
  const isSvgResult = !!result?.svg;
  const previewSvgUrl = useMemo(() => {
    if (!result?.svg) return "";
    return svgToDataUrl(result.svg);
  }, [result?.svg]);

  const fileExt = imageName ? imageName.split(".").pop()?.toUpperCase() : "IMAGE";

  return (
    <>
      <section
        id="converter"
        className="w-full max-w-[362px] md:max-w-[720px] lg:max-w-[1280px] mx-auto mt-[30px] md:mt-[48px] mb-[60px] md:mb-[100px] scroll-mt-[70px] md:scroll-mt-[96px]"
      >
        {/* Outer Dashed Border Box */}
        <div className="w-full h-auto border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[32px] p-0 md:p-[12px] transition-all duration-300">
          {/* Inner Dashed Border Box */}
          <div className="w-full h-auto bg-transparent md:bg-[#FFFFFF] border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[24px] flex flex-col justify-center px-0 md:px-[40px] py-[20px] md:py-[32px] transition-all duration-300">
            {/* Two-Column Grid */}
            <div className="flex flex-col lg:flex-row justify-center w-full gap-[24px] md:gap-[30px]">
              {/* ============================================================ */}
              {/* LEFT COLUMN: Source Image Upload & Info                      */}
              {/* ============================================================ */}
              <div className="w-full lg:w-[537px] flex flex-col">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-[12px] h-[36px]">
                  <h2 className="font-heading font-semibold text-[16px] text-[#475569]">
                    Source Image
                  </h2>
                  <div className="flex items-center gap-[10px]">
                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={converting || !rasterDataUrl}
                      aria-label="Clear uploaded image"
                      className={`group relative rounded-[6px] px-[12px] py-[4px] font-body font-medium text-[12px] overflow-hidden transition-opacity duration-300 ${
                        rasterDataUrl
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
                        Clear
                      </span>
                    </button>

                    {/* Usage Counter */}
                    {usage && (
                      <span className="font-body font-normal text-[12px] md:text-[14px] text-[#475569]">
                        {usage.isUnlimited
                          ? "Unlimited conversions"
                          : `${usage.conversionsUsed} of ${
                              usage.conversionsUsed + usage.remaining
                            } free conversions used`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  id="raster-file-upload"
                  type="file"
                  aria-label="Upload PNG or JPG image file"
                   accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  className="absolute w-0 h-0 opacity-0 overflow-hidden"
                  onChange={(e) => {
                    void handleFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />

                {/* Main Upload / File Display Card */}
                {rasterDataUrl ? (
                  /* State: Image Selected */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`relative w-full h-[220px] md:h-[302px] rounded-[16px] border ${
                      dragOver
                        ? "border-solid border-brand-primary bg-orange-50/40"
                        : "border-[#8F8F8F] bg-white"
                    } flex items-center justify-center p-[20px] overflow-hidden group transition-colors`}
                  >
                    {/* Selected Image */}
                    <img
                      src={rasterDataUrl}
                      alt={imageName || "Selected raster image"}
                      className="relative z-10 max-h-[170px] md:max-h-[230px] max-w-[90%] object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.02]"
                    />

                    {/* Format Pill Badge */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-brand-primary backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[12px] font-heading font-medium tracking-wide">
                      <span>{fileExt}</span>
                      {imageDims && (
                        <span className="text-white/80 text-[12px]">
                          {imageDims.width}×{imageDims.height}
                        </span>
                      )}
                    </div>

                    {/* Replace Overlay Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={converting}
                      className={`absolute top-3 right-3 z-20 group rounded-[6px] px-[12px] py-[4px] font-body font-medium text-[12px] overflow-hidden transition-opacity duration-300 shadow-sm cursor-pointer ${
                        converting ? "opacity-50 cursor-not-allowed pointer-events-none" : "opacity-100"
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
                        Replace Image
                      </span>
                    </button>

                    {/* Drag Replace Feedback */}
                    {dragOver && (
                      <div className="absolute inset-0 z-30 bg-white/90 flex items-center justify-center font-body font-medium text-[15px] text-brand-primary">
                        Drop new file to replace
                      </div>
                    )}
                  </div>
                ) : (
                  /* State: Empty Dropzone */
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
                    aria-label="Drag and drop or select an image file to vectorize"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                    }}
                    className={`w-full h-[220px] md:h-[302px] rounded-[16px] border ${
                      dragOver
                        ? "border-solid border-brand-primary bg-orange-50/30"
                        : "border-dashed md:border-solid border-[#8F8F8F] bg-white"
                    } flex flex-col items-center justify-center gap-[10px] md:gap-[12px] p-[20px] cursor-pointer hover:bg-gray-50/80 focus-visible:border-brand-primary focus-visible:border-solid focus:outline-none active:border-brand-primary transition-colors`}
                  >
                    <Image
                      src={IMAGES.drag}
                      alt="Upload Image"
                      width={72}
                      height={72}
                      className="w-[56px] h-[56px] md:w-[72px] md:h-[72px] object-contain transition-transform duration-300 group-hover:scale-105"
                    />

                    <div className="font-body text-[15px] md:text-[17px] text-text-dark text-center">
                      <span className="font-normal">Drag &amp; Drop or </span>
                      <span className="font-semibold text-brand-primary">Select Image</span>
                    </div>

                     <p className="font-body text-[12px] md:text-[14px] text-[#64748B] text-center">
                       PNG, JPG, or WebP up to 10MB
                     </p>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#64748B] bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                        <kbd className="font-mono text-[10px] bg-white border border-gray-300 px-1 rounded text-[#475569]">
                          Ctrl+V
                        </kbd>{" "}
                        paste clipboard image
                      </span>
                      <span className="text-[#CBD5E1]">&bull;</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleLoadSample();
                        }}
                        className="text-[11px] font-medium text-brand-primary hover:underline cursor-pointer"
                      >
                        Try sample icon
                      </button>
                    </div>
                  </div>
                )}

                {/* Source Metadata or Feature Guide Box */}
                {rasterDataUrl ? (
                  <div className="w-full h-auto min-h-[176px] md:h-[180px] rounded-[16px] border border-[#E2E8F0] bg-[#FAF9F6] p-[14px] md:p-[16px] flex flex-col justify-between mt-[16px] transition-all">
                    {/* Row 1: File Info */}
                    <div className="flex items-center justify-between gap-[10px]">
                      <div className="flex items-center gap-[8px] min-w-0">
                        <div className="w-[28px] h-[28px] rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                          <span className="font-heading font-bold text-[10px] text-brand-primary">
                            {fileExt}
                          </span>
                        </div>
                        <span className="font-body font-semibold text-[13px] md:text-[14px] text-[#202427] truncate">
                          {imageName || "raster-image.png"}
                        </span>
                      </div>
                      <span className="font-body text-[11px] md:text-[12px] text-[#64748B] bg-white border border-gray-200 px-2 py-0.5 rounded-md shrink-0 font-medium font-mono">
                        {formatFileSize(imageSize)}
                      </span>
                    </div>

                    {/* Row 2: 3 Metrics Cards */}
                    <div className="grid grid-cols-3 gap-[8px] text-[12px] md:text-[13px]">
                      <div className="bg-white border border-gray-200/80 rounded-lg p-[6px] md:p-[8px] flex flex-col">
                        <span className="text-[#64748B] text-[10px] md:text-[11px] font-body">Dimensions</span>
                        <strong className="font-medium text-[#202427] text-[12px] md:text-[13px] truncate">
                          {imageDims ? `${imageDims.width}×${imageDims.height}` : "..."}
                        </strong>
                      </div>
                      <div className="bg-white border border-gray-200/80 rounded-lg p-[6px] md:p-[8px] flex flex-col">
                        <span className="text-[#64748B] text-[10px] md:text-[11px] font-body">Aspect Ratio</span>
                        <strong className="font-medium text-[#202427] text-[12px] md:text-[13px] truncate">
                          {imageDims ? (imageDims.width / imageDims.height).toFixed(2) : "—"}
                        </strong>
                      </div>
                      <div className="bg-white border border-gray-200/80 rounded-lg p-[6px] md:p-[8px] flex flex-col">
                        <span className="text-[#64748B] text-[10px] md:text-[11px] font-body">Input Format</span>
                        <strong className="font-medium text-[#202427] text-[12px] md:text-[13px] truncate">
                          {fileExt} Bitmap
                        </strong>
                      </div>
                    </div>

                    {/* Row 3: Status Line */}
                    <div className="flex items-center justify-between text-[11px] md:text-[12px] text-[#64748B] border-t border-gray-200/80 pt-[6px]">
                      <span className="truncate">
                        Quality: <strong className="text-[#202427] font-medium">{rasterQuality}</strong> &bull; Colors: <strong className="text-[#202427] font-medium">{rasterColors}</strong> &bull; BG: <strong className="text-[#202427] font-medium">{rasterBackground}</strong>
                      </span>
                      <span className="text-brand-primary font-medium shrink-0 ml-2">Ready</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-auto min-h-[176px] md:h-[180px] rounded-[16px] border border-[#E2E8F0] bg-[#FAF9F6] p-[14px] md:p-[16px] flex flex-col justify-between mt-[16px] transition-all">
                    <div className="font-heading font-semibold text-[13px] md:text-[14px] text-[#475569] flex items-center justify-between">
                      <span>Dual-Engine Converter</span>
                      <span className="text-[11px] font-normal text-brand-primary bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-full">PNG &amp; JPG to SVG</span>
                    </div>
                    <ul className="text-[12px] md:text-[13px] text-[#64748B] flex flex-col gap-[4px]">
                      <li className="flex items-center gap-2">
                        <span className="text-brand-primary font-bold">✓</span>
                        <span>Vector mode traces clean spline paths for logos, icons &amp; line art</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-brand-primary font-bold">✓</span>
                        <span>Pixel-perfect mode preserves photos &amp; gradients exactly</span>
                      </li>
                       <li className="flex items-center gap-2">
                         <span className="text-brand-primary font-bold">✓</span>
                         <span>Auto-detects the best mode for your image</span>
                       </li>
                      <li className="flex items-center gap-2">
                        <span className="text-brand-primary font-bold">✓</span>
                        <span>100% client-side — your images never leave the browser</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-brand-primary font-bold">✓</span>
                        <span>One-click SVG file download &amp; direct markup copy</span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Privacy Assurance Text */}
                <p className="font-body text-[12px] md:text-[13px] text-[#475569] flex items-center justify-start gap-[6px] mt-[16px]">
                  <Image src={IMAGES.lock} alt="Lock" width={12} height={12} className="object-contain shrink-0" />
                  <span>100% Private &amp; Secure - Your images are processed securely and never stored.</span>
                </p>
              </div>

              {/* ============================================================ */}
              {/* RIGHT COLUMN: Live Preview & Vector Controls                 */}
              {/* ============================================================ */}
              <div className="w-full lg:w-[537px] flex flex-col">
                {/* Column Header with View Mode Tabs */}
                <div className="flex items-center justify-between mb-[12px] h-[36px]">
                  <h2 className="font-heading font-semibold text-[16px] text-[#475569]">
                    {result ? "Vector Output" : "Live Preview"}
                  </h2>

                  {/* Mode Tabs (Vector / Source / Code) */}
                  {result && (
                    <div className="flex items-center gap-[4px] bg-[#F1F5F9] p-[3px] rounded-[8px]">
                      <button
                        type="button"
                        onClick={() => setPreviewMode("vector")}
                        className={`px-[10px] py-[3px] rounded-[6px] font-body text-[12px] font-medium transition-all cursor-pointer ${
                          previewMode === "vector"
                            ? "bg-white text-brand-primary shadow-xs"
                            : "text-[#64748B] hover:text-[#202427]"
                        }`}
                      >
                        Vector SVG
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode("source")}
                        className={`px-[10px] py-[3px] rounded-[6px] font-body text-[12px] font-medium transition-all cursor-pointer ${
                          previewMode === "source"
                            ? "bg-white text-brand-primary shadow-xs"
                            : "text-[#64748B] hover:text-[#202427]"
                        }`}
                      >
                        Source
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode("code")}
                        className={`px-[10px] py-[3px] rounded-[6px] font-body text-[12px] font-medium transition-all cursor-pointer ${
                          previewMode === "code"
                            ? "bg-white text-brand-primary shadow-xs"
                            : "text-[#64748B] hover:text-[#202427]"
                        }`}
                      >
                        SVG Code
                      </button>
                    </div>
                  )}
                </div>

                {/* Main Preview Container */}
                <div
                  className="w-full h-[220px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] flex items-center justify-center relative overflow-hidden bg-white p-[16px] md:p-[24px]"
                >
                  {converting ? (
                    /* Converting Animation State */
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 border-3 border-[#E2E8F0] border-t-brand-primary rounded-full animate-spin" />
                      <span className="font-body font-medium text-[14px] text-text-dark">
                        Vectorizing image paths...
                      </span>
                    </div>
                  ) : previewMode === "code" && result ? (
                    /* SVG Code Viewer State */
                    <div className="w-full h-full flex flex-col bg-white border border-[#EAEAEA] rounded-[8px] p-[16px] shadow-inner overflow-hidden relative">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-2 shrink-0">
                        <span className="text-[12px] font-mono text-[#64748B]">
                          SVG Markup ({formatFileSize(result.size)})
                        </span>
                        <button
                          type="button"
                          onClick={handleCopySvg}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium bg-gray-100 hover:bg-brand-primary text-[#353A3E] hover:text-white rounded-md transition-colors cursor-pointer"
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          {copiedCode ? "Copied!" : "Copy Code"}
                        </button>
                      </div>
                      <pre className="flex-1 overflow-auto font-mono text-[12px] md:text-[13px] leading-[1.5] text-[#4B5563] brand-scrollbar whitespace-pre-wrap select-all">
                        {result.svg}
                      </pre>
                    </div>
                  ) : previewMode === "source" && rasterDataUrl ? (
                    /* Source Comparison View State */
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <img
                        src={rasterDataUrl}
                        alt="Original source image"
                        className="max-w-full max-h-full object-contain drop-shadow-md"
                      />
                      <span className="absolute bottom-2 right-2 bg-brand-primary text-white text-[12px] font-heading px-2 py-0.5 rounded shadow-xs">
                        Original Raster
                      </span>
                    </div>
                  ) : result && previewSvgUrl ? (
                    /* Converted Vector SVG State */
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <img
                        src={previewSvgUrl}
                        alt="Vectorized SVG output"
                        className="max-w-full max-h-full object-contain drop-shadow-md"
                      />
                      <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                        {result.modeUsed && (
                          <span className={`text-[11px] font-heading font-medium px-2 py-0.5 rounded shadow-xs ${
                            result.modeUsed === "vector"
                              ? "bg-emerald-600 text-white"
                              : "bg-blue-600 text-white"
                          }`}>
                            {result.modeUsed === "vector" ? "Vector" : "Pixel-Perfect"}
                          </span>
                        )}
                        <span className="bg-brand-primary text-white text-[12px] font-heading font-semibold px-2 py-0.5 rounded shadow-xs">
                          Scalable SVG
                        </span>
                      </div>
                    </div>
                  ) : rasterDataUrl ? (
                    /* Image Uploaded, Ready to Convert State */
                    <div className="relative w-full h-full flex flex-col items-center justify-center opacity-85">
                      <img
                        src={rasterDataUrl}
                        alt="Uploaded preview"
                        className="max-w-full max-h-full object-contain filter grayscale-[30%]"
                      />
                      <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                        <span className="bg-white/90 backdrop-blur-xs border border-gray-200 text-text-dark font-body font-medium text-[13px] px-3 py-1.5 rounded-full shadow-sm">
                          Click &ldquo;Vectorize Image&rdquo; below
                        </span>
                      </div>
                    </div>
                  ) : storageRestored ? (
                    /* Empty Placeholder State */
                    <div className="flex flex-col items-center justify-center gap-2">
                      <img
                        src={IMAGES.uploadImage}
                        alt="Upload placeholder"
                        className="w-[64px] h-[64px] object-contain"
                      />
                      <p className="font-body text-[13px] text-[#94A3B8]">
                        Vector preview will appear here
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* ========================================================== */}
                {/* Vector Settings (2x2 Grid)                                */}
                {/* ========================================================== */}
                <div
                  className={`w-full h-auto min-h-[176px] md:h-[180px] mt-[16px] transition-all duration-300 flex flex-col justify-between ${
                    converting ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] md:gap-[16px] w-full h-full">
                    {/* Quality Dropdown */}
                    <VectorDropdown
                      label="Quality"
                      value={rasterQuality}
                      options={QUALITY_OPTIONS}
                      onChange={(val) => {
                        setRasterQuality(val);
                        setOpenDropdown(null);
                        setResult(null);
                      }}
                      isOpen={openDropdown === "quality"}
                      onToggle={() => setOpenDropdown(openDropdown === "quality" ? null : "quality")}
                      dropdownRef={qualityRef}
                      disabled={converting}
                    />

                    {/* Colors Dropdown */}
                    <VectorDropdown
                      label="Color Palette"
                      value={rasterColors}
                      options={COLOR_OPTIONS}
                      onChange={(val) => {
                        setRasterColors(val);
                        setOpenDropdown(null);
                        setResult(null);
                      }}
                      isOpen={openDropdown === "colors"}
                      onToggle={() => setOpenDropdown(openDropdown === "colors" ? null : "colors")}
                      dropdownRef={colorsRef}
                      disabled={converting}
                    />

                    {/* Background Dropdown */}
                    <VectorDropdown
                      label="Background"
                      value={rasterBackground}
                      options={BACKGROUND_OPTIONS}
                      onChange={(val) => {
                        setRasterBackground(val);
                        setOpenDropdown(null);
                        setResult(null);
                      }}
                      isOpen={openDropdown === "background"}
                      onToggle={() => setOpenDropdown(openDropdown === "background" ? null : "background")}
                      dropdownRef={backgroundRef}
                      disabled={converting}
                      customColor={rasterBgColor}
                      onCustomColorChange={setRasterBgColor}
                    />

                    {/* Tracing Mode Dropdown */}
                    <VectorDropdown
                      label="Tracing Mode"
                      value={rasterMode}
                      options={MODE_OPTIONS}
                      onChange={(val) => {
                        setRasterMode(val);
                        setOpenDropdown(null);
                        setResult(null);
                      }}
                      isOpen={openDropdown === "mode"}
                      onToggle={() => setOpenDropdown(openDropdown === "mode" ? null : "mode")}
                      dropdownRef={modeRef}
                      disabled={converting}
                    />
                  </div>

                </div>

                {/* Error Banner */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-[8px] border border-red-200 bg-red-50 px-[14px] py-[10px] mt-[12px] font-body text-[14px] leading-[18px] text-red-700"
                  >
                    {error}
                  </div>
                )}

                {/* Advisory Banner (e.g. photo limitations) */}
                {result && result.advisory && (
                  <div
                    role="note"
                    className="rounded-[8px] border border-amber-200 bg-amber-50 px-[14px] py-[10px] mt-[12px] font-body text-[14px] leading-[18px] text-amber-800"
                  >
                    {result.advisory}
                  </div>
                )}

                {/* Action CTA Buttons Row */}
                {converting ? (
                  <div className="w-full h-[48px] mt-[16px] flex flex-col items-center justify-center gap-[6px]">
                    <div className="w-full sm:w-[280px] lg:w-[340px] h-[6px] bg-[#E2E8F0] rounded-full overflow-hidden relative">
                      <div
                        className={`absolute top-0 left-0 h-full bg-[#D94A1E] transition-all ease-out ${
                          progress === 0 ? "duration-0" : "duration-[15000ms]"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="font-body text-[12px] text-[#64748B]">
                      Tracing vector paths...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-[8px] mt-[16px] relative">
                    {limitReached && status !== "authed" && (limitDownloadDone || !isSvgResult) ? (
                      <button
                        type="button"
                        onClick={() => setShowSignupPrompt(true)}
                        className="w-[300px] h-[44px] md:h-[48px] px-[16px] md:px-[24px] rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-body font-medium text-[14px] md:text-[16px] flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                      >
                        Sign up for unlimited conversions
                      </button>
                    ) : isSvgResult ? (
                      <>
                        <Button
                          className="w-[300px] h-[44px] md:h-[48px] px-[12px] md:px-[32px] rounded-[12px] gap-[8px] shadow-sm"
                          onClick={handleDownload}
                          disabled={converting}
                        >
                          <span className="flex items-center justify-center gap-[8px] text-[15px] md:text-[16px] w-full">
                            Download SVG
                            <Image
                              src={IMAGES.exportIcon}
                              alt=""
                              width={18}
                              height={18}
                              className="brightness-0 invert"
                            />
                          </span>
                        </Button>

                        {/* Secondary Actions */}
                        <div className="flex items-center gap-[16px] mt-[2px]">
                          <button
                            type="button"
                            onClick={handleCopySvg}
                            className="font-body text-[13px] font-medium text-[#475569] hover:text-brand-primary transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            {copiedCode ? "Copied!" : "Copy SVG Code"}
                          </button>
                          <span className="text-[#CBD5E1]">&bull;</span>
                          <button
                            type="button"
                            onClick={handleConvert}
                            disabled={converting}
                            className="font-body text-[13px] font-medium text-[#475569] hover:text-[#202427] transition-colors cursor-pointer"
                          >
                            Re-vectorize
                          </button>
                        </div>
                      </>
                    ) : (
                      <Button
                        className="w-[300px] h-[44px] md:h-[48px] px-[12px] md:px-[32px] rounded-[12px] gap-[8px] shadow-sm"
                        onClick={handleConvert}
                        disabled={converting || !rasterDataUrl}
                      >
                        <span className="flex items-center justify-center gap-[8px] text-[15px] md:text-[16px] w-full">
                          Vectorize Image
                          <Image
                            src={IMAGES.exportIcon}
                            alt=""
                            width={18}
                            height={18}
                            className="brightness-0 invert"
                          />
                        </span>
                      </Button>
                    )}

                    {/* Result Details */}
                    {result && result.size > 0 && (
                      <p className="text-center font-body font-normal text-[12px] md:text-[14px] text-[#64748B] whitespace-nowrap mt-1">
                        {result.modeUsed === "vector" ? "Vector Paths" : "Pixel-Perfect"}
                        {result.qualityUsed ? ` · ${result.qualityUsed.charAt(0).toUpperCase()}${result.qualityUsed.slice(1)}` : ""}
                        {" · "}{formatFileSize(result.size)} · Infinitely Scalable
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signup Modal when Guest Quota is reached */}
      {showSignupPrompt && status !== "authed" && (
        <SignupPromptModal onClose={() => setShowSignupPrompt(false)} />
      )}
    </>
  );
}
