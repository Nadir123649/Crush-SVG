import { NextResponse } from "next/server";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.crushsvg.net";

const content = `# CrushSVG — Full Site & Platform Reference

> CrushSVG is a high-performance vector and raster graphics platform. It features an ultra-accurate SVG to PNG converter, PNG to SVG vectorizer, AI Background Remover, and high-precision Image Resizer with offline PWA support and multi-language localization. Built for designers, developers, marketers, and digital creators.

## Platform Tools & Capabilities

### 1. SVG to PNG Converter (\`/\`)
- Converts Scalable Vector Graphics (SVG code, files, or remote URLs) to raster PNG images with pixel-perfect fidelity.
- Preserves CSS styles, inline fonts, embedded images (base64 and linked), CSS filters, gradients, patterns, clip paths, and masks.
- Custom output width and height (px or cm) and scale multipliers up to 16x (up to 4000x4000 px output).
- Full transparent background support.

### 2. PNG to SVG Vectorizer (\`/png-to-svg\`)
- Traces raster images (PNG, JPG, WebP) into scalable vector SVG graphics.
- Features multi-layer color quantization, corner threshold smoothing, and path optimization.
- Ideal for logo recreation, silhouette extraction, and converting pixel art into vectors.

### 3. AI Background Remover (\`/background-remover\`)
- Automatic AI-powered foreground segmentation and background removal.
- Works directly in modern browsers for instant transparency.
- Optimized for portrait photography, e-commerce product listings, and digital illustrations.

### 4. Image Resizer (\`/image-resizer\`)
- High-precision image dimension scaling and compression.
- Locks aspect ratio, supports custom pixel bounds, and optimizes file sizes.

### 5. SVG Optimizer & Minifier (\`/svg-optimizer\`)
- Lossless vector code compression and minification.
- Strips editor metadata (Illustrator, Figma, Inkscape), removes unused defs and comments, rounds path coordinate decimals.
- Live before/after size reduction stats and instant in-browser processing.

### 6. Progressive Web App (PWA) & Offline Mode
- Installable desktop and mobile application (Chrome, Safari iOS, Edge, Android).
- Service worker caching with offline fallback page (\`/offline.html\`) and local tool cache.

### 7. Multi-Language Internationalization
- Available in English (en), Spanish (es), German (de), French (fr), Portuguese (pt), and Japanese (ja).

---

## Pricing & Accounts

- **Guest (no account):** 3 free conversions per tool session.
- **Free account:** Unlimited conversions across all tools, conversion history, and priority processing. No credit card required.

---

## Site Navigation & Routes

| Page | URL | Description |
|---|---|---|
| SVG to PNG Converter | ${BASE_URL}/ | Primary SVG to PNG rendering engine |
| PNG to SVG Vectorizer | ${BASE_URL}/png-to-svg | Bitmap image to vector converter |
| AI Background Remover | ${BASE_URL}/background-remover | Neural background transparency tool |
| Image Resizer | ${BASE_URL}/image-resizer | Precise image dimension and scale tool |
| SVG Optimizer | ${BASE_URL}/svg-optimizer | Lossless SVG minifier and compressor |
| Blog | ${BASE_URL}/blog | Technical articles and design workflows |
| SVG Guides | ${BASE_URL}/svg-guides | In-depth tutorials on working with vector graphics |
| About | ${BASE_URL}/about | About CrushSVG and parent engineering company The Nevon |
| Meet the Team | ${BASE_URL}/team | Product and engineering leadership |
| Changelog | ${BASE_URL}/changelog | Version updates and release history |
| Help & FAQ | ${BASE_URL}/help | Frequently asked questions and help documentation |
| Support Hub | ${BASE_URL}/support | Technical support and vector troubleshooting |
| Contact Us | ${BASE_URL}/contact-us | Direct feedback and support inquiries |
| Sign Up | ${BASE_URL}/signup | Free account creation |
| Log In | ${BASE_URL}/login | User sign-in |
| Privacy Policy | ${BASE_URL}/privacy-policy | User data protection and security |
| Terms of Service | ${BASE_URL}/terms | Terms of service and usage conditions |
| Cookies Policy | ${BASE_URL}/cookies | Cookie usage and consent management |

---

## Technical Specifications

- **Frontend:** Next.js (App Router, Turbopack), React, TypeScript, Tailwind CSS
- **i18n Engine:** next-intl with localized route aliases and bidirectional slug resolution
- **PWA:** Service Worker (CacheFirst assets, NetworkFirst navigation), Web App Manifest v2
- **Vector Rendering:** Server-side high-fidelity rendering pipeline
- **Hosting:** Vercel Edge Network
- **Max File Size:** 5MB per upload
- **Max Output Resolution:** 4000 x 4000 px

---

## Contact & Support

- Support email: support@crushsvg.net
- Parent company: The Nevon (https://www.thenevon.com)
- Contact form: ${BASE_URL}/contact-us
`;

export function GET() {
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
