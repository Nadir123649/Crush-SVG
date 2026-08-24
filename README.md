<div align="center">
  <img src="./public/crushsvg.webp" width="120" alt="CrushSVG Logo" />

  # CrushSVG

  **An ultra-crisp, security-first SVG-to-PNG converter built for modern web, design, and marketing workflows.**

  [![Next.js Version](https://img.shields.io/badge/Next.js-16.3--App--Router-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![React Version](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)](https://react.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
  [![License](https://img.shields.io/badge/License-Private-red?style=flat-square)](https://github.com/)

  *Paste raw SVG code, upload files, or drag & drop to instantly generate high-fidelity PNG assets optimized for Outlook, Gmail, newsletters, websites, and print.*
</div>

---

## 🚀 Core Capabilities

- **High-Fidelity Rendering**: Backed by `sharp` and `librsvg` for accurate, crisp rendering at high resolutions (300 DPI target density).
- **Flexible Dimensions**: Configure outputs using standard width and height options in pixels (`px`) or centimeters (`cm`), or apply direct multipliers (from `0.1x` up to `16x`).
- **Transparency Controls**: Toggle transparent backgrounds instantly; falls back to flat white when disabled.
- **Auto-Dimension Parsing**: Automatically extracts dimensions from SVG `width`, `height`, or `viewBox` attributes.
- **Security-First Sanitization**: Strips scripts, event handlers, and malicious `javascript:` or `script:` schemes to prevent XSS, while safely preserving embedded base64 assets (`data:image/*`).
- **User & Guest Budget Tiers**:
  - **Guest Tier**: Includes 3 free conversions tracked securely via an anonymous cookie.
  - **Registered Tier**: Offers unlimited conversions for authenticated users.
- **Secure Authentication**: Built-in support for Email + Password credentials and Social OAuth Providers (Google, GitHub, X) with secure, rotating JWT sessions.
- **Scalable Background Queue**: Optional BullMQ integration (`ENABLE_CONVERSION_QUEUE=true`) to offload resource-intensive conversion jobs to a dedicated worker.
- **Cloud Storage**: Automatic upload handling via Cloudinary for converted assets and user profiles.

---

## 🛠️ Tech Stack & Key Libraries

- **Framework**: Next.js 16 (App Router)
- **UI & Styling**: React 19, Tailwind CSS v4, Bricolage Grotesque & Afacad Fonts
- **Rendering Engine**: Sharp (librsvg wrapper)
- **Database & ORM**: MongoDB with Mongoose
- **Authentication**: Firebase Client SDK & Firebase Admin SDK
- **Queueing (Optional)**: BullMQ (Redis-backed)
- **File Storage**: Cloudinary SDK

---

## ⚙️ Installation & Local Setup

### Prerequisites

- Node.js >= 22.12.0
- MongoDB instance (Local or Atlas)
- Firebase Project
- Cloudinary Account
- Redis Server *(Optional, required for BullMQ queues and Upstash Rate Limiting)*

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/programmer-Raheem/Crush-SVG.git
   cd Crush-SVG
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🧪 Scripts & CLI Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server. |
| `npm run build` | Builds the application for production deployment. |
| `npm start` | Runs the built Next.js application in production mode. |
| `npm run lint` | Runs ESLint to check for code quality and syntax issues. |
| `npm test` | Executes unit tests via Vitest. |
| `npm run worker` | Starts the BullMQ background worker (requires `ENABLE_CONVERSION_QUEUE=true`). |

---

## 📊 Platform Constraints & Performance Limits

The system enforces the following constraints to prevent abuse and resource exhaustion:

| Constraint | Limit Value | Description |
| :--- | :--- | :--- |
| **SVG Input Size** | `5 MB` | Maximum file size allowed for uploaded SVG markup. |
| **Output Dimension** | `4000 × 4000 px` | Hard cap on output resolution. Larger requests are rejected. |
| **Scale Range** | `0.1x – 16x` | Available rendering scale multipliers. |
| **Guest Conversions** | `3` | Maximum free conversions per anonymous session. |
| **Rate Limiter** | `30 / min` | Conversion rate limit per IP address (backed by Upstash). |
| **Timeout Limits** | `30s` (Server) / `60s` (Client) | Maximum execution duration before connection is aborted. |

---

## 📂 Project Structure

```
src/
├── app/
│   ├── page.tsx                     # Landing page & core Converter UI
│   ├── support/                     # Support & help documentation
│   ├── contact-us/                  # Help desk request forms
│   └── api/v1/
│       ├── convert/route.ts         # Main SVG → PNG processing endpoint
│       ├── uploads/route.ts         # Asset upload handler (Cloudinary)
│       ├── usage/route.ts           # Usage tracker (Budget limits)
│       └── svg/validate/route.ts    # SVG sanitization & parsing validation
├── components/
│   ├── auth/                        # Login, Signup & Password Reset cards
│   ├── layout/                      # Global Navbar & Mobile Nav overlay
│   └── sections/                    # Page components (Hero, Features, Footer, FAQ)
└── lib/
    ├── svg-sanitize.ts              # Custom attribute-aware SVG sanitizer
    ├── svg-dims.ts                  # Shared dimension & viewBox parsers
    ├── svg-convert.ts               # Sharp conversion pipeline
    ├── svg-errors.ts                # Structured conversion error mapper
    ├── conversion-queue.ts          # BullMQ queue runner & worker setups
    └── client/                      # API client scripts & state contexts
```

---

## 🌐 Deployment & Multi-Instance Production Notes

- **Rate Limiting**: For multi-instance horizontal deployments, configure Upstash Redis API tokens. The system defaults to in-memory tracking if variables are missing, which is not synchronized across multiple load-balanced instances.
- **Conversion Workload**: If serving high-traffic environments, toggle `ENABLE_CONVERSION_QUEUE=true` and run the worker script (`npm run worker`) as a separate process or container. This ensures heavy render operations do not block critical HTTP request handlers.
- **Dependency Restriction**: `sharp` contains native OS binaries and must only be imported or executed in server-side contexts (`server-only`). Do not import this module inside Client Components.

---

## 📄 License

Private Repository. All rights reserved.
