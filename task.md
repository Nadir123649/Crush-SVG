# CrushSVG Extension Task List

## Setup & Database
- `[x]` Install `imagetracerjs` for raster-to-vector tracing. (Used Cloudinary e_vectorize instead as no packages allowed)
- `[x]` Create `ConversionLog` MongoDB model.
- `[x]` Create `AuditLog` MongoDB model.
- `[x]` Update existing conversion flow (`/api/v1/convert`) to log to `ConversionLog`.

## Task 1: Raster to SVG Converter
- `[x]` Create `/api/v1/vectorize` API endpoint with usage tracking and rate limits.
- `[x]` Update `ConverterUI.tsx` to accept a `mode` prop without breaking `svg-to-png`.
- `[x]` Add a raster image uploader/preview component for the new mode.
- `[x]` Implement isolated state management (e.g., `crush_vectorizer_state` in sessionStorage).
- `[x]` Create `/png-to-svg/page.tsx` route.
- `[x]` Add "PNG to SVG" to `Navbar.tsx` and `Header.tsx`.

## Task 2: Admin Dashboard
- `[x]` Ensure Admin Bootstrap logic for initial `abdulraheem55jutt@gmail.com`.
- `[x]` Create `middleware.ts` / server-side protection for `/admin` routes.
- `[x]` Implement `/admin/page.tsx` (Analytics/Dashboard).
- `[x]` Implement `/admin/users/page.tsx` (User Management).
- `[x]` Build reusable Admin Sidebar/Layout components.
- `[x]` Fetch and display actual log data from MongoDB.

## Verification & Testing
- `[ ]` Verify existing SVG → PNG flow works flawlessly.
- `[ ]` Verify new PNG → SVG flow works and limits usage correctly.
- `[ ]` Verify Admin Panel protection and data accuracy.
