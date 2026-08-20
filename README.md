# CrushSVG

Convert SVG to PNG exactly as intended — paste code, upload a file, or drag-and-drop, and get a high-fidelity PNG at the size you need.

Built with Next.js 16 (App Router), sharp (librsvg), MongoDB, and Firebase Auth.

## Features

- **SVG → PNG conversion** with configurable width / height (px or cm) and scale (0.1x – 16x)
- **Transparent background** toggle; white background when disabled
- **Live preview** and source-size detection (width/height attributes or viewBox)
- **Free tier**: 3 conversions per guest per 24 hours (tracked with an anonymous `gid` cookie), unlimited for registered users
- **Email + password auth and Google OAuth** with JWT session rotation
- **Security-first SVG sanitization** — scripts, event handlers, and script: schemes are stripped before rendering; embedded `data:image/*` payloads are preserved
- **Optional BullMQ queue** (`ENABLE_CONVERSION_QUEUE=true`) to offload conversion to a worker process
- **Cloudinary uploads** for converted images and user assets

## Quick start

```bash
npm install
cp .env.example .env   # fill in the values
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run worker` | BullMQ conversion worker (`ENABLE_CONVERSION_QUEUE` must be on) |

## Environment variables

See `.env.example` for the full list. The important groups:

- **Auth**: Firebase web + admin SDK config, `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (≥ 32 chars), `APP_ORIGINS`, `ADMIN_EMAILS`
- **Database**: `MONGODB_URI`, `MONGODB_DB_NAME`
- **Email**: Resend API key or SMTP credentials
- **Cloudinary**: `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET`
- **Rate limiting**: Upstash Redis (`UPSTASH_REDIS_REST_URL` / `TOKEN`) — falls back to in-memory, which resets on restart and is **not safe across multiple instances**
- **Conversion queue**: `ENABLE_CONVERSION_QUEUE` (default off) + `REDIS_URL`; without it conversions run inline in the request

## Limits

| Limit | Value |
| --- | --- |
| SVG input size | 5 MB |
| Output size | 4000 × 4000 px (hard cap — larger requests are rejected) |
| Scale | 0.1x – 16x |
| Guest conversions | 3 per 24 hours (per `gid` cookie) |
| Rate limit | 30 conversions/min per IP |
| Conversion timeout | 30 s (server), 60 s (client abort) |

## Architecture

```
src/
├── app/
│   ├── page.tsx                    Landing page with the converter UI
│   └── api/v1/
│       ├── convert/route.ts        SVG → PNG endpoint (JSON or binary download)
│       ├── uploads/route.ts        Multipart upload → Cloudinary
│       ├── usage/route.ts          Guest/user conversion budget
│       └── svg/validate/route.ts   SVG sanity validation
├── components/sections/ConverterUI.tsx   Converter UI
└── lib/
    ├── svg-sanitize.ts             Attribute-aware sanitizer + currentColor detection
    ├── svg-dims.ts                 Shared dimension parser + 4000px target math
    ├── svg-convert.ts              sharp pipeline (PNG only, 30 s timeout)
    ├── svg-errors.ts               Error classification for the API
    ├── conversion-queue.ts         BullMQ wrapper with inline fallback
    └── client/converter.ts         Browser API client
```

### Conversion pipeline

1. `convertSchema` validates input (SVG ≤ 5 MB, dimensions ≤ 4000 px, scale 0.1–16).
2. `sanitizeSvg` strips scripts/foreignObject/handlers/script: schemes and inlines Figma-style `<use>` → `<image>` references.
3. `computeTargetSize` derives the output size; any side over 4000 px is rejected (never silently clamped).
4. sharp renders with librsvg (`density: 300`, `limitInputPixels: 50M`) and encodes PNG (`compressionLevel: 9`, adaptive filtering).
5. Failures are mapped to friendly API errors by `classifySvgError`; `currentColor` without a color is reported as a warning on the response.

## Deployment notes

- Single instance: in-memory rate store is fine.
- Multiple instances: configure Upstash Redis for rate limiting, and consider `ENABLE_CONVERSION_QUEUE` with a worker so conversions don't block request handlers.
- The conversion worker (`npm run worker`) must be running separately when the queue is enabled, or jobs will wait 120 s and time out.
- `sharp` must be a server-only dependency (never imported in client components).
