"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/images";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/client/auth-context";
import { convertText, parseSvgDimensions, svgToDataUrl, type ConvertResponse } from "@/lib/client/converter";
import { getUsage } from "@/lib/client/sessions";
import type { UsageInfo } from "@/lib/shared-types";

const WIDTH_OPTIONS = ["Original", "120px", "240px", "480px", "720px", "1080px", "1920px", "2560px", "3840px"];
const SCALE_OPTIONS = ["1x", "2x", "3x", "4x", "5x", "8x", "10x", "16x"];

const SAMPLE_SVG = `<svg width="104" height="104" viewBox="0 0 104 104" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect width="103.276" height="103.257" fill="url(#pattern0_4824_15804)"/>
<rect x="66.6987" y="47.3262" width="36.5768" height="36.5702" rx="17" fill="#DA582D"/>
<path d="M90.9871 63.9144L84.9871 57.6113L78.9871 63.9144M84.9871 57.6113L84.4871 73.6113" stroke="white" stroke-width="2" stroke-linecap="round"/>
<defs>
<pattern id="pattern0_4824_15804" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_4824_15804" transform="scale(0.0104167 0.0104186)"/>
</pattern>
<image id="image0_4824_15804" width="96" height="96" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAOmUlEQVR4AexcCXAcxRX9v2dWl2V8go0t7a5WMqBjVcHmqgIKYwEBzBFkHAKucIQkRXEECAQqhFTIRQgBwpGiOAKEYI6U8QGOAxh8kKQCCTHGumycXWm1koUNlm0kW5a1O935f+Q1krwjaVbaHVnarfnTPf1/T3f/N/27+/fMCkj/HNVAGgBH1Q+QBiANgMMacLj4dA9IA+CwBhwuPt0D0gA4rAGHi0/3gDQADmvA4eLHZg9wWOk9i08D0FMbDsTTADig9J5FOgaA1+s/wVPov9lbVH6fk+Qp8t+U5yue1VMpqYw7BoDS1EWIODWVjY1XFgIeLUC7MB4vFWmOAdAYrHkoFKi6byRQuL7msVQoO14ZjgEQrzJjMS3pAIwUW293nEnV2JB0AEaKrbfbu1I1NiQdgJFk6+2ON6kYG5IOgN0nb6zJDysAeXl52e5C/xyPz7/IXVh2i6eo7J6vbK+z8/1E68FtMNvi81/lKSqfzW0czodkWACY5PNNcBeUXqxlTrpTIF6MAmcJFFMQRAYc4T+kNphtEXgcAlxCbbzD4yubP7mo6CgYht+QAcgrKCufIHJvF5o2hxZWmpJQHTGM5RCNPhUKRO+3a3dHmjxE2x7gthCtkIaqpTbqKMTJ41XOLTzDGyoGQwLAXVh6uq6JSq6EkmorVfbRxvqqpdsaajeFQnXbAeq6mHckUygU6uS2EH0SbqheIrvUYxJkEBFcoOO38n1lJw2lfQkD4HaXlAjUzu0uXK5vrK9+hSq7p/t69J7D4erd4UDNYsOQ/+JWklman1dYUsTxRCghANxu/ySRoX+TC4xG1bpQoGY9x8cQqaaGmtWgoh8KIZBs0sJp08rHJdL+hABQLnUeF8ZmpzlU/T7HxyKFgnVvK0M2AYjMrHFybiI6sA3A9OlFR2soihVA1762rpWJFDqa8kQOdL3B7eGBecaMGTkct0O2AXBlZxebBUi5aefOT9vN+Bg+tbRs3QnK2MIqcLkmHs+hHbINgEBlDjgGGFvtFDSaZRVqpi6U0Ezd2GmrbQAQhLkA6WyTNM0EOz/d6y0/ze0rvzW2KuV4XkHJKXZuMhJlMRptMeslYLIZ9jgNFLUNgBJg2jk75meSzzfBU+i/AXQ4XwiYFKsUx3VNv9DjK79x6tTjx8fSj7ywo3v6rWAi2PzZBgABbLsXJkDOlYg4VSnZHpFdr3R17HzQJANepbS9KOCY3AkZC2zWfcSI0/qnkysjBGZzaIdsA2Dn5iyb7ys9GYSYzoruaJNPb6vfsrWlpaWjhamh6tN27HwGpOoERG9+YXEZ5xlLlHQANMCTWKGGhNVffFG3l+M9aVcg0CYR3uU0BDEbxtgv6QBIgGNYp53tkQYO41G72hcw05U41gzH0CnpAKAQkYH0STK0rgNAoTQYY7+kA6CU2sk6zRyv+ziMR+MjGYVmugE7zNDBU35B+ZmeQv/NRPd6feW3uWmfw+v1ZiWrSkkHgCq+gQh0gefGc1hNpo0NpXd7VQ2Aj1jWCeKdLk9R6Xc1DSoQcSqRDgImCtrnoKXPDckCIekAhIPVG0DK7YgiNytX3pDnK57FjWW/idfrP2G8yvq+QMwBqRqbG2qqnFD+tGnTxmkZk69D0PKUku1RqZYCbcSQ7//PinswAaFEblLenks6AMA/ufc1qWQrgTBeF65FetbkuzNypt4FtKFBablAAO1rN5awaKqJF4BZucdchwKOkVLuRmPvc8311dU8tyfff72KwMtKQQSFKOcHZrjrlxIAqDF7wsGapyAKb4NUX8YawaBIpVaG6mueijdFjcnZDgeZgfc1co/KvJ7MDS0S1c6OtsjzXNee2cO0AQMYeUsq2WqA9PTk9YpH2x7lbcteaYO4SAkAB+sRCYWqPgzVV/8+tu9LoDxhmqiDAqkMZs48YQq61HeAzAtIuSOyv/X5nRbe3cbA5o+5rk2h2nes6sjAhUJ1n1jxrdJTCYBVHVKePr2I9jSyXPTki/FSqZaQ6Hy+hVbmKa8IFTjmAMjPP35Glsy+Pjbwh4PGnyAQOEC66PeYM0e55i1QF1dUqhcrFqiPKQzTdQeTGa9UG+ZVqhfOrlTz585Ver8368EcUwAcW1DsEZmZ14LALKmMejKHL8EAb26cMV9NIiU/MsEDrQjwJiBcTfo7kcJ8us5mMuMIsxHhWoHwV20KtBJID556gTJd9yRveYwZAGjA9WUI/dsIkME7WOFg7cuklShR3GPhQqXNu0zdnZkFDZTndlKuHXc5K/5HuTnQQEDcCqAs9WzJiFurIzSRp4/ogkWIqEtQtaFg7V+oKQZR3IOfepryrKGp6QMkMIEo0YM3aB6tqIR3rHrDqAfAXVRSKoW6gpSvGaA2hgPVr5M2Td8ThYcdcy9RRfTUb0CEsw5jJpqAcA71hv/SWOHre4tRDYDHU3IiSHG5EAKVlB81BarfIAVYKv+chWqCpgNPNQtIbriPWVTw6rkLVW7PG49aAPJpIwhd+qWm8lX07431Nat6NvzwuEIpYSkNqIc9pYfLJpZCvaqQuuFrNCbQsNJ9j1EJAHs0NaHNN5tIq+/GYN1aM97PaV4l3EpaqehHpBdrIo0MK2kO9SYRx3sx+7tAmF+xAG6MiQwjALFbOht6C0vO1zSoIL+OMqSxKkSr74FqxAMkPZ0/H0guxp9MW++P/xogOxsgh4jjnBbjDyL8xXnnqXEsN5oAQI+vbD6gfhorXypY3lRfOyj39rgc+DEp4yiiAY+J9OQ/8kuAGdO/EuU4pzHvq9R+Y5OjuXAnS4wWAJCUfxkKcbKUSoKQrzcP0rXN830yPYdMAivFiiaS8p+4HyCPNk4/67F1xHFOYx7LWOXvk34zjwWjAQDhLvJfTsovV4qsDkRfDQfqavs01vKyNQo83TzKUuAggxXLCj52GgAr/JZ7DjIo4DinMY9lWJaS+z3I5E09ewGccqQDoHl8/isFYCn77FUEXm6u3/y/flveh0mLrUv7JB12yQplxbKCWdGs8D2HnOoAHOc05rEMy3Kew27UJ0EouET0SUv5Je9G5fn8frev5Iy8grLyeNuWFpVyuQtLF6HAWQDyQERFXyLffb2FrGUyATfHknmQ8dufArBimz8DuPUnAKzwg6xDAacxbxvJsOwD9x5iWUYUwkmOAuDxFB+blXv0DbrABULo5+iaqMzKhRvz8o6baVlrk1GS4SkqvUag5gOpOo0DkRdb6uvCJsv+qcdwGj+zQU6Lpm0APyQgdnW/hBhXkHm3k0xzC9DeTFyRXok09uQ5BoDHU14Aum765EHK7aCiH0ryzZNtHKdnZX1vpu+E43rV9uAF7ye7C7Vr0dy/hX0dSr3Q1PQpNRkS+yGQVe8/6413A1xHLjVWcP+SACxz7Q8AbuZ51UDCADMdAYCViy64BhF13qYM0ZZkKFj3djhY/UzUiP6N6+0SGVexSeJ4jHgjX8+YSE8+zlC8ed7Z9fznDTU95iMxycGH9BTSMXj54ZRUAFrKAeCP+1i53BAVib7Rd6HU3FD3HwaF+WyS3AXll3s8ZcVk7093ZU+9CYSYLqXc3aY6/rht25ZWlhsK0Rhg9zX7oRTXN+922wAQauanp16v/ZeVvN6Sr4mM7o/7DBV5vbGxbmPfGvG1CQq5EDguNChDl7hCoHYuIowjM7WtgzbPd9fX95iHsGSChDCkHpRgqWY2pBmtfQCUPPiCbQ4tyM37DOrEzjGy+d8whaPqtabg5hozbnFiEParfU8aYHwgDRlQUlaxa4HM1LNWm+cWt+o/WUFd/wLJ49LDXGsbAABlzgOUEoc+tBioijzFZOcYdfeIcUC+FApVbxkoD/N3BIOfNwVq3wk31Cwmb+aypkG6FjjvYImmgssHKzvccqhgaQIAQJArInUo53AgcvvKK3iKqQC6umRkcVNTjZl/oHyp4u8Q8B49GCn/2JDK3D1Zg3W2AZAH1GZWjoaimPZZ++0FnkL/BULAmcBz9c7OFz9r2NzIeUcS1S3BLhpbnk15nRCeXLIEDdsANDfX7ZIgu+2mS15MFaexhM69D/T4yioR8VQaNDs6aK7e3LyVljK9hUbKldEFv6G6mJMLCpN+kDXYKw14iAuyDQBngi58l0Oamfg8haWHfSFOU8cFKAQ5x+Te6P4DQ56rc1nJpPUrcSeZhKftlrGJXH5MdvOR/B/Wr0BzLE0IgHC4ereEqPkyLaJ2Vp7Xzx5Fui/oHp9/EU8dFS2UVASfa+EPmZkzwmnffriXnsxBTQ5iTbnjZwBMsetBhhv1dvhVTDYhADhzmFy+5CNZw3Fdx7M9ZHJosXQVknNMKrmrHTufZaCYfyTQv9/CNhBwDoGQTFMZBgnnrl6N+2I6SRgAvkFTQ9U/IBpdwXEkk8MmieMCoSrTcE1ivw1fHym0dgluQwnzyBwN+2SB7hk0IlCxZjn2Wr0PCQBWLL8RHO2MPk4mZxNfd5OYm6m5ruPvAGJfxY/kML+w7IruegOQgrZ2HYATSWHvx9KGHCp4j0zc7PVvYqDvvYYMAN+QZ0aNwZrl/PE1O9NolhQgM9RK3Tk5MwsudBhJQ1FMJnR+7Jb/XIW7p/DGPsBdBER7LN1uSHn3gII71yyDr5smLs4NhgWA2H35FW92poUDNYvDwZonGgNV94cCI+P/oQeqB620e703xHP0dUvxd/s18NKD9Bgp0w4QbST/sJRQsGYZPgxAhg3i/4YVgPhFHNmpHyzBXWuX4m1fNsIUqeAiAuNVatFGerKbKL6fyYwr+JiU/pIy4EKjFaasXYZ3xqaaJG95pAGwVE1vxoYNGFm3DFcRGFetWYqz6cl2UzyHyYwvwzmk9KvXrsC31q/HaO/c1ldpAKx1kxJOGoCUqNm6kDQA1rpJCScNQErUbF1IGgBr3aSEkwYgJWq2LiQNgLVuUsKxAUBK6jPmCkkD4DDkaQDSADisAYeLT/eANAAOa8Dh4tM9IA2AwxpwuPh0D0gD4LAGHC4+3QMGACDZ7P8DAAD//3KBDKgAAAAGSURBVAMAqVraKkdGcsQAAAAASUVORK5CYII="/>
</defs>
</svg>`;

export function ConverterUI() {
  const { status } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<"width" | "scale" | null>(null);
  const [selectedWidth, setSelectedWidth] = useState("480px");
  const [selectedScale, setSelectedScale] = useState("2x");
  const [transparent, setTransparent] = useState(true);
  const [svgCode, setSvgCode] = useState(SAMPLE_SVG);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('crush_usage');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return null;
  });
  const [dragOver, setDragOver] = useState(false);
  const [previewIsConverted, setPreviewIsConverted] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dims = useMemo(() => parseSvgDimensions(svgCode), [svgCode]);

  const aspectLabel = dims.width && dims.height ? ` (aspect ratio ${(dims.width / dims.height).toFixed(3)})` : "";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (usage && typeof window !== 'undefined') {
      localStorage.setItem('crush_usage', JSON.stringify(usage));
    }
  }, [usage]);

  useEffect(() => {
    if (status === 'loading') return;
    let cancelled = false;
    getUsage()
      .then((u) => { 
        if (!cancelled) {
          setUsage(u);
          if (typeof window !== 'undefined') {
            localStorage.setItem('crush_usage', JSON.stringify(u));
          }
        }
      })
      .catch(() => { /* guest usage unavailable — hide badge */ })
    return () => { cancelled = true }
  }, [status]);

  const previewSvgUrl = useMemo(() => svgToDataUrl(svgCode), [svgCode]);

  const previewUrl =
    previewIsConverted && result?.data
      ? `data:${result.mimeType};base64,${result.data}`
      : previewSvgUrl;

  function handleSvgChange(value: string) {
    setSvgCode(value);
    setResult(null);
    setPreviewIsConverted(false);
    setError(null);
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
      handleSvgChange(text);
    } catch {
      setError("Could not read that file. Please try again.");
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files?.[0]);
  }, []);

  async function handleConvert() {
    setError(null);
    setConverting(true);
    try {
      const widthNum = selectedWidth === "Original" ? undefined : parseInt(selectedWidth, 10);
      const scaleNum = widthNum ? undefined : parseFloat(selectedScale.replace("x", ""));
      const res = await convertText(svgCode, {
        width: widthNum,
        scale: scaleNum,
        transparent,
      });
      setResult(res);
      setPreviewIsConverted(true);
      if (res.remaining !== undefined) {
        setUsage({
          conversionsUsed: res.conversionsUsed,
          remaining: res.remaining,
          isUnlimited: false,
          limitReached: res.remaining === 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed. Please try again.");
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
  }

  const limitReached = usage !== null && !usage.isUnlimited && usage.limitReached;

  return (
    <section className="w-full max-w-[362px] md:max-w-[720px] lg:max-w-[1280px] mx-auto mt-[30px] md:mt-[48px] mb-[60px] md:mb-[100px]">
      {/* Outer Dashed Border Box */}
      <div className="w-full h-auto lg:h-[650.67px] border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[32px] p-0 md:p-[12px]">
        
        {/* Inner Dashed Border Box */}
        <div className="w-full h-auto lg:h-[626.23px] bg-transparent md:bg-[#FFFFFF] border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[24px] flex flex-col lg:flex-row justify-center px-0 md:px-[40px] py-0 md:py-[20px] gap-[24px] md:gap-[30px]">
          
          {/* Left Column (SVG Code) */}
          <div className="w-full lg:w-[536.9px] flex flex-col">
            <div className="flex items-center justify-between mb-[12px]">
              <h2 className="font-heading font-semibold text-[16px]" style={{ color: "#64748B" }}>
                SVG Code
              </h2>
              {usage && (
                <span className="font-body font-normal text-[12px] md:text-[13px] text-[#64748B]">
                  {usage.isUnlimited
                    ? "Unlimited conversions"
                    : `${usage.conversionsUsed} of ${usage.conversionsUsed + usage.remaining} free conversions used`}
                </span>
              )}
            </div>
            
            {/* SVG Code Box */}
            <textarea
              value={svgCode}
              onChange={(e) => handleSvgChange(e.target.value)}
              spellCheck={false}
              aria-label="SVG code"
              className="w-full h-[200px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] p-[16px] md:p-[24px] bg-[#FFFFFF] resize-none outline-none focus:border-brand-primary transition-colors font-body font-normal text-[14px] md:text-[16px] leading-[18.67px] text-[#D2D2D2] whitespace-pre-wrap overflow-auto"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              className="hidden"
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
              className={`w-full h-[120px] md:h-[167px] rounded-[16px] border ${dragOver ? "border-solid border-brand-primary bg-gray-50" : "border-dashed md:border-solid border-[#8F8F8F] bg-transparent"} mt-[16px] flex flex-col items-center justify-center gap-[8px] md:gap-[10px] p-[16px] md:p-[40px] cursor-pointer hover:bg-gray-50 transition-colors`}
            >
              <Image src={IMAGES.drag} alt="Drag Cloud" width={64} height={64} className="object-contain w-[48px] h-[48px] md:w-[64px] md:h-[64px]" />
              <div className="font-body text-[14px] md:text-[16px] leading-[18.67px] text-text-dark">
                <span className="font-normal">Drag & Drop or </span>
                <span className="font-medium text-brand-primary">Select SVG</span>
              </div>
            </div>

            {/* Bottom Source Text */}
            <p className="font-body font-normal text-[12px] md:text-[14px] text-[#64748B] mt-[12px] md:mt-[16px] ml-[8px] md:ml-[24px]">
              {dims.width && dims.height
                ? `Source size: ${dims.width} x ${dims.height} px${aspectLabel}`
                : "Source size: unknown — set width/height or viewBox on your SVG"}
            </p>
          </div>

          {/* Right Column (Live Preview) */}
          <div className="w-full lg:w-[536.9px] flex flex-col">
            <h2 className="font-heading font-semibold text-[16px] mb-[12px]" style={{ color: "#64748B" }}>
              Live Preview
            </h2>
            
            {/* Live Preview Box */}
            <div className="w-full h-[200px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] flex items-center justify-center relative overflow-hidden bg-transparent md:bg-gray-50/30 p-[16px] md:p-[24px]">
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="SVG preview" className="max-w-full max-h-full object-contain" />
                  {previewIsConverted && (
                    <span className="absolute top-[10px] left-[10px] rounded-[6px] bg-green-100 text-green-700 font-body font-medium text-[12px] px-[10px] py-[4px]">
                      Converted PNG
                    </span>
                  )}
                </>
              ) : (
                <Image src={IMAGES.uploadImage} alt="Live Preview Placeholder" width={100} height={100} className="object-contain w-[80px] h-[80px] md:w-[100px] md:h-[100px]" />
              )}
            </div>

            {previewIsConverted && (
              <button
                type="button"
                onClick={() => setPreviewIsConverted(false)}
                className="self-start font-body font-normal text-[13px] text-brand-primary hover:underline mt-[6px]"
              >
                Show original SVG
              </button>
            )}

            {/* Settings & Controls */}
            <div className="w-full mt-[16px] md:mt-[20px]" ref={dropdownRef}>
              {/* Dropdowns Row */}
              <div className="flex gap-[12px] md:gap-[20px] w-full">
                
                {/* Width Input */}
                <div className="flex flex-col flex-1 gap-[6px] md:gap-[8px] relative">
                  <label className="text-[#64748B] font-heading font-semibold text-[14px] md:text-[16px] leading-[18.67px]">Width (px)</label>
                  <button 
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === "width" ? null : "width")}
                    aria-haspopup="listbox"
                    aria-expanded={openDropdown === "width"}
                    className="w-full h-[48px] md:h-[60px] rounded-[12px] border border-[#8F8F8F] px-[12px] md:px-[16px] flex items-center justify-between cursor-pointer bg-transparent md:bg-white"
                  >
                    <span className="font-body font-medium text-[16px] md:text-[18px] text-[#353A3E]">{selectedWidth}</span>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform duration-200 ${openDropdown === "width" ? "rotate-180" : ""}`}>
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="#353A3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  
                  {/* Width Dropdown Menu */}
                  {openDropdown === "width" && (
                    <div role="listbox" className="absolute top-[80px] md:top-[90px] left-0 w-full max-h-[200px] overflow-y-auto bg-white border border-[#8F8F8F] rounded-[12px] shadow-lg z-10 py-[8px]">
                      {WIDTH_OPTIONS.map((opt) => (
                        <div 
                          key={opt}
                          role="option"
                          aria-selected={selectedWidth === opt}
                          onClick={() => { setSelectedWidth(opt); setOpenDropdown(null); }}
                          className="px-[16px] py-[10px] font-body text-[14px] md:text-[16px] text-[#353A3E] hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scale Input */}
                <div className="flex flex-col flex-1 gap-[6px] md:gap-[8px] relative">
                  <label className="text-[#64748B] font-heading font-semibold text-[14px] md:text-[16px] leading-[18.67px]">Scale</label>
                  <button 
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === "scale" ? null : "scale")}
                    aria-haspopup="listbox"
                    aria-expanded={openDropdown === "scale"}
                    className="w-full h-[48px] md:h-[60px] rounded-[12px] border border-[#8F8F8F] px-[12px] md:px-[16px] flex items-center justify-between cursor-pointer bg-transparent md:bg-white"
                  >
                    <span className="font-body font-medium text-[16px] md:text-[18px] text-[#353A3E]">{selectedScale}</span>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform duration-200 ${openDropdown === "scale" ? "rotate-180" : ""}`}>
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="#353A3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  
                  {/* Scale Dropdown Menu */}
                  {openDropdown === "scale" && (
                    <div role="listbox" className="absolute top-[80px] md:top-[90px] left-0 w-full max-h-[200px] overflow-y-auto bg-white border border-[#8F8F8F] rounded-[12px] shadow-lg z-10 py-[8px]">
                      {SCALE_OPTIONS.map((opt) => (
                        <div 
                          key={opt}
                          role="option"
                          aria-selected={selectedScale === opt}
                          onClick={() => { setSelectedScale(opt); setOpenDropdown(null); }}
                          className="px-[16px] py-[10px] font-body text-[14px] md:text-[16px] text-[#353A3E] hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Transparent Background Box */}
              <label className="w-full h-[48px] md:h-[60px] rounded-[12px] border border-[#8F8F8F] mt-[12px] md:mt-[16px] px-[12px] md:px-[16px] flex items-center justify-between cursor-pointer hover:bg-gray-50 bg-transparent md:bg-white">
                <span className="font-body font-normal text-[15px] md:text-[20px] leading-[18.67px] text-[#353A3E]">
                  Transparent Background
                </span>
                <input 
                  type="checkbox" 
                  checked={transparent}
                  onChange={(e) => setTransparent(e.target.checked)}
                  className="w-[18px] h-[18px] md:w-[20px] md:h-[20px] rounded border-[#8F8F8F] accent-brand-primary cursor-pointer" 
                />
              </label>

              {error && (
                <div role="alert" className="rounded-[8px] border border-red-200 bg-red-50 px-[14px] py-[10px] mt-[12px] font-body text-[13px] leading-[18px] text-red-700">
                  {error}
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex justify-center mt-[16px]">
                {limitReached && status !== "authed" ? (
                  <Link href="/signup" className="w-full md:w-auto h-[42px] px-[16px] md:px-[24px] rounded-[8px] md:rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-body font-medium text-[14px] md:text-[16px] flex items-center justify-center hover:opacity-90 transition-opacity">
                    Sign up for unlimited conversions
                  </Link>
                ) : (
                  <Button 
                    className="w-full md:w-auto h-[42px] px-[12px] md:px-[32px] rounded-[8px] md:rounded-[12px] gap-[6px] md:gap-[8px]" 
                    onClick={result?.data && previewIsConverted ? handleDownload : handleConvert} 
                    disabled={converting}
                  >
                    {converting ? (
                      <span className="flex items-center gap-[6px] md:gap-[8px] text-[14px] md:text-[16px]">
                        <span className="w-[14px] h-[14px] md:w-[16px] md:h-[16px] rounded-full border-[2px] border-white/40 border-t-white animate-spin" />
                        Converting...
                      </span>
                    ) : result?.data && previewIsConverted ? (
                      <span className="flex items-center gap-[6px] md:gap-[8px] text-[14px] md:text-[16px]">
                        <Image src={IMAGES.downloadImage} alt="" width={16} height={16} className="brightness-0 invert md:w-[18px] md:h-[18px]" />
                        Download PNG
                      </span>
                    ) : (
                      <span className="flex items-center gap-[6px] md:gap-[8px] text-[14px] md:text-[16px]">
                        <Image src={IMAGES.exportIcon} alt="" width={16} height={16} className="brightness-0 invert md:w-[18px] md:h-[18px]" />
                        Convert
                      </span>
                    )}
                  </Button>
                )}
              </div>
              
              {result && result.size !== undefined && (
                <p className="text-center font-body font-normal text-[12px] md:text-[13px] text-[#64748B] mt-[10px]">
                  {result.format.toUpperCase()} · {(result.size / 1024).toFixed(1)} KB
                  {result.width && result.height ? ` · ${result.width} x ${result.height} px` : ""}
                </p>
              )}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
