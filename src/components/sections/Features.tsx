"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/client/auth-context";
import { useLocale, useTranslations } from "next-intl";

function renderFeaturesTitle(title: string) {
  const match = title.match(/(SVG to React Conversion|Transparent Cutouts|Precision Resizing|SVG Optimization|Browser Favicons|juggling design tools|überladener Software|programas complejos|logiciels complexes|softwares pesados|重いデザインソフト)/i);
  if (match) {
    const parts = title.split(match[0]);
    return (
      <>
        {parts[0]}
        <span className="text-brand-primary">{match[0]}</span>
        {parts.slice(1).join(match[0])}
      </>
    );
  }
  return title;
}

function renderSvgPngFeaturesTitle(title: string, locale: string) {
  const highlightByLocale: Record<string, string> = {
    de: "SVG in PNG",
    es: "SVG a PNG",
    fr: "SVG en PNG",
    pt: "SVG para PNG",
    ja: "SVGをPNG",
  };
  const highlight = highlightByLocale[locale];
  if (!highlight || !title.includes(highlight)) return title;

  const [before, ...after] = title.split(highlight);
  return (
    <>
      {before}
      <span className="text-brand-primary">{highlight}</span>
      {after.join(highlight)}
    </>
  );
}

function renderRasterFeaturesTitle(title: string) {
  const brand = "CrushSVG";
  if (!title.includes(brand)) return title;

  const [before, ...after] = title.split(brand);
  return (
    <>
      {before}
      <span className="text-brand-primary">{brand}</span>
      {after.join(brand)}
    </>
  );
}

export function Features({ mode = "svg-to-png" }: { mode?: "svg-to-png" | "raster-to-svg" | "background-remover" | "image-resizer" | "svg-optimizer" | "favicon-generator" | "svg-to-react" }) {
  const t = useTranslations("features");
  const locale = useLocale();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const svgPngDescription = mode === "svg-to-png" && locale === "en"
    ? "SVG is useful for scalable graphics, but some upload forms and publishing workflows require a PNG. CrushSVG lets you turn an SVG logo, icon, or illustration into a raster image with the dimensions and background you need."
    : t("svgDesc");
  const featureContent = {
    "svg-to-react": [
      { index: 1, title: "Full TypeScript TSX & Prop Typing", description: "Generates TypeScript component props extending React.SVGProps<SVGSVGElement>, so standard SVG element props can be passed to the component." },
      { index: 2, title: "Dynamic currentColor & Tailwind Friendly", description: "Enable currentColor to replace supported hardcoded fill and stroke colors, making generated icons easier to style with CSS and Tailwind utilities." },
      { index: 3, title: "Framework-Ready Component Output", description: "Generate a component for your selected framework and copy it into your project. Your build tooling can include only the components your application imports." },
    ],
    "background-remover": [
      { index: 1, title: "No Watermark on Downloads", description: "Download the processed PNG without a CrushSVG watermark. Guest use has a free conversion limit; account access follows the current quota rules." },
      { index: 2, title: "Useful for Logos and Cricut Artwork", description: "Remove a solid background from logos, signatures, and graphics to create a transparent image for design and craft projects." },
      { index: 3, title: "Image Processing with Privacy Information", description: "Images are sent to the background-removal API for processing. Review the Privacy Policy for details about how uploaded images are handled." },
    ],
    "image-resizer": [
      { index: 1, title: "Exact Dimensions for Print and Crafts", description: "Set the output width and height in pixels for your project. Print size and effective DPI depend on the pixel dimensions and the physical size at which you print." },
      { index: 2, title: "Canvas-Based Image Resampling", description: "Resize images in your browser with the Canvas API. Preview the result to confirm that the selected dimensions and image detail suit your use." },
      { index: 3, title: "Preserves PNG Transparency", description: "Exporting to PNG retains transparent areas from the source image. JPG output uses a solid background because JPEG does not support alpha transparency." },
    ],
    "svg-optimizer": [
      { index: 1, title: "Reduce SVG Markup and File Size", description: "Remove selected comments, editor metadata, redundant attributes, and empty groups, then compare the resulting file size before downloading." },
      { index: 2, title: "Adjustable Coordinate Precision", description: "Choose decimal precision for path coordinates. Lower precision can reduce file size but may change the rendered artwork, so review the preview before using the result." },
      { index: 3, title: "Clean Up SVG Markup", description: "The optimizer removes configured comments and metadata and cleans selected SVG markup. It is not a general-purpose SVG security sanitizer; review files before publishing untrusted content." },
    ],
    "favicon-generator": [
      { index: 1, title: "Multi-Resolution ICO Container", description: "The generated favicon.ico includes PNG-backed icon resolutions from 16×16 through 256×256 pixels for browsers that support multi-size ICO files." },
      { index: 2, title: "Ready-to-Use HTML and PWA Files", description: "The ZIP includes the generated favicon assets, a site.webmanifest, and HTML link tags you can adapt to your site's public asset paths." },
      { index: 3, title: "Transparent SVG Rendering", description: "The generator can retain transparent areas from the source SVG when the selected background is transparent. Preview the icons against light and dark surfaces." },
    ],
  };
  const detailedFeatures = locale === "en" && mode in featureContent
    ? featureContent[mode as keyof typeof featureContent]
    : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="features" className="flex min-w-0 flex-col items-center w-full mb-[60px] md:mb-[100px] scroll-mt-[100px] md:scroll-mt-[140px]">
      
      {/* Heading & Description */} 
      <div className="flex min-w-0 flex-col items-center w-full max-w-[900px] gap-[14px]">
        <h2 className={`w-full min-w-0 max-w-full break-words [overflow-wrap:anywhere] font-heading text-[24px] leading-[30px] tracking-[0.04em] text-center text-text-dark ${mode === "svg-to-png" && locale === "en" ? "font-bold md:text-[42px] md:leading-[56px]" : "font-semibold md:text-[48px] md:leading-[60px]"}`}>
          {mode === "svg-to-png" && locale === "en" ? (
            <>
              <span className="block">Why Convert SVG to PNG</span>
              <span className="block text-brand-primary">with CrushSVG?</span>
            </>
          ) : mode === "svg-to-png" ? renderSvgPngFeaturesTitle(t("svgTitle"), locale) : mode === "raster-to-svg" ? renderRasterFeaturesTitle(t("rasterTitle")) : renderFeaturesTitle(
            mode === "background-remover"
              ? t("bgTitle")
              : mode === "image-resizer"
              ? t("resizerTitle")
              : mode === "svg-optimizer"
              ? t("optimizerTitle")
              : mode === "favicon-generator"
              ? t("faviconTitle")
              : mode === "svg-to-react"
              ? t("reactTitle")
              : t("svgTitle")
          )}
        </h2>
        {!detailedFeatures && <p className={`w-full min-w-0 break-words [overflow-wrap:anywhere] font-body font-normal text-center text-text-muted ${mode === "svg-to-png" && locale === "en" ? "max-w-[760px] text-[12px] leading-[20px]" : "max-w-[640px] text-[14px] leading-[20px] md:text-[16px] md:leading-[22px]"}`}>
          {mode === "background-remover" ? (
            t("bgDesc")
          ) : mode === "image-resizer" ? (
            t("resizerDesc")
          ) : mode === "svg-optimizer" ? (
            t("optimizerDesc")
          ) : mode === "favicon-generator" ? (
            t("faviconDesc")
          ) : mode === "svg-to-react" ? (
            t("reactDesc")
          ) : mode === "svg-to-png" ? (
            svgPngDescription
          ) : (
            t("rasterDesc")
          )}
        </p>}
      </div>

      {mode === "svg-to-png" && locale === "en" ? (
        <div className="mt-[32px] md:mt-[40px] grid w-full max-w-[1028px] grid-cols-12 gap-x-[16px] gap-y-[28px] md:gap-x-[24px] md:gap-y-[44px]">
          {[
            { index: 1, title: t("svgBenefit1Title"), description: t("svgBenefit1Desc") },
            { index: 2, title: t("svgBenefit2Title"), description: t("svgBenefit2Desc") },
            { index: 3, title: t("svgBenefit3Title"), description: t("svgBenefit3Desc") },
            { index: 4, title: t("svgBenefit4Title"), description: t("svgBenefit4Desc") },
          ].map(({ index, title, description }) => (
            <article
              key={index}
              className={`col-span-12 min-w-0 rounded-[20px] border border-[#FFA98F] bg-[#FDEBE4] p-[20px] sm:p-[24px] md:p-[30px] ${index === 1 ? "sm:col-span-7" : index === 2 ? "sm:col-span-5" : index === 3 ? "sm:col-span-5" : "sm:col-span-7"}`}
            >
              <div className="mb-[14px] flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-white text-brand-primary">
                <BenefitIcon index={index} />
              </div>
              <h3 className="font-heading text-[18px] font-bold leading-[24px] text-[#171A23]">
                {title}
              </h3>
              <p className="mt-[10px] font-body text-[12px] leading-[17px] text-[#716761]">
                {description}
              </p>
            </article>
          ))}
        </div>
      ) : mode === "raster-to-svg" ? (
        <div className="mt-[32px] md:mt-[40px] grid w-full max-w-[1028px] grid-cols-1 gap-[20px] md:grid-cols-3 md:gap-[24px]">
          {[
            { index: 1, title: t("rasterBenefit1Title"), description: t("rasterBenefit1Desc") },
            { index: 2, title: t("rasterBenefit2Title"), description: t("rasterBenefit2Desc") },
            { index: 3, title: t("rasterBenefit3Title"), description: t("rasterBenefit3Desc") },
          ].map(({ index, title, description }) => (
            <article
              key={index}
              className="min-w-0 rounded-[20px] border border-[#FFA98F] bg-[#FDEBE4] p-[20px] sm:p-[24px] md:p-[30px]"
            >
              <div className="mb-[14px] flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-white text-brand-primary">
                <BenefitIcon index={index} />
              </div>
              <h3 className="font-heading text-[18px] font-bold leading-[24px] text-[#171A23]">
                {title}
              </h3>
              <p className="mt-[10px] font-body text-[12px] leading-[17px] text-[#716761]">
                {description}
              </p>
            </article>
          ))}
        </div>
      ) : detailedFeatures ? (
        <div className="mt-[32px] md:mt-[40px] grid w-full max-w-[1028px] grid-cols-1 gap-[20px] md:grid-cols-3 md:gap-[24px]">
          {detailedFeatures.map(({ index, title, description }) => (
            <article
              key={index}
              className="min-w-0 rounded-[20px] border border-[#FFA98F] bg-[#FDEBE4] p-[20px] sm:p-[24px] md:p-[30px]"
            >
              <div className="mb-[14px] flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-white text-brand-primary">
                <BenefitIcon index={index} />
              </div>
              <h3 className="break-words font-heading text-[18px] font-bold leading-[24px] text-[#171A23]">
                {title}
              </h3>
              <p className="mt-[10px] break-words font-body text-[12px] leading-[17px] text-[#716761]">
                {description}
              </p>
            </article>
          ))}
        </div>
      ) : (
      /* Badges Row */
      <div className="flex min-w-0 max-w-full flex-wrap justify-center gap-[10px] md:gap-[39px] mt-[24px] md:mt-[62px] w-full max-w-[1000px]">
        <Badge text={mode === "svg-to-png" && locale === "en" ? t("svgBenefit1Title") : t("badgeFree")} />
        <Badge
          text={
            mode === "background-remover"
              ? t("badgeTransparentPng")
              : mode === "image-resizer"
              ? t("badgeExactPixels")
              : mode === "svg-optimizer"
              ? t("badgeMinify")
              : mode === "favicon-generator"
              ? t("badgeMultiRes")
              : mode === "svg-to-react"
              ? t("badgeTypeScriptReady")
              : mode === "svg-to-png" && locale === "en"
              ? t("svgBenefit2Title")
              : t("badgeMultipleSizes")
          }
        />
        <Badge
          text={
            mode === "background-remover"
              ? t("badgePrivate")
              : mode === "image-resizer"
              ? t("badgeRatioLock")
              : mode === "svg-optimizer"
              ? t("badgePrecision")
              : mode === "favicon-generator"
              ? t("badgeAppleAndroid")
              : mode === "svg-to-react"
              ? t("badgeFrameworkSupport")
              : mode === "svg-to-png" && locale === "en"
              ? t("svgBenefit3Title")
              : t("badgeTransparentBg")
          }
        />
        {mode === "background-remover" && <Badge text={t("badgeNoInstall")} />}
        {mode === "image-resizer" && <Badge text={t("badgeFormatsOutput")} />}
        {mode === "svg-optimizer" && <Badge text={t("badgeZeroLag")} />}
        {mode === "favicon-generator" && <Badge text={t("badgeZipExport")} />}
        {mode === "svg-to-react" && <Badge text={t("badgeLucideStyle")} />}
        {mode === "svg-to-png" && locale === "en" ? (
          <Badge text={t("svgBenefit4Title")} />
        ) : (
          (!mounted || !user) && <Badge text={t("badgeThreeFree")} />
        )}
      </div>
      )}

    </section>
  );
}

function BenefitIcon({ index }: { index: number }) {
  const common = "h-[14px] w-[14px]";

  if (index === 1) {
    return <svg aria-hidden="true" className={common} viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (index === 2) {
    return <svg aria-hidden="true" className={common} viewBox="0 0 24 24" fill="none"><path d="M8 4H4v4m0-4 6 6m6 10h4v-4m0 4-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (index === 3) {
    return <svg aria-hidden="true" className={common} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M12 4a8 8 0 0 0 0 16V4Z" fill="currentColor"/><path d="M12 4v16" stroke="currentColor" strokeWidth="1.4"/></svg>;
  }
  return <svg aria-hidden="true" className={common} viewBox="0 0 24 24" fill="none"><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>;
}

function Badge({ text }: { text: string }) {
  return (
    <div className="h-auto min-w-0 max-w-full py-[8px] md:h-[43px] md:py-0 px-[16px] md:px-[24px] flex items-center justify-center gap-[8px] md:gap-[10px] rounded-[30px] border border-[#EAEAEA] bg-white shadow-[0px_4px_40px_rgba(0,0,0,0.04)]">
      <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <path d="M1.5 5.5L5 9L12.5 1.5" stroke="#D94A1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="min-w-0 break-words [overflow-wrap:anywhere] font-body font-medium text-[14px] leading-[18.67px] text-text-dark whitespace-normal md:whitespace-nowrap text-center">
        {text}
      </span>
    </div>
  );
}
