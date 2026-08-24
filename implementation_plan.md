# Goal Description

Implement two major new capabilities into the existing CrushSVG platform:
1. **PNG/JPG/JPEG to SVG Converter**: A new additive conversion mode allowing users to upload raster images and convert them into scalable vectors, accessible via a new `/png-to-svg` route. The existing SVG → PNG converter will be strictly preserved without regressions.
2. **Admin Dashboard**: A secure, comprehensive administrative panel located at `/admin`, protected by the existing custom JWT authentication. It will include analytics, user management, conversion tracking, audit logs, and settings.

## User Review Required

### 1. Vectorization Implementation Strategy (Raster → SVG)
Since `sharp` cannot perform raster-to-vector tracing, we must introduce a library or external service for the `/png-to-svg` mode. I propose adding `imagetracerjs` (a pure Javascript library) for full-color tracing, or `potrace` for fast monochrome tracing. Since the prompt advises avoiding huge unnecessary dependencies but requires a "proper vectorization pipeline", I recommend using `imagetracerjs` wrapped in a new server-side API (`/api/v1/vectorize`). 
* **Do you approve of using `imagetracerjs` (which runs fully server-side and requires no external API keys) for the vectorization engine?**

### 2. Analytics Tracking (Database Addition)
The current database models (`User` and `GuestUsage`) only track a raw counter of total `conversionsUsed`. They do not track individual conversion events (time, success/fail status, format). To provide the requested historical charts (Daily/Weekly conversions) in the Admin Panel without inventing fake data, I will need to introduce a minimal, privacy-conscious `ConversionLog` MongoDB collection.
* **Do you approve the addition of a `ConversionLog` collection?**

## Proposed Changes

---

### Shared UI / Layout Updates
* **Navigation Links:** Add "PNG to SVG" and (conditionally if admin) "Admin" links to `Header.tsx` and `Navbar.tsx`.

---

### Task 1: PNG to SVG Converter

#### [NEW] `src/app/png-to-svg/page.tsx`
* Create a dedicated route matching the SEO and layout wrapper of the homepage, but passing a mode identifier to the converter component.

#### [MODIFY] `src/components/sections/ConverterUI.tsx`
* **Crucial Rule:** The existing SVG → PNG logic remains locked and 100% intact.
* Introduce a `mode` prop (defaulting to `"svg-to-png"`).
* If `mode === "raster-to-svg"`, the code editor is hidden and replaced by a Drag & Drop Raster Image Uploader (supporting PNG/JPG/JPEG).
* State (like `svgCode` vs `rasterFile`) will be strictly separated. Persisted session storage will use a new key (`crush_vectorizer_state`) to prevent state leakage between modes.
* The "Convert" button will point to a new API endpoint.

#### [NEW] `src/app/api/v1/vectorize/route.ts`
* A new API endpoint strictly handling Raster → SVG conversion.
* Inherits the exact same rate-limiting and guest usage constraints as `/api/v1/convert`.
* Will utilize the chosen tracing library (e.g. `imagetracerjs`) to return a valid SVG string.

---

### Task 2: Admin Dashboard

#### [NEW] `src/lib/database/models/conversion-log.ts` & `audit-log.ts`
* `ConversionLog`: Tracks `{ userId?, guestId?, formatIn, formatOut, success, createdAt }`. Does NOT store image data.
* `AuditLog`: Tracks `{ adminId, action, target, metadata, createdAt }`.

#### [MODIFY] `src/lib/usage/conversion-usage.ts` & `/api/v1/convert/route.ts`
* Update the conversion pipeline to record an entry in `ConversionLog` upon success or failure, enabling historical analytics.

#### [NEW] `src/components/admin/AdminLayout.tsx` & Reusable Components
* Create a persistent sidebar layout (collapsible on mobile).
* Create highly reusable components: `StatCard`, `DataTable`, `ChartCard` (using Recharts or similar minimal charting lib if approved, or native CSS bar charts), `AdminGuard` (HOC for role verification).

#### [NEW] `src/app/admin/*` (Routes)
* `/admin/login`: Secure login page utilizing existing auth components. If already logged in as admin, redirects to dashboard.
* `/admin`: Overview dashboard (KPIs and charts).
* `/admin/users` & `/admin/users/[id]`: Paginated user list and detail views (with secure actions to change roles).
* `/admin/conversions`: Paginated history of conversions.
* `/admin/activity`: Audit log table.
* `/admin/settings`: Admin profile and change-password functionality.

#### [NEW] `src/app/api/v1/admin/*` (Endpoints)
* Strict middleware/guard verifying `user.role === 'admin'`.
* `/api/v1/admin/analytics`: Aggregates MongoDB data for charts.
* `/api/v1/admin/users`: Fetch/update users.
* `/api/v1/admin/audit`: Fetch audit logs.

#### [MODIFY] `src/lib/auth/auth.ts` / Env Config
* Ensure the initial admin `abdulraheem55jutt@gmail.com` is properly bootstrapped upon first login if specified in `ADMIN_EMAILS`. 
* Will enforce a "password change required" flag if logging in with a default bootstrapped password, or rely on normal signup + auto-promotion via the env var.

## Verification Plan

### Automated/Manual Verification
1. **Regression Test:** Execute full manual flow for SVG → PNG (Upload, Paste, Scale, Download) to guarantee ZERO changes in behavior.
2. **New Mode Test:** Upload a PNG to `/png-to-svg`, ensure vectorization works, verify progress indicators, and confirm it properly increments the user/guest usage limits.
3. **State Leakage Test:** Switch back and forth between `/` and `/png-to-svg` to ensure inputs/previews do not bleed into each other.
4. **Admin Protection Test:** Attempt to access `/admin/users` as a standard user and guest; verify a strict 403/Redirect response.
5. **Admin Operations Test:** Log in as admin, view generated analytics charts, browse users, and test changing a password securely.
