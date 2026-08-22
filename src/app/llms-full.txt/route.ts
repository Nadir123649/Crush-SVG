import { NextResponse } from "next/server";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://crushsvg.net";

const content = `# CrushSVG — Full Site Reference

> CrushSVG is a lightning-fast, browser-based SVG to PNG converter that preserves pixel-perfect accuracy — including CSS filters, inline images, custom fonts, and transparent backgrounds. Built for designers, developers, and email marketers.

## What Is CrushSVG?

CrushSVG converts Scalable Vector Graphics (SVG) to raster PNG images with perfect fidelity. Unlike most converters that miss embedded fonts, CSS styles, patterns, or filters, CrushSVG uses advanced server-side rendering to ensure your output matches your design exactly.

Common use cases:
- Exporting SVG icons and logos to PNG for use in email clients (Outlook, Gmail)
- Generating high-resolution PNG assets for websites, presentations, and app stores
- Converting SVG illustrations to PNG for social media or newsletters
- Producing transparent-background PNGs from SVG files

---

## How It Works

1. Paste SVG code into the editor, upload a .svg file, or drag-and-drop it
2. Choose output settings: width (px or cm), height, scale multiplier (1x–16x), and background transparency
3. Click Convert — a crisp PNG is generated in seconds
4. Download the PNG or copy it to clipboard

The converter runs server-side. SVG code is processed securely and never stored or shared.

---

## Pricing & Accounts

- **Guest (no account):** 3 free conversions per session
- **Free account:** Unlimited conversions, no credit card required, no subscription
- There are no paid plans. CrushSVG is entirely free.

---

## Frequently Asked Questions

**Is CrushSVG free?**
Yes. Up to 3 conversions without an account. Create a free account for unlimited conversions — no credit card, no subscription.

**Do I need to install anything?**
No. CrushSVG is entirely web-based. Works in any modern browser.

**Is my SVG code stored?**
No. SVG code is processed securely on our servers and is never stored, logged, or shared.

**Can I choose the output size?**
Yes. Set a custom width and/or height in pixels or centimetres, or use a scale multiplier (1x to 16x) based on the SVG's intrinsic dimensions.

**Does it support transparent backgrounds?**
Yes. Toggle the transparency option before converting to get a PNG with a transparent background.

**What SVG features are supported?**
CrushSVG supports CSS styles, inline fonts, embedded images (base64 and linked), CSS filters, gradients, patterns, clip paths, and masks.

---

## Site Pages

| Page | URL | Description |
|---|---|---|
| Home / Converter | ${BASE_URL} | Main SVG to PNG conversion tool |
| SVG Guides | ${BASE_URL}/svg-guides | Tutorials and guides on working with SVGs |
| About | ${BASE_URL}/about | About CrushSVG, our mission and parent company The Nevon |
| Meet the Team | ${BASE_URL}/team | Engineering and product leadership behind CrushSVG |
| Changelog | ${BASE_URL}/changelog | Release notes, updates, and feature history |
| Help & FAQ | ${BASE_URL}/help | Frequently asked questions and help center |
| Support Hub | ${BASE_URL}/support | Technical troubleshooting and vector support |
| Contact Us | ${BASE_URL}/contact-us | Direct feedback and support contact form |
| Sign Up | ${BASE_URL}/signup | Create a free account for unlimited conversions |
| Log In | ${BASE_URL}/login | Sign in to an existing account |
| Privacy Policy | ${BASE_URL}/privacy-policy | How user data is collected and used |
| Terms of Service | ${BASE_URL}/terms | Terms and conditions of use |
| Cookies Policy | ${BASE_URL}/cookies | Cookie usage and consent information |

---

## Technical Details

- Built with Next.js (App Router), TypeScript, and Tailwind CSS
- Server-side SVG rendering for maximum fidelity
- Supports SVG files up to 5MB
- Maximum output resolution: 4000 x 4000 px
- Output formats: PNG (default), JPEG
- Authentication: Email/password and Google OAuth
- Hosting: Vercel

---

## Contact

- Support email: support@crushsvg.net
- Privacy / legal: privacy@crushsvg.net
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
