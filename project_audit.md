# 1. Project Overview

* **What the website/platform is:** CrushSVG, a browser-based, high-quality SVG to PNG converter tool.
* **Main purpose of the platform:** To allow users to paste or upload SVG code/files and convert them into crisp, transparent PNGs at custom resolutions or scale factors, bypassing native limitations of SVGs in some email clients or platforms.
* **Technology/frameworks being used:** Next.js 15+ (App Router), React 19, TypeScript, Node.js.
* **Important libraries/packages being used:** 
  * UI/Styling: Tailwind CSS v4, Lucide React (implied by typical Next.js apps).
  * Backend/DB: MongoDB, Mongoose, Upstash Redis, BullMQ.
  * Image Processing: `sharp` for SVG to PNG conversion.
  * Auth: Firebase Auth SDK (Client-side), Custom JWTs, `bcryptjs`, `jose`.
  * Email: Resend, Nodemailer, `@react-email/components`.
  * Monitoring/Error: Sentry, Vercel Analytics, Vercel Speed Insights.
  * Validation: Zod.
* **Overall project architecture:** A hybrid architecture leveraging Next.js serverless API routes with a separate optional background worker process (`npm run worker` using BullMQ). Client uses Firebase for social auth which exchanges tokens with the Next.js API for custom JWTs and MongoDB user persistence. Redis handles rate-limiting and job queuing.

---

# 2. Complete Page/Route Inventory

* **`/` (Homepage)**
  * **Purpose:** Main landing page and converter tool interface.
  * **UI Sections:** Hero, ConverterUI (the core tool), Features grid, SignUpCTA, StepsSection, TargetAudience, FAQ, Footer.
  * **Functionality:** Drag-and-drop or paste SVG, tweak scale/width/height, toggle transparency, preview image, convert to PNG, download PNG.
  * **Access:** Public.
  * **API Interaction:** Interacts with `/api/v1/convert` and `/api/v1/usage`.
* **`/login`**
  * **Purpose:** User authentication.
  * **UI Sections:** AuthCard.
  * **Functionality:** Email/password login, Google/GitHub/X OAuth login.
  * **Access:** Public (redirects if already authed).
* **`/signup`**
  * **Purpose:** User registration.
  * **UI Sections:** SignupCard.
  * **Functionality:** Email/password registration, social signup.
  * **Access:** Public.
* **`/forgot-password` & `/reset-password`**
  * **Purpose:** Account recovery.
  * **UI Sections:** ForgotPasswordCard, ResetPassword form.
  * **Access:** Public.
* **`/email-verification` & `/verify`**
  * **Purpose:** Ensure valid user emails.
  * **Access:** Public/Conditional.
* **`/about`**
  * **Purpose:** Platform philosophy and origin story.
  * **UI Sections:** Text-heavy content blocks.
  * **Access:** Public.
* **`/changelog`**
  * **Purpose:** Product updates and release notes.
  * **Access:** Public.
* **`/contact-us`**
  * **Purpose:** User feedback and support form.
  * **UI Sections:** Contact form, self-help quick links.
  * **Functionality:** Form submission (Name, Email, Message).
  * **Access:** Public.
* **`/help`** & **`/support`**
  * **Purpose:** Support hubs.
  * **UI Sections:** FAQ accordion, resource cards.
  * **Access:** Public.
* **`/svg-guides`**
  * **Purpose:** SEO and educational content about SVGs.
  * **Access:** Public.
* **`/team`**
  * **Purpose:** Information about The Nevon team.
  * **Access:** Public.
* **`/cookies`, `/privacy-policy`, `/terms`**
  * **Purpose:** Legal and compliance documents.
  * **Access:** Public.

---

# 3. Authentication & User System

* **Login:** Supports email/password and Firebase-backed social OAuth. 
* **Signup/registration:** Users can sign up via standard credentials or OAuth.
* **Google/social login:** Implemented using Firebase Auth client SDK. The client retrieves a Firebase ID token and sends it to `/api/v1/oauth/[provider]` which verifies it and provisions a MongoDB User and custom JWT.
* **Logout:** Clears the HTTP-only refresh token cookie and invalidates the session in MongoDB/Redis.
* **Session handling:** Custom stateless/stateful hybrid. Access tokens are short-lived JWTs. Refresh tokens are HTTP-only cookies (`crush_refresh_token`).
* **Protected routes:** API routes check for valid Bearer JWTs.
* **User roles:** `user` and `admin`. Admin users are bootstrapped via the `ADMIN_EMAILS` env variable.
* **Account/profile functionality:** Tracks `conversionsUsed` and `lastLoginAt`. Accounts can link multiple OAuth providers to a single MongoDB user.
* **Email-related functionality:** Uses Resend/Nodemailer for verification emails and password resets.
* **Password-related functionality:** Passwords hashed with `bcryptjs`. Reset tokens are generated and stored in the DB with expirations.
* **Logged-in vs logged-out users:** Guests are tracked via a `crush_guest_id` cookie and are strictly limited to 3 free conversions. Logged-in users bypass this guest limit.

---

# 4. Complete Feature & Functionality Inventory

### 1. SVG to PNG Converter (Core Tool)
* **Location:** Homepage (`ConverterUI.tsx`).
* **What the user can do:** Paste raw SVG markup, drag-and-drop an SVG file, or browse to upload. Adjust scaling.
* **Exact behavior:** Parses the SVG dimensions. The user selects a scale (1x to 16x) or specific width/height (up to 4000px). They can toggle "Transparent Background". Clicking "Convert" fires an API request.
* **Logged-in vs logged-out:** Guests hit a hard limit of 3 conversions. Once reached, they are prompted to sign up. Logged-in users have higher/unlimited usage.
* **API calls:** `POST /api/v1/convert`
* **Data/state involved:** `svgCode` (string), `selectedScale`, `unit`, `transparent`. State is persisted in `sessionStorage` under `crush_converter_state`.
* **Success behavior:** Returns a base64 PNG string or triggers a binary file download. Shows a success toast.
* **Error behavior:** If the SVG is invalid, or rate limits/usage limits are hit, a toast or in-UI alert is shown.
* **Loading states:** A progress bar/spinner simulates conversion progress.

### 2. Contact Support Form
* **Location:** `/contact-us`
* **What the user can do:** Submit a message to the support team.
* **Exact behavior:** Validates Name (< 3 chars error), Email, and Message. Disables button while submitting.
* **API calls:** Likely hits an API endpoint to dispatch an email via Resend.
* **Success behavior:** Shows "Message Sent" state.

### 3. FAQ Accordion
* **Location:** Homepage & `/help` (`FAQ.tsx`).
* **What the user can do:** Click questions to reveal answers.
* **Exact behavior:** Uses local state to track the expanded index. Animated height expansion.

---

# 5. Games / Core Platform Functionality

* ❌ **Not implemented:** This project does not contain any games or interactive entertainment modules. It is a strict SaaS utility platform.

---

# 6. UI Interactions

* **Buttons:** Custom `<Button>` component with hover states, disabled states, and loading spinners.
* **Dropdowns:** Custom dropdowns used in the ConverterUI for selecting Scale/Width/Height/Units. Closes when clicking outside (managed by custom `useEffect` mousedown listeners).
* **Tabs/Toggles:** "Transparent Background" uses a checkbox disguised as a toggle block.
* **Modals:** `SignupPromptModal` appears when a guest exhausts their 3 free conversions.
* **Toasts:** Utilizes `react-hot-toast` for global success/error notifications (e.g., "Verification email sent", conversion errors).
* **Forms:** Auth forms and Contact forms feature real-time client-side validation (red borders, error text).
* **Copy/share/download:** The converter triggers an automatic browser download of the generated PNG file.
* **Animations:** Smooth CSS transitions for the FAQ accordion, dropdown menus, and hover states on buttons/links.

---

# 7. Forms & Validation

### Auth Forms (`AuthCard.tsx` / `SignupCard.tsx`)
* **Location:** `/login`, `/signup`
* **Fields:** Name (for signup), Email, Password.
* **Validation rules:** Name requires at least 3 characters and enforces `maxLength=30`. Email validated via regex. Password must be >= 6 characters. Validation triggers *after* the first submission attempt (`hasSubmitted`).
* **Submission behavior:** Disables form, calls authentication API / Firebase Auth.
* **Error handling:** Inline red text underneath the specific invalid field.

### Contact Form
* **Location:** `/contact-us`
* **Fields:** Name, Email, Message.
* **Validation rules:** Name < 3 chars fails. Email regex. Message < 10 chars fails.

---

# 8. API / Backend Integration

* **`POST /api/v1/convert`**
  * **Purpose:** Converts SVG to PNG.
  * **Parameters:** `svg` (string), `width`, `height`, `scale`, `transparent`, `quality`.
  * **Auth Requirements:** None, but tracks `crush_guest_id` cookies to enforce a limit of 3.
  * **Response:** Base64 JSON payload OR raw binary `application/octet-stream` (if `download=1`).
* **`POST /api/v1/oauth/[provider]`**
  * **Purpose:** Validates Firebase ID tokens and sets HTTP-only session cookies.
* **`GET /api/v1/usage`**
  * **Purpose:** Fetches the current conversion usage count for the logged-in user or guest. Called on mount in `ConverterUI.tsx`.
* **Other Identifiable APIs:**
  * `/api/v1/auth`, `/api/v1/passwords`, `/api/v1/verification` (Standard Auth flows).
  * `/api/v1/profile` (User profile management).
  * `/api/v1/admin` (Admin functionality).

---

# 9. Data & State Management

* **Global State (Context):** `useAuth` context provider manages `status` (`'loading' | 'authed' | 'unauthed'`) and `sessionVersion`.
* **Local State:** React `useState` heavily used in `ConverterUI` for UI toggles, input values, and conversion results.
* **Cookies:** 
  * `crush_refresh_token`: Secure, HTTP-only cookie for JWT sessions.
  * `crush_guest_id`: Tracks anonymous users for rate limiting.
* **SessionStorage:** `crush_converter_state` stores the user's current SVG string and latest conversion result so it survives accidental page refreshes.
* **Server-side State:** MongoDB stores Users and Sessions. Upstash Redis stores rate limits and potentially caches sessions.

---

# 10. Responsive Behavior

* **Desktop:** Full-width layouts, side-by-side grids for features, expanded navigation headers.
* **Tablet (md):** Grids collapse to fewer columns. Font sizes adjust (e.g., FAQ heading shifts from 14px to 16px).
* **Mobile:** 
  * Navigation collapses into a hamburger menu.
  * Converter UI dropdowns and inputs stack vertically instead of horizontally.
  * Padding/margins aggressively scale down to prevent horizontal scrolling.

---

# 11. SEO & Website Metadata

* **Page titles & Meta descriptions:** Handled centrally via `constructMetadata` in `src/lib/seo.ts`. Highly optimized keyword targeting (e.g., "crush svg", "svg to png converter").
* **Open Graph / Twitter:** Generates dynamic Open Graph images using `opengraph-image.tsx`.
* **Canonical URLs:** Explicitly set per page (e.g., `canonicalPath: "/"`).
* **Sitemap & Robots:** Exists natively (`sitemap.ts`, `robots.ts`).
* **H1/H2 hierarchy:** Strictly enforced. Landing page uses semantic sections. Sub-pages (like Contact Us) use standard H1 headers.

---

# 12. Performance-Related Implementation

* **Image optimization:** Uses `next/image` for standard static assets (logos, icons).
* **Background Processing:** Conversions can optionally be offloaded to a BullMQ worker (`ENABLE_CONVERSION_QUEUE=true`) backed by Redis, preventing the main web process from locking up during CPU-intensive `sharp` image conversions.
* **Caching:** Upstash Redis is used for fast rate limiting and session lookups.
* **Client/Server Components:** App Router utilizes Server Components by default. Interactive sections like `ConverterUI.tsx` are marked `"use client"`.

---

# 13. Error Handling & Edge Cases

* **API failures:** Standardized error responses via `errorResponse` utility. Returns structured JSON with HTTP status, code, and message.
* **Invalid input (Converter):** Checks `isValidSvgContent` client-side. Server uses Zod validation (`convertSchema`) and `classifySvgError` to catch malformed XML or broken SVGs.
* **Rate Limits:** `checkRateLimit` returns HTTP 429 when abused, utilizing IP or user-based tracking.
* **Guest Limits:** If a guest exceeds 3 conversions, the server returns 429 `limit_reached` and the client pops up a `SignupPromptModal`.

---

# 14. Notifications & User Feedback

* **Toasts:** `react-hot-toast` is used for non-blocking feedback (e.g., "Verification email sent again", or "Conversion failed").
* **Loading indicators:** The `ConverterUI` sets `progress` from 0 to 100 while `converting` is true. Auth buttons switch to "Logging in..." or "Creating account...".
* **Inline Errors:** Form fields turn red and display explicit text below the input if validation fails.

---

# 15. Third-Party Services & Integrations

* **MongoDB:** Primary data store (Users, Sessions, Usage).
* **Upstash Redis:** Rate limiting, queue management, session caching.
* **Firebase:** Client-side authentication UI (Google, GitHub, X OAuth integration).
* **Resend / Nodemailer:** Email delivery for verifications and password resets.
* **Cloudinary:** Likely used for uploading user avatars or storing large SVG assets if required (configured in `.env`).
* **Sentry:** Production error tracking and source map uploads.
* **Vercel Analytics & Speed Insights:** Traffic and web vitals monitoring.

---

# 16. Environment Variables & Configuration

* **Firebase Config:** `NEXT_PUBLIC_FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY` (Used for client auth and server-side token validation).
* **Database:** `MONGODB_URI`, `MONGODB_DB_NAME` (Data persistence).
* **JWT Secrets:** `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (Custom session security).
* **Email:** `RESEND_API_KEY`, `SMTP_HOST`, `SMTP_USER` (Transactional emails).
* **Redis/Queue:** `UPSTASH_REDIS_REST_URL`, `ENABLE_CONVERSION_QUEUE`, `REDIS_URL` (Performance scaling).
* **Monitoring:** `NEXT_PUBLIC_SENTRY_DSN` (Error tracking).
* **App Config:** `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAILS` (Bootstrapping permissions).

---

# 17. Components & Reusable Systems

* **`Button.tsx`:** Shared button primitive with variants and loading states.
* **`ConverterUI.tsx`:** The massive, highly-complex core client component handling local storage, SVG parsing, dropdowns, and API submission.
* **`FAQ.tsx`:** Reusable accordion system.
* **`AuthCard.tsx` / `SignupCard.tsx`:** Standardized auth components sharing exact same validation logic.
* **`api-response.ts`:** Utility backend system for enforcing consistent JSON structures for success/error responses.
* **`auth-context.tsx`:** Global React context wrapping the app to provide session status to any component.

---

# 18. Current User Flows

* **Core Utility Flow (Guest):** Lands on homepage → pastes SVG → tweaks settings → clicks Convert → gets PNG. On 4th attempt → triggered by API 429 response → prompted by Modal to sign up.
* **Authentication Flow:** User clicks Login → chooses Google → Firebase handles OAuth popup → returns token → Next.js API validates token → creates MongoDB user → sets HTTP-only cookie → redirects to homepage as Authed.
* **Support Flow:** Encounters issue → goes to `/support` or `/help` → reads FAQ → clicks contact link → submits form on `/contact-us` → team receives email via Resend.

---

# 19. Current Limitations / Known Issues

* **Functional issues:** None verified, though `ConverterUI` logic relies heavily on `sessionStorage` which is volatile.
* **Architecture/code issues:** The `ConverterUI.tsx` file is nearly 1000 lines long, tightly coupling local state, API logic, SVG parsing, and layout into a single file.
* **Missing functionality:** SVGs that rely heavily on external remote stylesheets or remote fonts may fail to convert properly in `sharp` unless explicitly inlined.

---

# 20. Important Existing Logic

* **Authentication Hybrid:** Do not blindly rely solely on Firebase. Firebase is ONLY used to negotiate the initial social login. The actual application uses custom JWT Bearer tokens and HTTP-only cookies (`crush_refresh_token`). Any new protected API routes MUST check the custom JWT, not Firebase.
* **Guest Limit Logic:** Guests are tracked via the `crush_guest_id` cookie. This logic is deeply embedded in `/api/v1/convert`. Any new premium features must account for both JWT authenticated users AND cookie-identified guests.
* **Worker Queue:** If `ENABLE_CONVERSION_QUEUE=true`, conversions happen asynchronously via BullMQ. Do not write synchronous API logic assuming the conversion happens immediately in the web process if the queue is enabled.
* **Component Reuse:** Auth validation logic is unfortunately duplicated slightly between `AuthCard` and `SignupCard` and `contact-us/page.tsx` (e.g. `isNameInvalid = hasSubmitted && name.length < 3`). Be careful to update all instances if changing validation rules.

---

# 21. Final Complete Feature Checklist

* **Authentication:** ✅ Fully implemented (Custom JWT + Firebase OAuth)
* **User/Profile:** ✅ Fully implemented (MongoDB persistence, tracking conversions)
* **Navigation:** ✅ Fully implemented (Responsive headers/footers)
* **Games:** ❌ Not implemented (Not applicable)
* **Dashboard:** ❌ Not implemented (Users convert directly on the homepage)
* **Settings:** ⚠️ Partially implemented (No complex settings page identified yet)
* **API:** ✅ Fully implemented (RESTful, typed validations, rate-limited)
* **SEO:** ✅ Fully implemented (Custom metadata, OG images, canonical links)
* **Responsive:** ✅ Fully implemented (Tailwind mobile-first approach)
* **Notifications:** ✅ Fully implemented (`react-hot-toast` integration)
* **Admin:** ⚠️ Partially implemented (Role exists, bootstrapped via env, API folder exists)
* **Integrations:** ✅ Fully implemented (Redis, MongoDB, Resend, Sentry)

---

# CRITICAL CONTEXT FOR FUTURE DEVELOPMENT

**1. Authentication Nuance:**
CrushSVG uses a **hybrid authentication architecture**. While Firebase is used on the client to facilitate Google/GitHub logins, the server immediately exchanges the Firebase token for a **custom MongoDB-backed JWT session**. Future API endpoints must be secured using the internal JWT session middleware, NOT Firebase Admin verification.

**2. Rate Limiting & Usage Tracking:**
The platform relies heavily on Upstash Redis for rate limiting (`checkRateLimit`) and tracking anonymous guest conversions via the `crush_guest_id` cookie. If you add new limits or features, ensure you apply the existing `getConversionUsage` and `incrementConversionUsage` utilities so guests don't bypass paywalls.

**3. State Management in the Converter:**
The core tool (`ConverterUI.tsx`) is a massive client component that caches the user's uploaded SVG code in `sessionStorage` (`crush_converter_state`) to survive page reloads. If you modify the converter's state schema, you MUST handle backward compatibility for users who have old formats trapped in their browser's session storage, otherwise the app will crash on mount.

**4. Background Processing:**
SVG to PNG conversion via `sharp` is CPU intensive. The project supports offloading this to a BullMQ worker (`ENABLE_CONVERSION_QUEUE=true`). Any modifications to the conversion logic (`convertSvgQueued`) must remain compatible with being serialized and passed to a Redis background worker. Do not rely on in-memory Node.js state during conversion.
