import { NextResponse } from "next/server";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.crushsvg.net";

const content = `# CrushSVG

> CrushSVG is a high-performance vector and raster graphics platform. It features an ultra-accurate SVG to PNG converter, PNG to SVG vectorizer, AI Background Remover, and high-precision Image Resizer with offline PWA support and multi-language localization.

CrushSVG was built to solve the frustration of broken vector conversions and rasterization errors. Whether converting vector code to crisp PNGs, tracing raster images into scalable SVGs, removing photo backgrounds using neural AI, or batch-resizing assets, CrushSVG provides studio-grade quality in seconds.

## Key Tools & Features

1. **SVG to PNG Converter**: Converts SVG code, uploaded files, or URLs to high-resolution PNGs (up to 16x scale and 4000px) with full transparency, embedded fonts, and CSS filter preservation.
2. **PNG to SVG Vectorizer**: Traces bitmap/raster images (PNG, JPG, WebP) into clean, scalable SVG vector paths with custom color quantization and path smoothing.
3. **AI Background Remover**: Instant browser-side and neural AI background removal for photos, graphics, and e-commerce product images.
4. **Image Resizer**: Exact pixel dimension scaling, aspect ratio preservation, and compression optimization.
5. **SVG Optimizer & Minifier**: Instant lossless SVG code compressor, stripping metadata, unused defs, and rounding coordinate decimals.
6. **PWA & Offline Mode**: Installable Progressive Web App with service worker caching for offline access on Windows, macOS, Linux, Android, and iOS.
7. **Multi-Language Support**: Fully localized in English, Spanish (Español), German (Deutsch), French (Français), Portuguese (Português), and Japanese (日本語).

## Pages & Tools

- [SVG to PNG Converter](${BASE_URL}/): Main SVG to PNG conversion tool
- [PNG to SVG Vectorizer](${BASE_URL}/png-to-svg): Raster to vector tracing tool
- [AI Background Remover](${BASE_URL}/background-remover): Automatic transparent background generator
- [Image Resizer](${BASE_URL}/image-resizer): Pixel scaling and image optimization
- [SVG Optimizer](${BASE_URL}/svg-optimizer): SVG minifier and compressor tool
- [Blog](${BASE_URL}/blog): Designer and developer articles on vector graphics and web design
- [SVG Guides](${BASE_URL}/svg-guides): Tutorials and guides on working with SVG files
- [About](${BASE_URL}/about): About CrushSVG and its mission
- [Team](${BASE_URL}/team): Meet the creators and engineers at The Nevon
- [Changelog](${BASE_URL}/changelog): Recent updates, releases, and feature improvements
- [Help & FAQ](${BASE_URL}/help): Help center and frequently asked questions
- [Support Hub](${BASE_URL}/support): Technical support and common solutions
- [Contact Us](${BASE_URL}/contact-us): Contact and support form
- [Privacy Policy](${BASE_URL}/privacy-policy): How user data is handled
- [Terms of Service](${BASE_URL}/terms): Terms of use
- [Cookies Policy](${BASE_URL}/cookies): Cookie usage information

## Pricing & Access

- **Guest:** 3 free conversions per tool session.
- **Free Account:** Unlimited access to all tools, batch processing, and history. No credit card required.

## Contact

For support or inquiries, visit ${BASE_URL}/contact-us or email support@crushsvg.net
`;

export function GET() {
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
