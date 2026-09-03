"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/Button";
import { SignupPromptModal } from "@/components/modals/SignupPromptModal";
import { useAuth, type AuthStatus } from "@/lib/client/auth-context";
import { getAccessToken } from "@/lib/client/http";
import { getUsage } from "@/lib/client/sessions";
import type { UsageInfo } from "@/lib/shared/shared-types";
import { showToast } from "@/lib/client/toast-bridge";
import { trackConversion } from "@/lib/client/analytics";
import { IMAGES } from "@/lib/shared/images";

const STORAGE_KEY = "crush_bg_remover_state";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_PERSISTED_RESULT_CHARS = 1_500_000;

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
  { value: "125", label: "125%", desc: "Quarter larger" },
  { value: "150", label: "150%", desc: "One and a half" },
  { value: "200", label: "200%", desc: "Double size" },
];

const BG_OPTIONS: DropdownOption[] = [
  { value: "Transparent", label: "Transparent", desc: "Remove background, alpha PNG" },
  { value: "White", label: "White", desc: "Solid white background" },
  { value: "Black", label: "Black", desc: "Solid black background" },
  { value: "Custom", label: "Custom Color", desc: "Fill with chosen background color" },
];

const COLOR_PRESETS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
  { name: "Slate", hex: "#1E293B" },
  { name: "Orange", hex: "#D94A1E" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Emerald", hex: "#059669" },
];

function normalizeHex(input: string): string {
  let hex = input.trim();
  if (!hex.startsWith("#")) hex = "#" + hex;
  if (hex.length === 4) {
    hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toUpperCase();
  return "#FFFFFF";
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface BgRemoverDropdownProps {
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
  renderSelected?: (selected: DropdownOption) => React.ReactNode;
  openUpward?: boolean;
  showDescriptions?: boolean;
  panelMaxHeight?: number;
  optionSwatchColors?: Record<string, string>;
}

function BgRemoverDropdown({
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
  renderSelected,
  openUpward = false,
  showDescriptions = true,
  panelMaxHeight = 240,
  optionSwatchColors,
}: BgRemoverDropdownProps) {
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
        {renderSelected ? (
          renderSelected(selected)
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
        <div
          className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-[#8F8F8F] rounded-[12px] shadow-xl z-40 overflow-hidden flex flex-col"
          style={{ maxHeight: `${panelMaxHeight}px` }}
        >
          <div
            role="listbox"
            className="w-full overflow-y-auto py-[4px] brand-scrollbar"
            style={{ maxHeight: `${panelMaxHeight - (onCustomColorChange && customColor && value === "Custom" ? 44 : 0)}px` }}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              const swatch = optionSwatchColors?.[opt.value];
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
                  <div className="flex items-center gap-[8px] min-w-0 flex-1">
                    {swatch === "transparent" ? (
                      <span
                        className="w-[14px] h-[14px] rounded-[4px] border border-gray-300 shrink-0"
                        style={{
                          backgroundImage:
                            "linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)",
                          backgroundSize: "6px 6px",
                          backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
                          backgroundColor: "#fff",
                        }}
                      />
                    ) : swatch === "custom" ? (
                      <span
                        className="w-[14px] h-[14px] rounded-[4px] border border-gray-300 shrink-0"
                        style={{
                          backgroundImage:
                            "linear-gradient(135deg, #FF0080 0%, #FF8C00 20%, #FFD700 40%, #00C853 60%, #00B0FF 80%, #7C4DFF 100%)",
                          backgroundColor: customColor || "#FFFFFF",
                        }}
                      />
                    ) : swatch ? (
                      <span
                        className="w-[14px] h-[14px] rounded-[4px] border border-gray-300 shrink-0"
                        style={{ backgroundColor: swatch }}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="font-body font-semibold text-[12px] md:text-[13px] truncate">
                        {opt.label}
                      </div>
                      {showDescriptions && (
                        <div className="font-body text-[10px] md:text-[11px] text-[#64748B] truncate leading-[1.3] mt-[1px]">
                          {opt.desc}
                        </div>
                      )}
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
          {onCustomColorChange && customColor && value === "Custom" && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="border-t border-gray-200/80 px-[10px] py-[6px] flex items-center gap-[5px] bg-[#FAF9F6] flex-wrap shrink-0"
            >
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCustomColorChange(c.hex);
                  }}
                  className={`w-[14px] h-[14px] rounded-full border border-gray-300 transition-transform shrink-0 ${
                    customColor.toLowerCase() === c.hex.toLowerCase()
                      ? "scale-115 ring-2 ring-brand-primary"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <input
                type="color"
                value={customColor}
                onChange={(e) => onCustomColorChange(e.target.value)}
                className="w-[16px] h-[16px] p-0 border-none rounded cursor-pointer shrink-0"
                aria-label="Pick custom color"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => onCustomColorChange(normalizeHex(e.target.value))}
                maxLength={7}
                className="w-[50px] h-[20px] px-1 font-mono text-[10px] border border-gray-300 rounded outline-none focus:border-brand-primary uppercase text-center ml-auto"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BackgroundRemover() {
  const { status, sessionVersion } = useAuth();

  // Settings
  const [bgOption, setBgOption] = useState("Transparent");
  const [customColor, setCustomColor] = useState("#FFFFFF");
  const [scale, setScale] = useState("100");

  // File & State
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<number | null>(null);
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);

  // Processing result
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    dataUrl: string;
    format: string;
    size: number;
    conversionsUsed?: number;
    remaining?: number;
  } | null>(null);

  // Preview & Dropdowns
  const [previewMode, setPreviewMode] = useState<"before" | "after">("before");
  const [dragOver, setDragOver] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"bg" | "scale" | null>(null);

  // Auth & Quota
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [limitDownloadDone, setLimitDownloadDone] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Storage
  const [storageRestored, setStorageRestored] = useState(false);
  const storageRestoredRef = useRef(false);
  const prevStatusRef = useRef<AuthStatus | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);

  // ── Wipe data on sign-out ──────────────────────────────────────────────────
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (prev === "authed" && status !== "authed") {
      setFile(null);
      setDataUrl(null);
      setImageName(null);
      setImageSize(null);
      setImageDims(null);
      setResult(null);
      setError(null);
      setUsage(null);
      setShowSignupPrompt(false);
      setPreviewMode("before");
      setBgOption("Transparent");
      setCustomColor("#FFFFFF");
      setScale("100");
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
      if (openDropdown === "bg" && bgRef.current && !bgRef.current.contains(target)) {
        setOpenDropdown(null);
      }
      if (openDropdown === "scale" && scaleRef.current && !scaleRef.current.contains(target)) {
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
        if (!cancelled) {
          setUsage(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status, sessionVersion]);

  // ── Smooth progress bar during processing ──────────────────────────────────
  useEffect(() => {
    if (processing) {
      const timer = setTimeout(() => setProgress(90), 50);
      return () => clearTimeout(timer);
    }
    queueMicrotask(() => setProgress(0));
  }, [processing]);

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
          if (saved.result && typeof saved.result.dataUrl === "string") {
            setResult(saved.result);
          }
          if (typeof saved.bgOption === "string") setBgOption(saved.bgOption);
          if (typeof saved.customColor === "string") setCustomColor(saved.customColor);
          if (typeof saved.scale === "string") setScale(saved.scale);
        }
      } catch {}
      finally {
        storageRestoredRef.current = true;
        setStorageRestored(true);
      }
    });
  }, []);

  // ── Save state to sessionStorage ───────────────────────────────────────────
  useEffect(() => {
    if (!storageRestoredRef.current) return;
    try {
      const persistableResult =
        result && result.dataUrl && result.dataUrl.length <= MAX_PERSISTED_RESULT_CHARS
          ? result
          : null;
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          dataUrl,
          imageName,
          imageSize,
          imageDims,
          result: persistableResult,
          bgOption,
          customColor,
          scale,
        })
      );
    } catch {}
  }, [dataUrl, imageName, imageSize, imageDims, result, bgOption, customColor, scale]);

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

    setFile(f);
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
        setImageDims({ width: img.naturalWidth, height: img.naturalHeight });
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

  function handleClear() {
    setFile(null);
    setDataUrl(null);
    setImageName(null);
    setImageSize(null);
    setImageDims(null);
    setResult(null);
    setError(null);
    setPreviewMode("before");
    setBgOption("Transparent");
    setCustomColor("#FFFFFF");
    setScale("100");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    showToast("success", "Cleared image and settings");
  }

  // ── Process (remove background) ────────────────────────────────────────────
  async function handleRemoveBackground() {
    if (!file && !dataUrl) {
      showToast("error", "No image selected. Upload an image to get started.");
      return;
    }
    setError(null);
    setProcessing(true);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else if (dataUrl) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const fallbackFile = new File([blob], imageName || "image.png", { type: blob.type });
        formData.append("file", fallbackFile);
      }

      formData.append("scale", scale);
      formData.append("bgOption", bgOption);
      if (bgOption === "Custom") formData.append("bgColor", normalizeHex(customColor));

      const apiRes = await fetch("/api/v1/background-remove", {
        method: "POST",
        headers: {
          ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
        },
        body: formData,
      });

      if (!apiRes.ok) {
        const body = await apiRes.json().catch(() => null);
        throw new Error(body?.payload?.message || `Request failed (${apiRes.status})`);
      }

      const body = await apiRes.json();
      const payload = body.payload || body;

      setResult({
        dataUrl: payload.dataUrl || payload.data,
        format: payload.format || "png",
        size: payload.size || 0,
        conversionsUsed: payload.conversionsUsed,
        remaining: payload.remaining,
      });
      setPreviewMode("after");
      showToast("success", "Background removed! Your image is ready to download.");
      trackConversion("svg_converted", { output_format: "png", tool: "background_remover" });

      if (payload.remaining !== undefined) {
        const reached = payload.remaining === 0;
        const updatedUsage = {
          conversionsUsed: payload.conversionsUsed,
          remaining: payload.remaining,
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
            detail: { conversionsUsed: payload.conversionsUsed, remaining: payload.remaining },
          })
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Background removal failed. Please try again.";
      setError(msg);
      showToast("error", msg);
    } finally {
      setProcessing(false);
    }
  }

  // ── Download ───────────────────────────────────────────────────────────────
  function handleDownload() {
    if (!result?.dataUrl) return;
    const a = document.createElement("a");
    a.href = result.dataUrl;
    a.download = `crushsvg-bg-removed-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast("success", "Your download has started");
    trackConversion("png_downloaded", { output_format: "png", tool: "background_remover" });

    const limitReached = usage !== null && !usage.isUnlimited && usage.limitReached;
    if (limitReached && status !== "authed") {
      setLimitDownloadDone(true);
      setShowSignupPrompt(true);
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const limitReached = usage !== null && !usage.isUnlimited && usage.limitReached;
  const hasResult = !!result?.dataUrl;
  const fileExt = imageName ? imageName.split(".").pop()?.toUpperCase() : "IMAGE";

  const bgSwatchColor =
    bgOption === "Custom" ? customColor : bgOption === "Transparent" ? "transparent" : bgOption;

  return (
    <>
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
                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={processing || !dataUrl}
                      aria-label="Clear uploaded image"
                      className={`group relative rounded-[6px] px-[12px] py-[4px] font-body font-medium text-[12px] overflow-hidden transition-opacity duration-300 ${
                        dataUrl
                          ? processing
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
                  id="bg-remover-file-upload"
                  type="file"
                  aria-label="Upload image file for background removal"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  className="absolute w-0 h-0 opacity-0 overflow-hidden"
                  onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />

                {/* Main Upload / File Display Card */}
                {dataUrl ? (
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
                      src={dataUrl}
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
                      disabled={processing}
                      className={`absolute top-3 right-3 z-20 group rounded-[6px] px-[12px] py-[4px] font-body font-medium text-[12px] overflow-hidden transition-opacity duration-300 shadow-sm cursor-pointer ${
                        processing ? "opacity-50 cursor-not-allowed pointer-events-none" : "opacity-100"
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
                    aria-label="Drag and drop or select an image file for background removal"
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
                {dataUrl ? (
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
                          {imageDims ? (imageDims.width / imageDims.height).toFixed(2) : "—"}
                        </strong>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] md:text-[11px] text-[#64748B] border-t border-gray-200/80 pt-[4px]">
                      <span className="truncate">
                        {bgOption === "Custom" ? customColor : bgOption} &middot; {scale}%
                      </span>
                      <span className="text-brand-primary font-medium shrink-0 ml-2">Ready</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full rounded-[16px] border border-[#E2E8F0] bg-[#FAF9F6] p-[12px] md:p-[14px] flex flex-col mt-[12px] transition-all">
                    <div className="font-heading font-semibold text-[12px] md:text-[13px] text-[#475569] flex items-center justify-between mb-[6px]">
                      <span>AI Background Removal</span>
                      <span className="text-[10px] font-normal text-brand-primary bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-full">
                        PNG &amp; JPG
                      </span>
                    </div>
                    <ul className="text-[11px] md:text-[12px] text-[#64748B] flex flex-col gap-[4px]">
                      <li className="flex items-start gap-2">
                        <span className="text-brand-primary font-bold leading-[1.2]">✓</span>
                        <span className="leading-[1.3]">Auto-detects and removes image backgrounds</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-primary font-bold leading-[1.2]">✓</span>
                        <span className="leading-[1.3]">Clean transparent PNG output</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-primary font-bold leading-[1.2]">✓</span>
                        <span className="leading-[1.3]">Works with photos, headshots, and designs</span>
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

                  {/* Mode Tabs (Before / After) */}
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
                        Removed
                      </button>
                    </div>
                  )}
                </div>

                {/* Main Preview Container */}
                <div className="w-full h-[220px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] flex items-center justify-center relative overflow-hidden bg-white p-[16px] md:p-[24px]">
                  {bgOption === "Transparent" && hasResult && previewMode === "after" && (
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
                  {processing ? (
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 border-3 border-[#E2E8F0] border-t-brand-primary rounded-full animate-spin" />
                      <span className="font-body font-medium text-[14px] text-text-dark">
                        Removing background...
                      </span>
                    </div>
                  ) : previewMode === "after" && result?.dataUrl ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <img
                        src={result.dataUrl}
                        alt="Background removed result"
                        className="max-w-full max-h-full object-contain drop-shadow-md"
                      />
                      <span className="absolute bottom-2 right-2 bg-brand-primary text-white text-[12px] font-heading px-2 py-0.5 rounded shadow-xs">
                        Transparent PNG
                      </span>
                    </div>
                  ) : previewMode === "before" && dataUrl ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <img
                        src={dataUrl}
                        alt="Original source image"
                        className="max-w-full max-h-full object-contain drop-shadow-md"
                      />
                      <span className="absolute bottom-2 right-2 bg-brand-primary text-white text-[12px] font-heading px-2 py-0.5 rounded shadow-xs">
                        Original
                      </span>
                    </div>
                  ) : dataUrl ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center opacity-85">
                      <img
                        src={dataUrl}
                        alt="Uploaded preview"
                        className="max-w-full max-h-full object-contain filter grayscale-[30%]"
                      />
                      <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                        <span className="bg-white/90 backdrop-blur-xs border border-gray-200 text-text-dark font-body font-medium text-[13px] px-3 py-1.5 rounded-full shadow-sm">
                          Click &ldquo;Remove Background&rdquo; below
                        </span>
                      </div>
                    </div>
                  ) : storageRestored ? (
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
                  ) : null}
                </div>

                {/* ========================================================== */}
                {/* Background Remover Settings (1x2 Grid)                    */}
                {/* ========================================================== */}
                <div
                  className={`w-full mt-[16px] md:mt-[20px] transition-all duration-300 ${
                    processing ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] md:gap-[16px] w-full">
                    {/* Background Dropdown */}
                    <BgRemoverDropdown
                      label="Background"
                      value={bgOption}
                      options={BG_OPTIONS}
                      onChange={(val) => {
                        setBgOption(val);
                        if (val !== "Custom") {
                          setOpenDropdown(null);
                        }
                      }}
                      isOpen={openDropdown === "bg"}
                      onToggle={() => setOpenDropdown(openDropdown === "bg" ? null : "bg")}
                      dropdownRef={bgRef}
                      disabled={processing}
                      customColor={customColor}
                      onCustomColorChange={(c) => {
                        setCustomColor(c);
                        setBgOption("Custom");
                      }}
                      showDescriptions={false}
                      optionSwatchColors={{
                        Transparent: "transparent",
                        White: "#FFFFFF",
                        Black: "#000000",
                        Custom: "custom",
                      }}
                      renderSelected={(selected) => {
                        if (selected.value === "Custom") {
                          return (
                            <div className="flex items-center gap-[6px] min-w-0">
                              <span
                                className="w-[16px] h-[16px] rounded-full border border-gray-300 shrink-0 inline-block shadow-2xs"
                                style={{ backgroundColor: customColor }}
                              />
                              <span className="font-mono text-[12px] md:text-[13px] text-[#353A3E] font-medium uppercase truncate">
                                {customColor}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center gap-[8px] min-w-0">
                            <span
                              className="w-[16px] h-[16px] rounded-[4px] border border-gray-300 shrink-0 inline-block"
                              style={
                                selected.value === "Transparent"
                                  ? {
                                      backgroundImage:
                                        "linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)",
                                      backgroundSize: "6px 6px",
                                      backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
                                      backgroundColor: "#fff",
                                    }
                                  : { backgroundColor: selected.value.toLowerCase() }
                              }
                            />
                            <span className="font-body font-medium text-[13px] md:text-[15px] text-[#353A3E] truncate">
                              {selected.label}
                            </span>
                          </div>
                        );
                      }}
                    />

                    {/* Scale Dropdown */}
                    <BgRemoverDropdown
                      label="Output Scale"
                      value={scale}
                      options={SCALE_OPTIONS}
                      onChange={(val) => {
                        setScale(val);
                        setOpenDropdown(null);
                      }}
                      isOpen={openDropdown === "scale"}
                      onToggle={() => setOpenDropdown(openDropdown === "scale" ? null : "scale")}
                      dropdownRef={scaleRef}
                      disabled={processing}
                      showDescriptions={false}
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
                </div>

                {/* Action CTA Buttons Row */}
                {processing ? (
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
                      Analyzing image and removing background...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-[8px] mt-[16px] md:mt-[20px] relative">
                    {mounted && limitReached && status !== "authed" && (limitDownloadDone || !hasResult) ? (
                      <button
                        type="button"
                        onClick={() => setShowSignupPrompt(true)}
                        className="w-[300px] h-[44px] md:h-[48px] px-[16px] md:px-[24px] rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-body font-medium text-[14px] md:text-[16px] flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                      >
                        Sign up for unlimited conversions
                      </button>
                    ) : hasResult ? (
                      <>
                        <Button
                          className="w-[300px] h-[44px] md:h-[48px] px-[12px] md:px-[32px] rounded-[12px] gap-[8px] shadow-sm"
                          onClick={handleDownload}
                          disabled={processing}
                        >
                          <span className="flex items-center justify-center gap-[8px] text-[15px] md:text-[16px] w-full">
                            Download PNG
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
                        onClick={handleRemoveBackground}
                        disabled={processing || !dataUrl}
                      >
                        <span className="flex items-center justify-center gap-[8px] text-[15px] md:text-[16px] w-full">
                          Remove Background
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
                        Transparent PNG &middot; {formatFileSize(result.size)}
                        {imageDims ? ` · ${imageDims.width}×${imageDims.height} px` : ""}
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
