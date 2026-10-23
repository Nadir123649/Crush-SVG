"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="font-heading text-xl font-semibold text-text-dark">Something went wrong</h2>
      <p className="font-body text-sm text-text-muted">The admin page could not be displayed.</p>
      <button type="button" onClick={reset} className="rounded-[8px] bg-brand-primary px-4 py-2 font-body text-sm font-medium text-white">
        Try again
      </button>
    </main>
  );
}
