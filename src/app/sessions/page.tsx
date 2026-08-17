"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/client/auth-context";
import { listSessions, revokeAllSessions, revokeSession } from "@/lib/client/sessions";
import type { SessionDTO } from "@/lib/shared-types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SessionRow({
  session,
  isCurrent,
  busy,
  onRevoke,
}: {
  session: SessionDTO;
  isCurrent: boolean;
  busy: boolean;
  onRevoke: () => void;
}) {
  return (
    <div className={`flex items-center justify-between gap-[16px] border border-[#F2EDE8] rounded-[12px] px-[20px] py-[16px] bg-white ${isCurrent ? "ring-1 ring-brand-primary/40" : ""}`}>
      <div className="flex items-center gap-[16px] min-w-0">
        <div className="w-[44px] h-[44px] shrink-0 rounded-full bg-gradient-to-br from-[#D94A1E] to-[#FF9A3D] flex items-center justify-center text-white font-body font-semibold text-[16px]">
          {(session.browser ?? "U").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-[8px] flex-wrap">
            <span className="font-body font-medium text-[15px] text-[#353A3E] truncate">
              {[session.browser, session.os].filter(Boolean).join(" · ") || "Unknown device"}
            </span>
            {isCurrent && (
              <span className="rounded-[6px] bg-green-100 text-green-700 font-body font-medium text-[11px] px-[8px] py-[2px]">
                Current session
              </span>
            )}
          </div>
          <p className="font-body font-normal text-[13px] text-[#64748B] truncate">
            {[session.deviceType, session.ip].filter(Boolean).join(" · ")} · Last seen {formatDate(session.lastSeenAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-[16px] shrink-0">
        <span className="font-body font-normal text-[13px] text-[#94A3B8] hidden sm:block">
          {formatDate(session.createdAt)}
        </span>
        {!isCurrent && (
          <button
            type="button"
            disabled={busy}
            onClick={onRevoke}
            className="font-body font-medium text-[13px] text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {busy ? "Revoking…" : "Revoke"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const { user, status, sessionId } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "guest") {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    listSessions()
      .then((res) => {
        if (cancelled) return;
        setSessions(res.sessions);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load sessions.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true };
  }, [status, router]);

  async function handleRevoke(id: string) {
    setRevokingId(id);
    try {
      await revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke session.");
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeAll() {
    setRevokingAll(true);
    try {
      await revokeAllSessions();
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke sessions.");
      setRevokingAll(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="w-full flex justify-center py-[100px]">
        <div className="w-[28px] h-[28px] rounded-full border-[3px] border-[#F2EDE8] border-t-brand-primary animate-spin" />
      </div>
    );
  }

  if (status === "guest") return null;

  return (
    <div className="w-full max-w-[860px] mx-auto px-[24px] py-[60px]">
      <div className="flex items-center justify-between mb-[32px] flex-wrap gap-[16px]">
        <div>
          <h1 className="font-heading font-bold text-[28px] leading-[100%] text-[#353A3E]">Manage sessions</h1>
          <p className="font-body font-normal text-[14px] text-[#64748B] mt-[8px]">
            {user?.displayName ? `Signed in as ${user.displayName} · ` : ""}
            Sessions signed into {user?.email ?? "your account"}.
          </p>
        </div>
        {sessions.length > 1 && !confirmAll && (
          <button
            type="button"
            onClick={() => setConfirmAll(true)}
            className="font-body font-medium text-[14px] text-red-600 hover:text-red-700 hover:underline"
          >
            Sign out all other sessions
          </button>
        )}
        {confirmAll && (
          <div className="flex items-center gap-[12px]">
            <span className="font-body font-normal text-[13px] text-[#64748B]">Sign out of every session?</span>
            <button
              type="button"
              disabled={revokingAll}
              onClick={handleRevokeAll}
              className="font-body font-medium text-[13px] text-white bg-red-600 hover:bg-red-700 rounded-[8px] px-[12px] py-[6px] disabled:opacity-50"
            >
              {revokingAll ? "Signing out…" : "Yes, sign out"}
            </button>
            <button
              type="button"
              disabled={revokingAll}
              onClick={() => setConfirmAll(false)}
              className="font-body font-medium text-[13px] text-[#64748B] hover:underline disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-[8px] border border-red-200 bg-red-50 px-[14px] py-[10px] mb-[20px] font-body text-[13px] leading-[18px] text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="w-full flex justify-center py-[60px]">
          <div className="w-[28px] h-[28px] rounded-full border-[3px] border-[#F2EDE8] border-t-brand-primary animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-[60px]">
          <p className="font-body font-normal text-[15px] text-[#64748B]">No active sessions found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-[12px]">
          {sessions.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              isCurrent={s.id === sessionId}
              busy={revokingId === s.id}
              onRevoke={() => void handleRevoke(s.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
