"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/Button";
import { useAuth, type AuthStatus } from "@/lib/client/auth-context";
import { getAccessToken } from "@/lib/client/http";
import { getUsage } from "@/lib/client/sessions";
import type { UsageInfo } from "@/lib/shared/shared-types";
import { showToast } from "@/lib/client/toast-bridge";
import { IMAGES } from "@/lib/shared/images";

const STORAGE_KEY = "crush_image_resizer_state";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type OutputFormat = "png" | "jpg" | "webp";

interface DropdownOption {
  value: string;
  label: string;
  desc: string;
}

const SCALE_OPTIONS: DropdownOption[] = [
  { value: "25", label: "25%", desc: "Quarter size" },
  { value: "50", label: "50%", desc: "Half size" },
  { value: "75", label: "75%", desc: "Three-quarter size" },
  { value: "100", label: "100%", desc: "Original size" },
  { value: "150", label: "150%", desc: "One and a half" },
  { value: "200", label: "200%", desc: "Double size" },
];

const FORMAT_OPTIONS: DropdownOption[] = [
  { value: "png", label: "PNG", desc: "Lossless, supports transparency" },
  { value: "jpg", label: "JPG", desc: "Lossy, smaller file size" },
  { value: "webp", label: "WebP", desc: "Modern, best compression" },
];

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function simplifyAspect(w: number, h: number): string {
  if (!w || !h) return "";
  const d = gcd(w, h);
  const rw = w / d;
  const rh = h / d;
  if (rw === 1 && rh === 1) return "1:1";
  if (rw > 100 || rh > 100) return `${w}:${h}`;
  return `${rw}:${rh}`;
}

function getMimeType(fmt: OutputFormat): string {
  if (fmt === "jpg") return "image/jpeg";
  if (fmt === "webp") return "image/webp";
  return "image/png";
}

function getExt(fmt: OutputFormat): string {
  if (fmt === "jpg") return "jpg";
  return fmt;
}

// ── Dropdown Component ────────────────────────────────────────────────────────

interface DropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (val: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  disabled?: boolean;
}

function Dropdown({
  label,
  value,
  options,
  onChange,
  isOpen,
  onToggle,
  dropdownRef,
  disabled,
}: DropdownProps) {
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
        <span className="font-body font-medium text-[13px] md:text-[15px] text-[#353A3E] truncate">
          {selected.label}
        </span>
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
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-[#8F8F8F] rounded-[12px] shadow-xl z-40 overflow-hidden max-h-[240px] flex flex-col">
          <div role="listbox" className="w-full overflow-y-auto py-[4px] brand-scrollbar">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onChange(opt.value)}
                  className={`px-[12px] py-[6px] md:py-[7px] flex items-center justify-between gap-[8px] cursor-pointer transition-colors ${
                    isSelected ? "bg-[#FFF1EC] text-[#D94A1E]" : "hover:bg-[#FFF7F4] text-[#353A3E]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-body font-semibold text-[12px] md:text-[13px] truncate">
                      {opt.label}
                    </div>
                    <div className="font-body text-[10px] md:text-[11px] text-[#64748B] truncate leading-[1.3] mt-[1px]">
                      {opt.desc}
                    </div>
                  </div>
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Number Input with controls ────────────────────────────────────────────────

interface DimensionInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  suffix?: string;
}

function DimensionInput({ label, value, onChange, disabled, suffix = "px" }: DimensionInputProps) {
  return (
    <div className="flex flex-col flex-1 gap-[6px]">
      <label className="text-[#475569] font-heading font-semibold text-[13px] md:text-[15px] leading-[18px]">
        {label}
      </label>
      <div
        className={`relative w-full h-[46px] md:h-[52px] rounded-[12px] border border-[#8F8F8F] flex items-center bg-white transition-colors focus-within:border-[#D94A1E] ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || /^\d*$/.test(v)) onChange(v);
          }}
          disabled={disabled}
          aria-label={`${label} in pixels`}
          className="flex-1 h-full bg-transparent px-[12px] font-body font-medium text-[13px] md:text-[15px] text-[#353A3E] outline-none min-w-0"
        />
        <span className="pr-[12px] font-body text-[12px] text-[#64748B] shrink-0">{suffix}</span>
      </div>
    </div>
  );
}

// ── Aspect Ratio Lock Toggle ──────────────────────────────────────────────────

interface AspectLockProps {
  locked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function AspectLock({ locked, onToggle, disabled }: AspectLockProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={locked ? "Unlock aspect ratio" : "Lock aspect ratio"}
      title={locked ? "Aspect ratio locked" : "Aspect ratio unlocked"}
      className={`self-center mt-[18px] w-[36px] h-[36px] rounded-[8px] flex items-center justify-center shrink-0 transition-colors ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"
      } ${locked ? "text-brand-primary" : "text-[#94A3B8]"}`}
    >
      {locked ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 019.9-1" />
        </svg>
      )}
    </button>
  );
}

// ── Main ImageResizer Component ───────────────────────────────────────────────

export function ImageResizer() {
  const { status, sessionVersion } = useAuth();

  // Settings
  const [scale, setScale] = useState("100");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(90);
  const [lockAspect, setLockAspect] = useState(true);

  // File & State
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<number | null>(null);
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);

  // Resize dimensions
  const [targetWidth, setTargetWidth] = useState("");
  const [targetHeight, setTargetHeight] = useState("");
  const aspectRatioRef = useRef(1);

  // Processing result
  const [resizing, setResizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    dataUrl: string;
    format: OutputFormat;
    width: number;
    height: number;
  } | null>(null);

  // Preview & Dropdowns
  const [previewMode, setPreviewMode] = useState<"before" | "after">("before");
  const [dragOver, setDragOver] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"scale" | "format" | null>(null);

  // Auth & Quota
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const formatRef = useRef<HTMLDivElement>(null);
  const storageRestoredRef = useRef(false);
  const prevStatusRef = useRef<AuthStatus | null>(null);

  // ── Wipe data on sign-out ──────────────────────────────────────────────────
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (prev === "authed" && status !== "authed") {
      resetAll();
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, [status]);

  // ── Click outside dropdowns ────────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.tagName?.toLowerCase() === "label") {
        setOpenDropdown(null);
        return;
      }
      if (openDropdown === "scale" && scaleRef.current && !scaleRef.current.contains(target)) {
        setOpenDropdown(null);
      }
      if (openDropdown === "format" && formatRef.current && !formatRef.current.contains(target)) {
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

  // ── Usage polling ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "loading") return;
    if (status === "authed" && !getAccessToken()) return;
    let cancelled = false;
    getUsage()
      .then((u) => {
        if (!cancelled) setUsage(u);
      })
      .catch(() => {
        if (!cancelled) setUsage(null);
      });
    return () => {
      cancelled = true;
    };
  }, [status, sessionVersion]);

  // ── Smooth progress bar during resizing ────────────────────────────────────
  useEffect(() => {
    if (resizing) {
      const timer = setTimeout(() => setProgress(90), 50);
      return () => clearTimeout(timer);
    }
    queueMicrotask(() => setProgress(0));
  }, [resizing]);

  // ── Restore state from sessionStorage ──────────────────────────────────────
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (typeof saved.dataUrl === "string") setDataUrl(saved.dataUrl);
          if (typeof saved.imageName === "string") setImageName(saved.imageName);
          if (typeof saved.imageSize === "number") setImageSize(saved.imageSize);
          if (saved.imageDims && typeof saved.imageDims.width === "number") {
            setImageDims(saved.imageDims);
          }
          if (typeof saved.scale === "string") setScale(saved.scale);
          if (typeof saved.outputFormat === "string") setOutputFormat(saved.outputFormat);
          if (typeof saved.quality === "number") setQuality(saved.quality);
        }
      } catch {}
      finally {
        storageRestoredRef.current = true;
      }
    });
  }, []);

  // ── Save state to sessionStorage ───────────────────────────────────────────
  useEffect(() => {
    if (!storageRestoredRef.current) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          dataUrl: null,
          imageName,
          imageSize,
          imageDims,
          scale,
          outputFormat,
          quality,
        })
      );
    } catch {}
  }, [imageName, imageSize, imageDims, scale, outputFormat, quality]);

  // ── Global clipboard paste ─────────────────────────────────────────────────
  useEffect(() => {
    function handleGlobalPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.clipboardData && e.clipboardData.items) {
        const items = Array.from(e.clipboardData.items);
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const f = item.getAsFile();
            if (f) {
              e.preventDefault();
              handleFile(f);
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

  // ── File handling ──────────────────────────────────────────────────────────
  function handleFile(f: File | undefined | null) {
    if (!f) return;
    setError(null);

    const isPng = f.type === "image/png" || f.name.toLowerCase().endsWith(".png");
    const isJpg =
      f.type === "image/jpeg" ||
      f.name.toLowerCase().endsWith(".jpg") ||
      f.name.toLowerCase().endsWith(".jpeg");
    const isWebp = f.type === "image/webp" || f.name.toLowerCase().endsWith(".webp");

    if (!isPng && !isJpg && !isWebp) {
      setError("Please choose a valid PNG, JPG, or WebP image file.");
      showToast("error", "Unsupported file type. Please upload PNG, JPG, or WebP.");
      return;
    }

    if (f.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
      setError(`Image too large (${sizeMB}MB). Maximum allowed size is 10MB.`);
      showToast("error", "Image exceeds 10MB limit.");
      return;
    }

    setImageName(f.name);
    setImageSize(f.size);
    setResult(null);
    setPreviewMode("before");

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setDataUrl(url);

      const img = new window.Image();
      img.onload = () => {
        const dims = { width: img.naturalWidth, height: img.naturalHeight };
        setImageDims(dims);
        aspectRatioRef.current = dims.width / dims.height;
        setTargetWidth(String(dims.width));
        setTargetHeight(String(dims.height));
      };
      img.src = url;
    };
    reader.readAsDataURL(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  // ── Width/Height change with aspect ratio lock ─────────────────────────────
  function handleWidthChange(val: string) {
    setTargetWidth(val);
    setResult(null);
    if (lockAspect && val !== "") {
      const w = parseInt(val, 10);
      if (!isNaN(w) && w > 0) {
        setTargetHeight(String(Math.round(w / aspectRatioRef.current)));
      }
    } else if (val === "") {
      setTargetHeight("");
    }
  }

  function handleHeightChange(val: string) {
    setTargetHeight(val);
    setResult(null);
    if (lockAspect && val !== "") {
      const h = parseInt(val, 10);
      if (!isNaN(h) && h > 0) {
        setTargetWidth(String(Math.round(h * aspectRatioRef.current)));
      }
    } else if (val === "") {
      setTargetWidth("");
    }
  }

  function handleScaleChange(val: string) {
    setScale(val);
    setResult(null);
    if (val !== "Custom" && imageDims) {
      const pct = parseInt(val, 10) / 100;
      setTargetWidth(String(Math.round(imageDims.width * pct)));
      setTargetHeight(String(Math.round(imageDims.height * pct)));
    }
  }

  function resetAll() {
    setDataUrl(null);
    setImageName(null);
    setImageSize(null);
    setImageDims(null);
    setResult(null);
    setError(null);
    setPreviewMode("before");
    setScale("100");
    setOutputFormat("png");
    setQuality(90);
    setLockAspect(true);
    setTargetWidth("");
    setTargetHeight("");
    setResizing(false);
  }

  function handleClear() {
    resetAll();
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    showToast("success", "Cleared image and settings");
  }

  // ── Client-side resize using Canvas ────────────────────────────────────────
  async function handleResize() {
    if (!dataUrl) {
      showToast("error", "No image selected. Upload an image to get started.");
      return;
    }

    const w = parseInt(targetWidth, 10);
    const h = parseInt(targetHeight, 10);

    if (!w || !h || w < 1 || h < 1) {
      setError("Please enter valid width and height values.");
      showToast("error", "Invalid dimensions.");
      return;
    }

    if (w > 10000 || h > 10000) {
      setError("Maximum dimension is 10,000 pixels.");
      showToast("error", "Dimensions exceed 10,000px limit.");
      return;
    }

    setError(null);
    setResizing(true);

    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image for resizing."));
        img.src = dataUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context.");

      if (outputFormat === "jpg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, w, h);
      }

      ctx.drawImage(img, 0, 0, w, h);

      const mimeType = getMimeType(outputFormat);
      const q = outputFormat === "png" ? undefined : quality / 100;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Canvas to blob failed."));
          },
          mimeType,
          q
        );
      });

      const blobUrl = URL.createObjectURL(blob);

      setResult({
        blob,
        dataUrl: blobUrl,
        format: outputFormat,
        width: w,
        height: h,
      });
      setPreviewMode("after");
      showToast("success", "Image resized! Ready to download.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Resize failed. Please try again.";
      setError(msg);
      showToast("error", msg);
    } finally {
      setResizing(false);
    }
  }

  // ── Download ───────────────────────────────────────────────────────────────
  function handleDownload() {
    if (!result?.blob) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = imageName ? imageName.replace(/\.[^.]+$/, "") : "image";
    a.download = `crushsvg-${baseName}-${result.width}x${result.height}.${getExt(result.format)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showToast("success", "Your download has started");
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const hasResult = !!result?.blob;
  const hasImage = !!dataUrl;
  const fileExt = imageName ? imageName.split(".").pop()?.toUpperCase() : "IMAGE";
  const previewUrl = hasResult && result ? result.dataUrl : dataUrl;

  return (
    <section
      id="converter"
      className="w-full max-w-[362px] md:max-w-[720px] lg:max-w-[1280px] mx-auto mt-[30px] md:mt-[48px] mb-[60px] md:mb-[100px] scroll-mt-[70px] md:scroll-mt-[96px]"
    >
      {/* Outer Dashed Border Box */}
      <div className="w-full h-auto border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[32px] p-0 md:p-[12px] transition-all duration-300">
        {/* Inner Dashed Border Box */}
        <div className="w-full h-auto bg-transparent md:bg-[#FFFFFF] border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[24px] flex flex-col px-0 md:px-[40px] py-[20px] md:py-[32px] transition-all duration-300">
          {/* Two-Column Grid */}
          <div className="flex flex-col lg:flex-row items-stretch justify-center w-full gap-[24px] md:gap-[30px]">
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
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={resizing || !hasImage}
                    aria-label="Clear uploaded image"
                    className={`group relative rounded-[6px] px-[12px] py-[4px] font-body font-medium text-[12px] overflow-hidden transition-opacity duration-300 ${
                      hasImage
                        ? resizing
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
                id="image-resizer-file-upload"
                type="file"
                aria-label="Upload image file for resizing"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                className="absolute w-0 h-0 opacity-0 overflow-hidden"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />

              {/* Main Upload / File Display Card */}
              {hasImage ? (
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
                  <img
                    src={dataUrl!}
                    alt={imageName || "Selected image"}
                    className="relative z-10 max-h-[170px] md:max-h-[230px] max-w-[90%] object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-brand-primary backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[12px] font-heading font-medium tracking-wide">
                    <span>{fileExt}</span>
                    {imageDims && (
                      <span className="text-white/80 text-[12px]">
                        {imageDims.width}×{imageDims.height}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={resizing}
                    className={`absolute top-3 right-3 z-20 group rounded-[6px] px-[12px] py-[4px] font-body font-medium text-[12px] overflow-hidden transition-opacity duration-300 shadow-sm cursor-pointer ${
                      resizing ? "opacity-50 cursor-not-allowed pointer-events-none" : "opacity-100"
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
                  {dragOver && (
                    <div className="absolute inset-0 z-30 bg-white/90 flex items-center justify-center font-body font-medium text-[15px] text-brand-primary">
                      Drop new file to replace
                    </div>
                  )}
                </div>
              ) : (
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
                  aria-label="Drag and drop or select an image file for resizing"
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
                    style={{ width: "auto", height: "auto" }}
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
                  </div>
                </div>
              )}

              {/* Source Metadata or Feature Guide Box */}
              {hasImage ? (
                <div className="w-full rounded-[16px] border border-[#E2E8F0] bg-[#FAF9F6] p-[12px] md:p-[14px] flex flex-col justify-between mt-[12px] transition-all">
                  <div className="flex items-center justify-between gap-[10px]">
                    <div className="flex items-center gap-[8px] min-w-0">
                      <div className="w-[24px] h-[24px] rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0">
                        <span className="font-heading font-bold text-[9px] text-brand-primary">
                          {fileExt}
                        </span>
                      </div>
                      <span className="font-body font-semibold text-[12px] md:text-[13px] text-[#202427] truncate">
                        {imageName || "image.png"}
                      </span>
                    </div>
                    <span className="font-body text-[10px] md:text-[11px] text-[#64748B] font-mono shrink-0">
                      {formatFileSize(imageSize)}
                    </span>
                  </div>
                  <div className="flex items-stretch gap-[6px]">
                    <div className="flex-1 bg-white border border-gray-200/80 rounded-md px-[6px] py-[3px] md:py-[4px] flex flex-col min-w-0">
                      <span className="text-[#64748B] text-[9px] md:text-[10px] font-body leading-[1.2]">Dimensions</span>
                      <strong className="font-medium text-[#202427] text-[11px] md:text-[12px] truncate leading-[1.2]">
                        {imageDims ? `${imageDims.width}×${imageDims.height}` : "—"}
                      </strong>
                    </div>
                    <div className="flex-1 bg-white border border-gray-200/80 rounded-md px-[6px] py-[3px] md:py-[4px] flex flex-col min-w-0">
                      <span className="text-[#64748B] text-[9px] md:text-[10px] font-body leading-[1.2]">Aspect</span>
                      <strong className="font-medium text-[#202427] text-[11px] md:text-[12px] truncate leading-[1.2]">
                        {imageDims ? simplifyAspect(imageDims.width, imageDims.height) : "—"}
                      </strong>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] md:text-[11px] text-[#64748B] border-t border-gray-200/80 pt-[4px]">
                    <span className="truncate">
                      {outputFormat.toUpperCase()} &middot; {scale}%
                    </span>
                    <span className="text-brand-primary font-medium shrink-0 ml-2">Ready</span>
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-[16px] border border-[#E2E8F0] bg-[#FAF9F6] p-[12px] md:p-[14px] flex flex-col mt-[12px] transition-all">
                  <div className="font-heading font-semibold text-[12px] md:text-[13px] text-[#475569] flex items-center justify-between mb-[6px]">
                    <span>Client-Side Image Resizing</span>
                    <span className="text-[10px] font-normal text-brand-primary bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-full">
                      PNG &amp; JPG &amp; WebP
                    </span>
                  </div>
                  <ul className="text-[11px] md:text-[12px] text-[#64748B] flex flex-col gap-[4px]">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold leading-[1.2]">✓</span>
                      <span className="leading-[1.3]">Resize by exact pixels or scale percentage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold leading-[1.2]">✓</span>
                      <span className="leading-[1.3]">Aspect ratio lock prevents distortion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold leading-[1.2]">✓</span>
                      <span className="leading-[1.3]">Export as PNG, JPG, or WebP with quality control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold leading-[1.2]">✓</span>
                      <span className="leading-[1.3]">100% private — images stay in your browser</span>
                    </li>
                  </ul>
                </div>
              )}

              {/* Privacy Assurance Text */}
              <p className="font-body text-[12px] md:text-[13px] text-[#475569] flex items-center justify-start gap-[6px] mt-[16px]">
                <Image
                  src={IMAGES.lock}
                  alt="Lock"
                  width={12}
                  height={12}
                  style={{ width: "auto", height: "auto" }}
                  className="shrink-0"
                />
                <span>100% Private &amp; Secure - Your images are processed securely and never stored.</span>
              </p>
            </div>

            {/* ============================================================ */}
            {/* RIGHT COLUMN: Live Preview & Controls                       */}
            {/* ============================================================ */}
            <div className="w-full lg:w-[537px] flex flex-col justify-between">
              <div className="flex flex-col">
                {/* Column Header with View Mode Tabs */}
                <div className="flex items-center justify-between mb-[12px] h-[36px]">
                  <h2 className="font-heading font-semibold text-[16px] text-[#475569]">
                    {hasResult ? "Result" : "Live Preview"}
                  </h2>

                  {hasResult && (
                    <div className="flex items-center gap-[4px] bg-[#F1F5F9] p-[3px] rounded-[8px]">
                      <button
                        type="button"
                        onClick={() => setPreviewMode("before")}
                        className={`px-[10px] py-[3px] rounded-[6px] font-body text-[12px] font-medium transition-all cursor-pointer ${
                          previewMode === "before"
                            ? "bg-white text-brand-primary shadow-xs"
                            : "text-[#64748B] hover:text-[#202427]"
                        }`}
                      >
                        Original
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode("after")}
                        className={`px-[10px] py-[3px] rounded-[6px] font-body text-[12px] font-medium transition-all cursor-pointer ${
                          previewMode === "after"
                            ? "bg-white text-brand-primary shadow-xs"
                            : "text-[#64748B] hover:text-[#202427]"
                        }`}
                      >
                        Resized
                      </button>
                    </div>
                  )}
                </div>

                {/* Main Preview Container */}
                <div className="w-full h-[220px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] flex items-center justify-center relative overflow-hidden bg-white p-[16px] md:p-[24px]">
                  {resizing ? (
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 border-3 border-[#E2E8F0] border-t-brand-primary rounded-full animate-spin" />
                      <span className="font-body font-medium text-[14px] text-text-dark">
                        Resizing image...
                      </span>
                    </div>
                  ) : hasResult && previewUrl ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <img
                        src={previewUrl}
                        alt="Resized image result"
                        className="max-w-full max-h-full object-contain drop-shadow-md"
                      />
                      <span className="absolute bottom-2 right-2 bg-brand-primary text-white text-[12px] font-heading px-2 py-0.5 rounded shadow-xs">
                        {result!.width}×{result!.height}
                      </span>
                    </div>
                  ) : hasImage ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center opacity-85">
                      <img
                        src={dataUrl!}
                        alt="Uploaded preview"
                        className="max-w-full max-h-full object-contain filter grayscale-[30%]"
                      />
                      <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                        <span className="bg-white/90 backdrop-blur-xs border border-gray-200 text-text-dark font-body font-medium text-[13px] px-3 py-1.5 rounded-full shadow-sm">
                          Click &ldquo;Resize Image&rdquo; below
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <img
                        src={IMAGES.uploadImage}
                        alt="Upload placeholder"
                        className="w-[64px] h-[64px] object-contain"
                      />
                      <p className="font-body text-[13px] text-[#94A3B8]">
                        Preview will appear here
                      </p>
                    </div>
                  )}
                </div>

                {/* ========================================================== */}
                {/* Resize Settings                                           */}
                {/* ========================================================== */}
                <div
                  className={`w-full mt-[16px] md:mt-[20px] transition-all duration-300 ${
                    resizing ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] md:gap-[16px] w-full">
                    {/* Dimension Inputs Row */}
                    <div className="flex items-stretch gap-[8px] sm:col-span-2">
                      <DimensionInput
                        label="Width"
                        value={targetWidth}
                        onChange={handleWidthChange}
                        disabled={resizing}
                      />
                      <AspectLock
                        locked={lockAspect}
                        onToggle={() => setLockAspect(!lockAspect)}
                        disabled={resizing}
                      />
                      <DimensionInput
                        label="Height"
                        value={targetHeight}
                        onChange={handleHeightChange}
                        disabled={resizing}
                      />
                    </div>

                    {/* Scale Dropdown */}
                    <Dropdown
                      label="Scale"
                      value={scale}
                      options={SCALE_OPTIONS}
                      onChange={(val) => {
                        handleScaleChange(val);
                        setOpenDropdown(null);
                      }}
                      isOpen={openDropdown === "scale"}
                      onToggle={() => setOpenDropdown(openDropdown === "scale" ? null : "scale")}
                      dropdownRef={scaleRef}
                      disabled={resizing}
                    />

                    {/* Format Dropdown */}
                    <Dropdown
                      label="Output Format"
                      value={outputFormat}
                      options={FORMAT_OPTIONS}
                      onChange={(val) => {
                        setOutputFormat(val as OutputFormat);
                        setResult(null);
                        setOpenDropdown(null);
                      }}
                      isOpen={openDropdown === "format"}
                      onToggle={() => setOpenDropdown(openDropdown === "format" ? null : "format")}
                      dropdownRef={formatRef}
                      disabled={resizing}
                    />
                  </div>

                  {/* Quality Slider (for JPG/WebP) */}
                  {outputFormat !== "png" && (
                    <div className="mt-[12px] md:mt-[16px] w-full">
                      <div className="flex items-center justify-between mb-[6px]">
                        <label className="text-[#475569] font-heading font-semibold text-[13px] md:text-[15px] leading-[18px]">
                          Quality
                        </label>
                        <span className="font-body text-[12px] text-[#64748B]">{quality}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={1}
                        value={quality}
                        onChange={(e) => {
                          setQuality(Number(e.target.value));
                          setResult(null);
                        }}
                        disabled={resizing}
                        aria-label="Output quality percentage"
                        className="w-full h-[6px] rounded-full appearance-none cursor-pointer accent-brand-primary bg-[#E2E8F0]"
                      />
                      <div className="flex justify-between text-[10px] text-[#94A3B8] mt-[2px]">
                        <span>Smaller file</span>
                        <span>Higher quality</span>
                      </div>
                    </div>
                  )}
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
              </div>

              {/* Action CTA Buttons Row */}
              {resizing ? (
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
                    Resizing image to {targetWidth}×{targetHeight}...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-[8px] mt-[16px] md:mt-[20px]">
                  {hasResult ? (
                    <>
                      <Button
                        className="w-[300px] h-[44px] md:h-[48px] px-[12px] md:px-[32px] rounded-[12px] gap-[8px] shadow-sm"
                        onClick={handleDownload}
                        disabled={resizing}
                      >
                        <span className="flex items-center justify-center gap-[8px] text-[15px] md:text-[16px] w-full">
                          Download {result!.format.toUpperCase()}
                          <Image
                            src={IMAGES.exportIcon}
                            alt=""
                            width={18}
                            height={18}
                            className="brightness-0 invert"
                          />
                        </span>
                      </Button>

                      <div className="flex items-center gap-[16px] mt-[2px]">
                        <button
                          type="button"
                          onClick={() => {
                            setResult(null);
                            setPreviewMode("before");
                          }}
                          className="font-body text-[13px] font-medium text-[#475569] hover:text-brand-primary transition-colors cursor-pointer"
                        >
                          New Image
                        </button>
                      </div>
                    </>
                  ) : (
                    <Button
                      className="w-[300px] h-[44px] md:h-[48px] px-[12px] md:px-[32px] rounded-[12px] gap-[8px] shadow-sm"
                      onClick={handleResize}
                      disabled={resizing || !hasImage}
                    >
                      <span className="flex items-center justify-center gap-[8px] text-[15px] md:text-[16px] w-full">
                        Resize Image
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
                  {result && (
                    <p className="text-center font-body font-normal text-[12px] md:text-[14px] text-[#64748B] whitespace-nowrap mt-1">
                      {result.format.toUpperCase()} &middot; {result.width}×{result.height} px
                      {result.blob.size > 0 ? ` · ${formatFileSize(result.blob.size)}` : ""}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
