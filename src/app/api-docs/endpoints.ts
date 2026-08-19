export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface EndpointError {
  status: number;
  code: string;
  description: string;
}

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  title: string;
  description: string;
  auth: "none" | "guest" | "optional" | "bearer" | "cookie";
  rateLimit?: string;
  params?: EndpointParam[];
  curl?: string;
  javascript?: string;
  response?: string;
  errors: EndpointError[];
}

export interface ApiSection {
  title: string;
  description: string;
  endpoints: ApiEndpoint[];
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crush-svg.vercel.app";

const TOKEN_RESPONSE = `{
  "success": true,
  "version": "1.0.0",
  "payload": {
    "user": {
      "uid": "user_01HGX...",
      "email": "jane@example.com",
      "displayName": "Jane Doe",
      "name": "Jane Doe",
      "photoURL": null,
      "providers": ["email"],
      "linkedProviders": [],
      "role": "user",
      "hasPassword": true,
      "isVerified": true,
      "conversionsUsed": 4,
      "createdAt": "2026-01-12T09:30:00.000Z",
      "lastLoginAt": "2026-08-19T10:00:00.000Z"
    },
    "token": {
      "tokenType": "Bearer",
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "accessTokenExpires": 1755600000000,
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshTokenExpires": 1756200000000
    },
    "sessionId": "sess_01HGX...",
    "remember": true
  },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`;

export const apiSections: ApiSection[] = [
  {
    title: "Authentication",
    description:
      "Create an account, sign in, and manage sessions. All protected endpoints require a Bearer access token in the Authorization header. Access tokens expire after 15 minutes — exchange the refresh token (stored in the crushsvg_refresh cookie) for a fresh pair via POST /api/v1/auth/refresh.",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/auth/register",
        title: "Create an account",
        description:
          "Registers a new user and sends a verification email to the provided address. The account must be verified before it can log in. If the email already belongs to a Google/GitHub-only account, the password is linked to that account instead of failing.",
        auth: "none",
        rateLimit: "3 requests / min",
        params: [
          { name: "name", type: "string", required: true, description: "Display name (3–16 characters)." },
          { name: "email", type: "string", required: true, description: "A valid email address." },
          { name: "password", type: "string", required: true, description: "8–20 characters." },
        ],
        curl: `curl -X POST ${BASE_URL}/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "super-secret-123"
}'`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Jane Doe",
    email: "jane@example.com",
    password: "super-secret-123"
  })
});
const data = await res.json();`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": {
    "message": "Registration successful. Please check your email to verify your account."
  },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 400, code: "validation_error", description: "Missing or invalid name, email, or password." },
          { status: 409, code: "account_already_exists", description: "An account with this email already exists." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many registration attempts from this IP." },
        ],
      },
      {
        method: "POST",
        path: "/api/v1/auth/login",
        title: "Sign in",
        description:
          "Authenticates with email and password and returns a token pair plus a session. The refresh token is also set as the crushsvg_refresh cookie. Pass rememberMe: true to keep the session alive for 7 days. Brute-force protection locks the account after repeated failures.",
        auth: "none",
        rateLimit: "10 requests / min",
        params: [
          { name: "email", type: "string", required: true, description: "Registered email address." },
          { name: "password", type: "string", required: true, description: "Account password." },
          { name: "rememberMe", type: "boolean", required: false, description: "Extend session to 7 days. Default: false." },
        ],
        curl: `curl -X POST ${BASE_URL}/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
  "email": "jane@example.com",
  "password": "super-secret-123",
  "rememberMe": true
}'`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "jane@example.com",
    password: "super-secret-123",
    rememberMe: true
  })
});
const data = await res.json();
// Store data.payload.token.accessToken and send it as:
// Authorization: Bearer <accessToken>`,
        response: TOKEN_RESPONSE,
        errors: [
          { status: 400, code: "validation_error", description: "Missing or invalid email or password." },
          { status: 401, code: "invalid_credentials", description: "Email or password is incorrect." },
          { status: 401, code: "email_not_verified", description: "Email not verified yet. Check the inbox for the verification link." },
          { status: 401, code: "social_login_required", description: "This email uses Google/GitHub sign-in. Use OAuth, or reset the password to set one." },
          { status: 429, code: "account_locked", description: "Too many failed attempts. Retry after the Retry-After header." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many login attempts from this IP." },
        ],
      },
      {
        method: "POST",
        path: "/api/v1/auth/logout",
        title: "Sign out",
        description:
          "Revokes the current session and clears the refresh cookie. Returns 200 even when the token is missing or expired, so the client can always treat it as success.",
        auth: "optional",
        curl: `curl -X POST ${BASE_URL}/api/v1/auth/logout \\
  -H "Authorization: Bearer <accessToken>"`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/auth/logout", {
  method: "POST",
  headers: { "Authorization": "Bearer <accessToken>" }
});
const data = await res.json();`,
        response: `{
  "success": true,
  "payload": { "message": "Logged out successfully" }
}`,
        errors: [],
      },
      {
        method: "POST",
        path: "/api/v1/auth/logout-all",
        title: "Sign out of all devices",
        description:
          "Revokes every active session for the current user, clears the session cache, and deletes the refresh cookie.",
        auth: "bearer",
        curl: `curl -X POST ${BASE_URL}/api/v1/auth/logout-all \\
  -H "Authorization: Bearer <accessToken>"`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/auth/logout-all", {
  method: "POST",
  headers: { "Authorization": "Bearer <accessToken>" }
});
const data = await res.json();`,
        response: `{
  "success": true,
  "payload": { "message": "Logged out from all devices" }
}`,
        errors: [
          { status: 401, code: "unauthorized", description: "Missing or invalid access token." },
        ],
      },
      {
        method: "POST",
        path: "/api/v1/auth/refresh",
        title: "Refresh the access token",
        description:
          "Exchanges the refresh token (read from the crushsvg_refresh cookie) for a fresh access/refresh pair. The refresh token is rotated on every call, so old tokens are invalidated. Call this when an endpoint returns 401 with code unauthorized.",
        auth: "cookie",
        rateLimit: "120 requests / min",
        curl: `# The crushsvg_refresh cookie is sent automatically by the browser.
curl -X POST ${BASE_URL}/api/v1/auth/refresh`,
        javascript: `// Same-origin fetch sends the crushsvg_refresh cookie automatically.
const res = await fetch("${BASE_URL}/api/v1/auth/refresh", {
  method: "POST"
});
const data = await res.json();
if (!data.success) {
  // token_missing / token_invalid -> session is dead, redirect to login
}`,
        response: TOKEN_RESPONSE,
        errors: [
          { status: 429, code: "rate_limited", description: "Too many refresh requests from this IP." },
          { status: 401, code: "session_revoked", description: "Refresh token reused after rotation or session revoked." },
          { status: 401, code: "user_not_found", description: "The session's user no longer exists." },
        ],
      },
      {
        method: "POST",
        path: "/api/v1/auth/change-password",
        title: "Change password",
        description:
          "Changes the account password and signs the user out of every device. A new password must differ from the current one.",
        auth: "bearer",
        rateLimit: "5 requests / min",
        params: [
          { name: "currentPassword", type: "string", required: true, description: "The current password." },
          { name: "newPassword", type: "string", required: true, description: "New password, 8–20 characters." },
        ],
        curl: `curl -X POST ${BASE_URL}/api/v1/auth/change-password \\
  -H "Authorization: Bearer <accessToken>" \\
  -H "Content-Type: application/json" \\
  -d '{
  "currentPassword": "super-secret-123",
  "newPassword": "even-more-secret-456"
}'`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/auth/change-password", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <accessToken>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    currentPassword: "super-secret-123",
    newPassword: "even-more-secret-456"
  })
});
const data = await res.json();`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": { "message": "Password changed successfully. Please sign in again." },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 400, code: "validation_error", description: "Missing or invalid current/new password." },
          { status: 400, code: "same_password", description: "The new password matches the current one." },
          { status: 401, code: "unauthorized", description: "Wrong current password (or invalid token)." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many attempts from this IP." },
        ],
      },
      {
        method: "POST",
        path: "/api/v1/oauth/{provider}",
        title: "Sign in with Google, GitHub, or X",
        description:
          "Authenticates using a Firebase ID token obtained from the provider's sign-in flow. The provider segment must match the token's signing provider: google, github, or x.",
        auth: "none",
        rateLimit: "10 requests / min",
        params: [
          { name: "provider", type: "path", required: true, description: "google | github | x" },
          { name: "firebaseToken", type: "string", required: true, description: "Firebase ID token from the provider SDK." },
          { name: "rememberMe", type: "boolean", required: false, description: "Keep session for 7 days. Default: true." },
        ],
        curl: `curl -X POST ${BASE_URL}/api/v1/oauth/google \\
  -H "Content-Type: application/json" \\
  -d '{
  "firebaseToken": "<firebase-id-token>",
  "rememberMe": true
}'`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/oauth/google", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    firebaseToken: "<firebase-id-token>",
    rememberMe: true
  })
});
const data = await res.json();`,
        response: TOKEN_RESPONSE,
        errors: [
          { status: 400, code: "validation_error", description: "Missing firebaseToken." },
          { status: 400, code: "provider_mismatch", description: "Token was signed in with a different provider." },
          { status: 401, code: "invalid_token", description: "Firebase token verification failed." },
          { status: 404, code: "unknown_provider", description: "Only google, github, and x are supported." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many attempts from this IP." },
        ],
      },
    ],
  },
  {
    title: "Passwords & Email Verification",
    description:
      "Account recovery and email verification. Token links are sent by email and expire: 30 minutes for password resets, 24 hours for email verification.",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/passwords/forgot",
        title: "Request a password reset",
        description:
          "Sends a password reset link to the email if an account exists. The response is identical whether or not the account exists, to prevent email enumeration. Works for social-only accounts too (acts as 'set a password').",
        auth: "none",
        rateLimit: "3 requests / min",
        params: [
          { name: "email", type: "string", required: true, description: "Account email address." },
        ],
        curl: `curl -X POST ${BASE_URL}/api/v1/passwords/forgot \\
  -H "Content-Type: application/json" \\
  -d '{ "email": "jane@example.com" }'`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/passwords/forgot", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "jane@example.com" })
});
const data = await res.json();`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": {
    "message": "If an account with that email exists, a reset link has been sent."
  },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 400, code: "validation_error", description: "Missing or invalid email." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many requests from this IP." },
        ],
      },
      {
        method: "GET",
        path: "/api/v1/passwords/reset?token=...",
        title: "Validate a reset token",
        description:
          "Checks whether a password reset token is still valid without consuming it. Useful to show the reset form or an 'expired link' message.",
        auth: "none",
        params: [
          { name: "token", type: "query", required: true, description: "The reset token from the email link." },
        ],
        curl: `curl "${BASE_URL}/api/v1/passwords/reset?token=<reset-token>"`,
        javascript: `const res = await fetch(
  "${BASE_URL}/api/v1/passwords/reset?token=<reset-token>"
);
const data = await res.json();
if (data.payload.valid) {
  // Show the reset form
}`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": { "valid": true },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 400, code: "missing_token", description: "No token query parameter provided." },
        ],
      },
      {
        method: "POST",
        path: "/api/v1/passwords/reset",
        title: "Reset the password",
        description:
          "Consumes the reset token and sets a new password. Also marks the email as verified and revokes all existing sessions.",
        auth: "none",
        rateLimit: "5 requests / min",
        params: [
          { name: "token", type: "string", required: true, description: "The reset token from the email link." },
          { name: "password", type: "string", required: true, description: "New password, 8–20 characters." },
        ],
        curl: `curl -X POST ${BASE_URL}/api/v1/passwords/reset \\
  -H "Content-Type: application/json" \\
  -d '{
  "token": "<reset-token>",
  "password": "brand-new-password-789"
}'`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/passwords/reset", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    token: "<reset-token>",
    password: "brand-new-password-789"
  })
});
const data = await res.json();`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": { "message": "Password changed. Please log in with your new password." },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 400, code: "validation_error", description: "Missing or invalid token/password." },
          { status: 400, code: "same_password", description: "The new password matches the current one." },
          { status: 400, code: "token_invalid", description: "Token is missing, expired, or already consumed." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many requests from this IP." },
        ],
      },
      {
        method: "POST",
        path: "/api/v1/verification/email/resend",
        title: "Resend the verification email",
        description:
          "Re-sends the verification email to an unverified password account. The response is identical whether or not an account exists, to prevent email enumeration.",
        auth: "none",
        rateLimit: "3 requests / min",
        params: [
          { name: "email", type: "string", required: true, description: "Account email address." },
        ],
        curl: `curl -X POST ${BASE_URL}/api/v1/verification/email/resend \\
  -H "Content-Type: application/json" \\
  -d '{ "email": "jane@example.com" }'`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/verification/email/resend", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "jane@example.com" })
});
const data = await res.json();`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": {
    "message": "If the account exists and is unverified, a verification email has been sent."
  },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 400, code: "validation_error", description: "Missing or invalid email." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many requests from this IP." },
        ],
      },
      {
        method: "GET",
        path: "/api/v1/verification/email/verify/{token}",
        title: "Verify an email address",
        description:
          "Consumes the verification token from the email link. With Accept: application/json it returns the verified message; with a browser Accept header it redirects to /verify?status=success and automatically signs the user in.",
        auth: "none",
        params: [
          { name: "token", type: "path", required: true, description: "The verification token from the email." },
        ],
        curl: `curl "${BASE_URL}/api/v1/verification/email/verify/<token>" \\
  -H "Accept: application/json"`,
        javascript: `const res = await fetch(
  "${BASE_URL}/api/v1/verification/email/verify/<token>",
  { headers: { "Accept": "application/json" } }
);
const data = await res.json();`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": { "message": "Email verified. You can now log in." },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 400, code: "token_invalid", description: "Token is missing, expired, or already used." },
        ],
      },
    ],
  },
  {
    title: "Conversion",
    description:
      "Convert SVG to pixel-perfect PNG, either by sending the SVG source directly or uploading a file. Users get unlimited conversions; guests get 3 conversions per 10-minute window.",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/convert",
        title: "Convert SVG to PNG (JSON)",
        description:
          "Converts an SVG string to a PNG and returns it as base64. Authenticated users are unlimited; guests are limited to 3 conversions per 10 minutes. Append ?download=1 or send Accept: application/octet-stream to receive the raw PNG binary instead of JSON. A max of 4000×4000 output pixels is enforced.",
        auth: "optional",
        rateLimit: "30 requests / min",
        params: [
          { name: "svg", type: "string", required: true, description: "The SVG source code (max 5 MB)." },
          { name: "width", type: "number", required: false, description: "Output width in px (1–4000). Uses the SVG intrinsic size if omitted." },
          { name: "height", type: "number", required: false, description: "Output height in px (1–4000)." },
          { name: "scale", type: "number", required: false, description: "Scale factor (0.1–16). Default: 2." },
          { name: "transparent", type: "boolean", required: false, description: "Keep transparency. Default: true." },
          { name: "quality", type: "number", required: false, description: "PNG compression effort (1–100). Default: 90." },
        ],
        curl: `curl -X POST ${BASE_URL}/api/v1/convert \\
  -H "Authorization: Bearer <accessToken>" \\
  -H "Content-Type: application/json" \\
  -d '{
  "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 100 100\\"><circle cx=\\"50\\" cy=\\"50\\" r=\\"40\\" fill=\\"#D94A1E\\"/></svg>",
  "width": 512,
  "transparent": true
}'`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/convert", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <accessToken>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#D94A1E"/></svg>',
    width: 512,
    transparent: true
  })
});
const data = await res.json();
// data.payload.data is the base64 PNG — decode it:
const png = "data:image/png;base64," + data.payload.data;`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": {
    "data": "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0k...",
    "mimeType": "image/png",
    "size": 1423,
    "format": "png",
    "width": 512,
    "height": 512,
    "warnings": [],
    "conversionsUsed": 5,
    "remaining": null
  },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 400, code: "invalid_json", description: "Request body is not valid JSON." },
          { status: 400, code: "validation_error", description: "Missing svg or invalid width/height/scale/quality." },
          { status: 401, code: "unauthorized", description: "Bearer token present but invalid — never downgraded to guest." },
          { status: 422, code: "svg_too_large", description: "SVG exceeds 5 MB or the 50 MP render budget." },
          { status: 422, code: "invalid_svg", description: "SVG failed parse or security validation." },
          { status: 422, code: "svg_font_error", description: "SVG references fonts that cannot be rendered." },
          { status: 422, code: "svg_too_complex", description: "SVG exceeds complexity limits." },
          { status: 429, code: "limit_reached", description: "Guest conversion budget (3 / 10 min) exhausted." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many requests from this IP." },
          { status: 500, code: "conversion_failed", description: "Unexpected conversion error." },
          { status: 503, code: "conversion_timed_out", description: "Conversion exceeded the time budget." },
        ],
      },
      {
        method: "POST",
        path: "/api/v1/convert?download=1",
        title: "Convert SVG to PNG (binary download)",
        description:
          "Same conversion as above, but returns the raw PNG binary with a Content-Disposition attachment header — ideal for direct file downloads. Usage counters are returned in the X-Conversions-Used and X-Conversions-Remaining headers.",
        auth: "optional",
        rateLimit: "30 requests / min",
        params: [
          { name: "svg", type: "string", required: true, description: "The SVG source code (max 5 MB)." },
        ],
        curl: `curl -X POST "${BASE_URL}/api/v1/convert?download=1" \\
  -H "Content-Type: application/json" \\
  --output crushsvg.png \\
  -d '{
  "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 100 100\\"><circle cx=\\"50\\" cy=\\"50\\" r=\\"40\\" fill=\\"#D94A1E\\"/></svg>"
}'`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/convert?download=1", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#D94A1E"/></svg>'
  })
});
const blob = await res.blob();
const url = URL.createObjectURL(blob);
// Link: <a href={url} download="crushsvg.png">`,
        response: `Content-Type: image/png
Content-Disposition: attachment; filename="crushsvg-20260819.png"
Content-Length: 1423
X-Conversions-Used: 1
X-Conversions-Remaining: 2

<binary PNG data>`,
        errors: [
          { status: 400, code: "validation_error", description: "Missing svg." },
          { status: 422, code: "invalid_svg", description: "SVG failed parse or security validation." },
          { status: 429, code: "limit_reached", description: "Guest conversion budget (3 / 10 min) exhausted." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many requests from this IP." },
          { status: 500, code: "conversion_failed", description: "Unexpected conversion error." },
        ],
      },
      {
        method: "POST",
        path: "/api/v1/uploads",
        title: "Convert an uploaded SVG file",
        description:
          "Uploads an SVG file (multipart/form-data) and returns a Cloudinary URL of the converted PNG. Optional width, scale, and transparent fields customize the output. PNG/JPEG/WebP uploads are also accepted for authenticated users but are stored as-is, not converted.",
        auth: "optional",
        rateLimit: "30 requests / min",
        params: [
          { name: "file", type: "file", required: true, description: "SVG (≤10 MB). PNG/JPEG/WebP allowed for authenticated users." },
          { name: "width", type: "number", required: false, description: "Output width in px (1–4000). SVG uploads only." },
          { name: "scale", type: "number", required: false, description: "Scale factor (0.1–16). Default: 2. SVG uploads only." },
          { name: "transparent", type: "boolean", required: false, description: "Keep transparency. Default: true. SVG uploads only." },
        ],
        curl: `curl -X POST ${BASE_URL}/api/v1/uploads \\
  -H "Authorization: Bearer <accessToken>" \\
  -F "file=@logo.svg" \\
  -F "width=512" \\
  -F "transparent=true"`,
        javascript: `const form = new FormData();
form.append("file", fileInput.files[0]);
form.append("width", "512");

const res = await fetch("${BASE_URL}/api/v1/uploads", {
  method: "POST",
  headers: { "Authorization": "Bearer <accessToken>" },
  body: form
});
const data = await res.json();
// data.payload.url is a hosted PNG URL`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": {
    "url": "https://res.cloudinary.com/.../crushsvg/uploads/logo.png",
    "publicId": "crushsvg/uploads/logo",
    "width": 512,
    "height": 512,
    "size": 1423,
    "format": "png",
    "warnings": [],
    "conversionsUsed": 1,
    "remaining": 2
  },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 400, code: "invalid_upload", description: "Malformed multipart request." },
          { status: 400, code: "validation_error", description: "Invalid width/scale/transparent values." },
          { status: 401, code: "unauthorized", description: "Missing/invalid token (required for PNG/JPEG/WebP uploads)." },
          { status: 422, code: "invalid_svg", description: "SVG failed parse or security validation." },
          { status: 429, code: "limit_reached", description: "Guest conversion budget (3 / 10 min) exhausted." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many requests from this IP." },
          { status: 500, code: "upload_failed", description: "Cloudinary upload failed." },
        ],
      },
      {
        method: "GET",
        path: "/api/v1/conversions",
        title: "Conversion history",
        description:
          "Returns the user's conversion usage. Note: individual conversion records are currently not stored, so data is always an empty array — use this endpoint for the usage count and pagination metadata.",
        auth: "bearer",
        rateLimit: "30 requests / min",
        params: [
          { name: "page", type: "query", required: false, description: "Page number, 1-based. Default: 1." },
          { name: "limit", type: "query", required: false, description: "Items per page (1–100). Default: 20." },
          { name: "sort", type: "query", required: false, description: "createdAt or -createdAt. Default: -createdAt." },
        ],
        curl: `curl "${BASE_URL}/api/v1/conversions?page=1&limit=20" \\
  -H "Authorization: Bearer <accessToken>"`,
        javascript: `const res = await fetch(
  "${BASE_URL}/api/v1/conversions?page=1&limit=20",
  { headers: { "Authorization": "Bearer <accessToken>" } }
);
const data = await res.json();`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": {
    "data": [],
    "meta": {
      "total": 0,
      "page": 1,
      "per_page": 20,
      "total_pages": 0,
      "has_next": false,
      "has_prev": false
    },
    "links": {
      "self": "/api/v1/conversions?page=1&limit=20",
      "first": "/api/v1/conversions?page=1&limit=20",
      "last": null,
      "prev": null,
      "next": null
    },
    "usage": { "conversionsUsed": 5, "isUnlimited": true },
    "message": "OK"
  },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 400, code: "validation_error", description: "Invalid page, limit, or sort values." },
          { status: 401, code: "unauthorized", description: "Missing or invalid access token." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many requests from this IP." },
        ],
      },
    ],
  },
  {
    title: "Validation & Usage",
    description:
      "Validate SVG sources before conversion and check remaining quota.",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/svg/validate",
        title: "Validate an SVG",
        description:
          "Runs the same security and parse checks used by /api/v1/convert. Rejects scripts, event handlers, javascript:/data:/vbscript: URIs, unbalanced tags, missing namespace, and oversized input — useful for pre-flight validation in client UIs.",
        auth: "none",
        rateLimit: "30 requests / min",
        params: [
          { name: "svg", type: "string", required: true, description: "The SVG source to validate." },
        ],
        curl: `curl -X POST ${BASE_URL}/api/v1/svg/validate \\
  -H "Content-Type: application/json" \\
  -d '{
  "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 100 100\\"><circle cx=\\"50\\" cy=\\"50\\" r=\\"40\\"/></svg>"
}'`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/svg/validate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>'
  })
});
const data = await res.json();`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": { "valid": true, "message": "SVG is valid" },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 400, code: "validation_error", description: "Missing svg field." },
          { status: 422, code: "invalid_svg", description: "SVG is empty, malformed, too large, or contains blocked patterns." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many requests from this IP." },
        ],
      },
      {
        method: "GET",
        path: "/api/v1/usage",
        title: "Check conversion usage",
        description:
          "Returns the current conversion count and remaining quota. With a Bearer token it reports the user's (unlimited) usage; without one it reports the guest budget (3 per 10 minutes) for the gid cookie.",
        auth: "optional",
        rateLimit: "120 requests / min",
        curl: `# As a signed-in user:
curl "${BASE_URL}/api/v1/usage" \\
  -H "Authorization: Bearer <accessToken>"

# As a guest:
curl "${BASE_URL}/api/v1/usage"`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/usage", {
  headers: { "Authorization": "Bearer <accessToken>" }
});
const data = await res.json();`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": {
    "conversionsUsed": 5,
    "remaining": null,
    "isUnlimited": true
  },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 401, code: "unauthorized", description: "Bearer token present but invalid." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many requests from this IP." },
        ],
      },
      {
        method: "POST",
        path: "/api/v1/usage",
        title: "Track a conversion",
        description:
          "Increments the conversion counter. Authenticated requests increment the user's lifetime count; guest requests increment the 10-minute window count. Guests without a gid cookie receive one in the response.",
        auth: "optional",
        rateLimit: "60 requests / min",
        params: [
          { name: "guestId", type: "string", required: false, description: "Guest identifier from the gid cookie." },
          { name: "isAuthenticated", type: "boolean", required: false, description: "Force the authenticated path." },
        ],
        curl: `curl -X POST ${BASE_URL}/api/v1/usage \\
  -H "Authorization: Bearer <accessToken>" \\
  -H "Content-Type: application/json" \\
  -d '{}'`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/usage", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <accessToken>",
    "Content-Type": "application/json"
  },
  body: "{}"
});
const data = await res.json();`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": {
    "conversionsUsed": 6,
    "remaining": null,
    "isUnlimited": true
  },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 401, code: "unauthorized", description: "Bearer token present but invalid." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many requests from this IP." },
        ],
      },
    ],
  },
  {
    title: "Account & Profile",
    description:
      "Read and manage the signed-in user's profile. All endpoints require a Bearer access token.",
    endpoints: [
      {
        method: "GET",
        path: "/api/me",
        title: "Current user",
        description:
          "Returns the authenticated user's profile. This is the lightweight session probe used by the web app — the response is a raw user object rather than the standard envelope.",
        auth: "bearer",
        curl: `curl ${BASE_URL}/api/me \\
  -H "Authorization: Bearer <accessToken>"`,
        javascript: `const res = await fetch("${BASE_URL}/api/me", {
  headers: { "Authorization": "Bearer <accessToken>" }
});
const user = await res.json(); // { user: { ... } }`,
        response: `{
  "user": {
    "uid": "user_01HGX...",
    "email": "jane@example.com",
    "displayName": "Jane Doe",
    "name": "Jane Doe",
    "photoURL": null,
    "providers": ["email"],
    "linkedProviders": [],
    "role": "user",
    "hasPassword": true,
    "isVerified": true,
    "conversionsUsed": 5,
    "createdAt": "2026-01-12T09:30:00.000Z",
    "lastLoginAt": "2026-08-19T10:00:00.000Z"
  }
}`,
        errors: [
          { status: 401, code: "unauthorized", description: "Missing, invalid, or revoked access token." },
          { status: 404, code: "user_not_found", description: "The session's user no longer exists." },
        ],
      },
      {
        method: "GET",
        path: "/api/v1/profile",
        title: "Get profile",
        description:
          "Returns the authenticated user's profile in the standard response envelope.",
        auth: "bearer",
        rateLimit: "60 requests / min",
        curl: `curl ${BASE_URL}/api/v1/profile \\
  -H "Authorization: Bearer <accessToken>"`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/profile", {
  headers: { "Authorization": "Bearer <accessToken>" }
});
const data = await res.json();`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": {
    "user": {
      "uid": "user_01HGX...",
      "email": "jane@example.com",
      "displayName": "Jane Doe",
      "name": "Jane Doe",
      "photoURL": null,
      "providers": ["email"],
      "linkedProviders": [],
      "role": "user",
      "hasPassword": true,
      "isVerified": true,
      "conversionsUsed": 5,
      "createdAt": "2026-01-12T09:30:00.000Z",
      "lastLoginAt": "2026-08-19T10:00:00.000Z"
    }
  },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 401, code: "unauthorized", description: "Missing or invalid access token." },
          { status: 404, code: "user_not_found", description: "User no longer exists." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many requests from this IP." },
        ],
      },
      {
        method: "PATCH",
        path: "/api/v1/profile",
        title: "Update profile",
        description:
          "Updates the display name and/or the full name. At least one field must be provided.",
        auth: "bearer",
        rateLimit: "20 requests / min",
        params: [
          { name: "displayName", type: "string", required: false, description: "New display name (3–16 characters)." },
          { name: "name", type: "string", required: false, description: "New full name (3–16 characters)." },
        ],
        curl: `curl -X PATCH ${BASE_URL}/api/v1/profile \\
  -H "Authorization: Bearer <accessToken>" \\
  -H "Content-Type: application/json" \\
  -d '{ "displayName": "Jane D." }'`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/profile", {
  method: "PATCH",
  headers: {
    "Authorization": "Bearer <accessToken>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ displayName: "Jane D." })
});
const data = await res.json();`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": {
    "user": {
      "uid": "user_01HGX...",
      "email": "jane@example.com",
      "displayName": "Jane D.",
      "name": "Jane Doe",
      "photoURL": null,
      "providers": ["email"],
      "linkedProviders": [],
      "role": "user",
      "hasPassword": true,
      "isVerified": true,
      "conversionsUsed": 5,
      "createdAt": "2026-01-12T09:30:00.000Z",
      "lastLoginAt": "2026-08-19T10:00:00.000Z"
    }
  },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 400, code: "validation_error", description: "Invalid or empty update fields." },
          { status: 401, code: "unauthorized", description: "Missing or invalid access token." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many requests from this IP." },
        ],
      },
      {
        method: "DELETE",
        path: "/api/v1/profile",
        title: "Delete account",
        description:
          "Permanently deletes the account. The password must be re-supplied to confirm. Revokes all sessions and clears the refresh cookie.",
        auth: "bearer",
        rateLimit: "5 requests / min",
        params: [
          { name: "password", type: "string", required: true, description: "Current account password (re-authentication)." },
        ],
        curl: `curl -X DELETE ${BASE_URL}/api/v1/profile \\
  -H "Authorization: Bearer <accessToken>" \\
  -H "Content-Type: application/json" \\
  -d '{ "password": "super-secret-123" }'`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/profile", {
  method: "DELETE",
  headers: {
    "Authorization": "Bearer <accessToken>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ password: "super-secret-123" })
});
const data = await res.json();`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": { "message": "Account deleted successfully" },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [
          { status: 400, code: "validation_error", description: "Missing password." },
          { status: 401, code: "unauthorized", description: "Wrong password (or invalid token)." },
          { status: 429, code: "rate_limit_exceeded", description: "Too many requests from this IP." },
        ],
      },
    ],
  },
  {
    title: "System",
    description: "Health checks and public endpoint metadata.",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/health",
        title: "Health check",
        description:
          "Reports API and database health. Returns 200 with status healthy when the database responds, or 503 with status degraded when it doesn't.",
        auth: "none",
        curl: `curl ${BASE_URL}/api/v1/health`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/health");
const data = await res.json();`,
        response: `{
  "status": "healthy",
  "timestamp": "2026-08-19T10:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": { "status": "ok", "latencyMs": 12 }
  }
}`,
        errors: [
          { status: 503, code: "degraded", description: "Database is unreachable or slow." },
        ],
      },
      {
        method: "GET",
        path: "/api/v1/convert",
        title: "Conversion metadata",
        description:
          "Returns supported formats and output limits — a handy discovery endpoint for building converter UIs.",
        auth: "none",
        curl: `curl ${BASE_URL}/api/v1/convert`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/convert");
const data = await res.json();`,
        response: `{
  "success": true,
  "version": "1.0.0",
  "payload": {
    "message": "SVG to PNG conversion API",
    "formats": ["png"],
    "maxOutputSize": 4000,
    "example": { "svg": "<svg ...>", "width": 512 }
  },
  "serverTimestamp": "2026-08-19T10:00:00.000Z"
}`,
        errors: [],
      },
      {
        method: "GET",
        path: "/api/v1/svg/validate",
        title: "SVG validation metadata",
        description:
          "Usage hint for the SVG validation endpoint.",
        auth: "none",
        curl: `curl ${BASE_URL}/api/v1/svg/validate`,
        javascript: `const res = await fetch("${BASE_URL}/api/v1/svg/validate");
const data = await res.json();`,
        response: `{
  "message": "POST an SVG string to validate it",
  "example": { "svg": "<svg ...>" }
}`,
        errors: [],
      },
    ],
  },
];

export const rateLimitTable = [
  { endpoint: "POST /api/v1/auth/login", limit: "10 / min" },
  { endpoint: "POST /api/v1/auth/register", limit: "3 / min" },
  { endpoint: "POST /api/v1/auth/refresh", limit: "120 / min" },
  { endpoint: "POST /api/v1/auth/change-password", limit: "5 / min" },
  { endpoint: "POST /api/v1/oauth/{provider}", limit: "10 / min" },
  { endpoint: "POST /api/v1/passwords/forgot", limit: "3 / min" },
  { endpoint: "POST /api/v1/passwords/reset", limit: "5 / min" },
  { endpoint: "POST /api/v1/verification/email/resend", limit: "3 / min" },
  { endpoint: "POST /api/v1/convert", limit: "30 / min" },
  { endpoint: "POST /api/v1/uploads", limit: "30 / min" },
  { endpoint: "GET /api/v1/conversions", limit: "30 / min" },
  { endpoint: "POST /api/v1/svg/validate", limit: "30 / min" },
  { endpoint: "GET /api/v1/usage", limit: "120 / min" },
  { endpoint: "POST /api/v1/usage", limit: "60 / min" },
  { endpoint: "GET /api/v1/profile", limit: "60 / min" },
  { endpoint: "PATCH /api/v1/profile", limit: "20 / min" },
  { endpoint: "DELETE /api/v1/profile", limit: "5 / min" },
];

export const errorCodeTable = [
  { code: "validation_error", status: 400, description: "A request field failed validation." },
  { code: "invalid_json", status: 400, description: "Request body is not valid JSON." },
  { code: "invalid_credentials", status: 401, description: "Wrong email or password." },
  { code: "email_not_verified", status: 401, description: "Email not verified yet." },
  { code: "social_login_required", status: 401, description: "Account uses Google/GitHub — reset the password to set one." },
  { code: "unauthorized", status: 401, description: "Missing, invalid, or expired access token." },
  { code: "session_revoked", status: 401, description: "Session was revoked or a rotated token was reused." },
  { code: "forbidden", status: 403, description: "Insufficient role (admin-only routes)." },
  { code: "unknown_provider", status: 404, description: "Unsupported OAuth provider." },
  { code: "account_already_exists", status: 409, description: "Email is already registered." },
  { code: "invalid_svg", status: 422, description: "SVG failed parse or security checks." },
  { code: "svg_too_large", status: 422, description: "SVG exceeds 5 MB or the 50 MP render budget." },
  { code: "svg_font_error", status: 422, description: "SVG references an unrenderable font." },
  { code: "svg_too_complex", status: 422, description: "SVG exceeds complexity limits." },
  { code: "rate_limit_exceeded", status: 429, description: "Per-IP rate limit hit. Check Retry-After." },
  { code: "rate_limited", status: 429, description: "Rate limit hit (refresh endpoint)." },
  { code: "account_locked", status: 429, description: "Login locked after repeated failures." },
  { code: "limit_reached", status: 429, description: "Guest quota (3 / 10 min) exhausted — sign in to continue." },
  { code: "conversion_failed", status: 500, description: "Unexpected conversion error." },
  { code: "conversion_timed_out", status: 503, description: "Conversion exceeded the time budget." },
  { code: "upload_failed", status: 500, description: "File hosting upload failed." },
  { code: "degraded", status: 503, description: "Service degraded (health check)." },
];