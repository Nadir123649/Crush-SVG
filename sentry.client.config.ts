import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of sessions as replays in production
  replaysSessionSampleRate: 0.1,
  // Capture 100% of sessions that have an error
  replaysOnErrorSampleRate: 1.0,

  // Capture 10% of traces for performance monitoring
  tracesSampleRate: 0.1,

  // Only initialize in production to avoid dev noise
  enabled: process.env.NODE_ENV === "production",

  integrations: [
    Sentry.replayIntegration({
      // Mask sensitive fields in replays
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
});
