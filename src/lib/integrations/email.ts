import { Resend } from "resend";
import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";

const DEFAULT_FROM = "CrushSVG <onboarding@resend.dev>";

export type EmailTransport = "resend" | "smtp" | "none";

export function resolveFrom(env: NodeJS.ProcessEnv = process.env): string {
  if (env.RESEND_FROM) return env.RESEND_FROM;
  if (env.EMAIL_FROM) return env.EMAIL_FROM;
  if (env.SMTP_USER) return `CrushSVG <${env.SMTP_USER}>`;
  return DEFAULT_FROM;
}

export function resolveTransport(env: NodeJS.ProcessEnv = process.env): EmailTransport {
  if (env.RESEND_API_KEY) return "resend";
  if (env.SMTP_HOST) return "smtp";
  return "none";
}

export function buildVerifyUrl(origin: string, token: string): string {
  return `${origin}/api/v1/verification/email/verify/${token}`;
}

export function buildResetUrl(origin: string, token: string): string {
  return `${origin}/reset-password/${token}`;
}

function smtpTransportOptions(env: NodeJS.ProcessEnv) {
  const port = Number(env.SMTP_PORT ?? 587);
  return {
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  };
}

export interface SendEmailOptions {
  /** Where replies should go (e.g. the person who filled in the contact form). */
  replyTo?: string;
}

export async function sendEmail(to: string, subject: string, html: string, options: SendEmailOptions = {}): Promise<void> {
  const env = process.env;
  const from = resolveFrom(env);
  const transport = resolveTransport(env);
  const startedAt = Date.now();
  const logSend = (event: string, extra = "") => {
    console.log(`[email] ${event} to=${to} subject="${subject}" transport=${transport} took=${Date.now() - startedAt}ms ${extra}`);
  };

  if (env.EMAIL_LOG_ONLY === "true") {
    console.log(`[email:log-only] to=${to} subject="${subject}" (no transport used)`);
    return;
  }

  if (transport === "none" && !env.RESEND_API_KEY && !env.SMTP_HOST) {
    if (env.NODE_ENV === "development") {
      console.log(`[email:dev] to=${to} subject="${subject}" - no SMTP/Resend configured, skipping`);
      return;
    }
    throw new Error(
      "Email is not configured: set RESEND_API_KEY (preferred) or SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS"
    );
  }

  let resendError: Error | null = null;
  if (transport === "resend" || env.RESEND_API_KEY) {
    try {
      let resendFrom = from;
      if (resendFrom.includes("@gmail.com") || resendFrom.includes("@yahoo.com")) {
        resendFrom = env.RESEND_FROM || DEFAULT_FROM;
      }
      const resend = new Resend(env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: resendFrom,
        to,
        subject,
        html,
        ...(options.replyTo ? { replyTo: options.replyTo } : {}),
      });
      if (error) {
        throw new Error(error.message);
      }
      logSend("resend_send", `id=${data?.id}`);
      return;
    } catch (err: any) {
      resendError = err instanceof Error ? err : new Error(String(err));
      logSend("resend_failed", `error=${resendError.message}`);
      if (!env.SMTP_HOST) {
        throw new Error(`Resend send failed: ${resendError.message}`);
      }
      console.warn(`[email] Resend failed, automatically falling back to SMTP: ${resendError.message}`);
    }
  }

  if (transport === "smtp" || env.SMTP_HOST) {
    let smtpFrom = from;
    if (env.SMTP_USER && (smtpFrom.includes("onboarding@resend.dev") || !smtpFrom.includes("@"))) {
      smtpFrom = `CrushSVG <${env.SMTP_USER}>`;
    }
    const transporter = nodemailer.createTransport(smtpTransportOptions(env));
    const mail = { from: smtpFrom, to, subject, html, ...(options.replyTo ? { replyTo: options.replyTo } : {}) };
    try {
      await transporter.sendMail(mail);
      logSend("smtp_send");
      return;
    } catch (firstErr) {
      const port = Number(env.SMTP_PORT ?? 587);
      if (port === 587) {
        try {
          const secureTransporter = nodemailer.createTransport({
            ...smtpTransportOptions(env),
            port: 465,
            secure: true,
          });
          await secureTransporter.sendMail(mail);
          logSend("smtp_send_fallback_port_465");
          return;
        } catch {
          // ignore port 465 fallback error, continue to retry
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        await transporter.sendMail(mail);
        logSend("smtp_send_after_retry");
        return;
      } catch {
        logSend("smtp_send_failed");
        throw resendError || firstErr;
      }
    }
  }

  throw new Error(
    "Email is not configured: set RESEND_API_KEY (preferred) or SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS"
  );
}

import { EMAIL_VERIFICATION_HTML, RESET_PASSWORD_HTML } from "@/emails/html-templates";

function resolveFrontendOrigin(explicitFrontend?: string, url?: string): string {
  if (explicitFrontend) return explicitFrontend.replace(/\/+$/, "");
  if (url) {
    if (url.includes("staging")) return "https://staging.crushsvg.net";
    if (url.includes("crushsvg.net")) return (process.env.NEXT_PUBLIC_APP_URL || "https://crushsvg.net").replace(/\/+$/, "");
    const origin = /^https?:\/\/[^/]+/.exec(url)?.[0];
    if (origin && !origin.includes("api.")) return origin;
  }
  return (process.env.NEXT_PUBLIC_APP_URL || "https://crushsvg.net").replace(/\/+$/, "");
}

function rewriteSiteLinks(html: string, frontendOrigin: string): string {
  return html
    .split("https://www.crushsvg.net").join(frontendOrigin)
    .split("https://crushsvg.net").join(frontendOrigin)
    .split("{{origin}}").join(frontendOrigin);
}

export async function sendVerificationEmail(to: string, url: string, frontendOrigin?: string): Promise<void> {
  const feOrigin = resolveFrontendOrigin(frontendOrigin, url);
  let html = EMAIL_VERIFICATION_HTML;
  html = html.replace(/href="#"/g, `href="${url}"`);
  html = html.replace(/{{first_name}}/g, "there");
  html = rewriteSiteLinks(html, feOrigin);
  await sendEmail(to, "Verify your CrushSVG email", html);
}

export async function sendResetPasswordEmail(to: string, url: string, frontendOrigin?: string): Promise<void> {
  const feOrigin = resolveFrontendOrigin(frontendOrigin, url);
  let html = RESET_PASSWORD_HTML;
  html = html.replace(/href="#"/g, `href="${url}"`);
  html = html.replace(/{{first_name}}/g, "there");
  html = rewriteSiteLinks(html, feOrigin);
  await sendEmail(to, "Reset your CrushSVG password", html);
}
