import { NextRequest } from "next/server";
import { z } from "zod";
import { ContactSubmission, Settings, connectToDatabase } from "@/lib/database/db";
import { resolveTransport, sendEmail } from "@/lib/integrations/email";
import { successResponse, errorResponse } from "@/lib/http/api-response";
import { checkRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const FALLBACK_RECIPIENT = "support@crushsvg.net";
const EMAIL_TIMEOUT_MS = 5_000;
const contactSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(254, "Email is too long"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000, "Message is too long"),
});

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

async function resolveRecipient(): Promise<string> {
  if (process.env.CONTACT_EMAIL_TO) return process.env.CONTACT_EMAIL_TO;
  try {
    const settings = await Settings.findOne().lean();
    if (settings?.supportEmail) return settings.supportEmail;
  } catch (error) {
    console.error("Contact form: could not read support email from settings:", error instanceof Error ? error.name : "unknown error");
  }
  return FALLBACK_RECIPIENT;
}

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, "contact:submit", 5, 60 * 60_000);
  if (!rl.allowed) {
    return errorResponse(429, "rate_limit_exceeded", "Too many messages. Please try again later.", rateLimitHeaders(rl), request);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "invalid_json", "Invalid JSON body", undefined, request);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return errorResponse(400, "validation_error", firstIssue?.message ?? "Please check the contact form fields.", undefined, request, {
      field: typeof firstIssue?.path[0] === "string" ? firstIssue.path[0] : undefined,
    });
  }

  const { name, email, message } = parsed.data;
  try {
    await connectToDatabase();
    const submission = await ContactSubmission.create({ name, email, message, deliveryStatus: "pending" });

    // Keep a durable copy before contacting SMTP/Resend. A mail transport can
    // fail or exceed the response budget without losing the visitor's inquiry.
    if (resolveTransport() === "none" || process.env.EMAIL_LOG_ONLY === "true") {
      console.warn("Contact submission stored; email transport is not configured.");
    } else {
      const to = await resolveRecipient();
      const html = `
        <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#222">
          <h2 style="margin:0 0 12px">New contact form message</h2>
          <p style="margin:0"><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p style="margin:0 0 12px"><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p style="margin:0 0 4px"><strong>Message:</strong></p>
          <div style="white-space:pre-wrap;border-left:3px solid #D94A1E;padding-left:12px">${escapeHtml(message)}</div>
        </div>`;

      const attempt = sendEmail(to, `[CrushSVG Contact] ${singleLine(name)}`, html, { replyTo: email })
        .then(async () => {
          await ContactSubmission.updateOne({ _id: submission._id }, { $set: { deliveryStatus: "sent", deliveryError: undefined } });
          return true;
        })
        .catch(async (error: unknown) => {
          const safeError = error instanceof Error ? error.name.slice(0, 100) : "DeliveryError";
          console.error("Contact form delivery failed; submission retained in database:", safeError);
          await ContactSubmission.updateOne({ _id: submission._id }, { $set: { deliveryStatus: "failed", deliveryError: safeError } }).catch(() => {});
          return false;
        });

      let timeout: ReturnType<typeof setTimeout> | undefined;
      const delivered = await Promise.race([
        attempt,
        new Promise<false>((resolve) => { timeout = setTimeout(() => resolve(false), EMAIL_TIMEOUT_MS); }),
      ]);
      if (timeout) clearTimeout(timeout);
      if (!delivered) console.warn("Contact submission stored; email delivery is pending or failed.");
    }

    return successResponse({ message: "Message received. Our team will get back to you shortly." }, 201, undefined, request);
  } catch (error) {
    console.error("Contact submission could not be stored:", error instanceof Error ? error.name : "unknown error");
    return errorResponse(503, "contact_storage_unavailable", "We could not save your message right now. Please try again shortly.", undefined, request);
  }
}
