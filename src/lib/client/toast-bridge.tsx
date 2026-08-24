import toast from "react-hot-toast"

export type ToastKind = "success" | "error" | "info"

type ToastEmitter = (kind: ToastKind, message: string) => void

let emitter: ToastEmitter | null = null
let activeToastId: string | null = null
let lastMessage: string | null = null
let lastShownAt = 0

const DEDUPE_WINDOW_MS = 2000

export function setToastEmitter(fn: ToastEmitter | null) {
  emitter = fn
}

export function emitToast(kind: ToastKind, message: string) {
  if (emitter) {
    emitter(kind, message)
  }
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#475569" strokeWidth="2" />
      <path d="M12 11.25v5" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="7.75" r="1.25" fill="#475569" />
    </svg>
  );
}

// Rate-limited toast: only one toast is visible at a time (the previous one is
// dismissed before showing the next) and identical messages fired within the
// dedupe window are swallowed to avoid spam.
export function showToast(kind: ToastKind, message: string) {
  const now = Date.now()
  if (message === lastMessage && now - lastShownAt < DEDUPE_WINDOW_MS) return

  if (activeToastId) {
    toast.dismiss(activeToastId)
  }

  const id =
    kind === "success"
      ? toast.success(message)
      : kind === "error"
        ? toast.error(message)
        : toast(message, { icon: <InfoIcon /> })

  activeToastId = id
  lastMessage = message
  lastShownAt = now
}

export function defaultToastEmitter(kind: ToastKind, message: string) {
  showToast(kind, message)
}
