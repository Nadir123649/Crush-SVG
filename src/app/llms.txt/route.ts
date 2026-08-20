import { NextResponse } from "next/server";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://crushsvg.net";

const content = `# CrushSVG

> CrushSVG is a lightning-fast, browser-based SVG to PNG converter that preserves pixel-perfect accuracy — including CSS filters, inline images, custom fonts, and transparent backgrounds.

CrushSVG was built to solve the frustration of broken or inaccurate SVG conversions. Paste SVG code, upload a file, or drag-and-drop — and get a crisp, production-ready PNG in seconds. It works for email clients (Outlook, Gmail), newsletters, websites, presentations, and more.

## Key Features

- Paste SVG code directly or upload/drag-and-drop .svg files
- Custom output width, height, and scale (up to 4000px)
- Transparent background support
- Guest conversions (no sign-up required, limited)
- Unlimited conversions with a free account
- Pixel-perfect rendering — preserves CSS, fonts, patterns, and embedded images

## Pages

- [Home / Converter](${BASE_URL}): Main SVG to PNG conversion tool
- [SVG Guides](${BASE_URL}/svg-guides): Tutorials and guides on working with SVG files
- [About](${BASE_URL}/about): About CrushSVG and its mission
- [Help](${BASE_URL}/help): Help center and frequently asked questions
- [Support](${BASE_URL}/contact-us): Contact and support
- [Pricing](${BASE_URL}/signup): Free tier and account plans
- [Privacy Policy](${BASE_URL}/privacy-policy): How user data is handled
- [Terms of Service](${BASE_URL}/terms): Terms of use
- [Cookies Policy](${BASE_URL}/cookies): Cookie usage information

## API

CrushSVG does not offer a public API. Conversions are performed via the web interface only.

## Contact

For support or inquiries, visit ${BASE_URL}/contact-us or email privacy@crushsvg.net
`;

export function GET() {
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
