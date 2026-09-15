"use client";

import React, { useState } from "react";
import { showToast } from "@/lib/client/toast-bridge";
import { apiFetch } from "@/lib/client/http";

export function ChangelogSubscribeForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    try {
      const res = await apiFetch<{ message: string }>("/api/v1/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      showToast("success", res.message || "Subscribed!");
      setEmail("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Subscription failed. Please try again.";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-[480px]">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        aria-label="Email for changelog updates"
        className="flex-1 h-[48px] px-4 rounded-xl border border-[#E2E8F0] bg-white font-body text-[15px] text-[#353A3E] outline-none focus:border-[#D94A1E] transition-colors"
      />
      <button
        type="submit"
        disabled={loading}
        className="h-[48px] px-6 rounded-xl bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-body font-semibold text-[15px] hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer whitespace-nowrap"
      >
        {loading ? "Subscribing..." : "Subscribe"}
      </button>
    </form>
  );
}
