"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Alert, AlertProps } from "./Alert";

interface Toast {
  id: string;
  message: string;
  variant: AlertProps["variant"];
  isClosing: boolean;
}

interface ToastContextType {
  addToast: (message: string, variant?: AlertProps["variant"]) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const activeMessages = React.useRef<Set<string>>(new Set());

  const addToast = useCallback((message: string, variant: AlertProps["variant"] = "success") => {
    if (activeMessages.current.has(message)) return;
    
    activeMessages.current.add(message);
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, variant, isClosing: false }]);

    // Auto-remove after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isClosing: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        activeMessages.current.delete(message);
      }, 300); // Wait for transition to finish
    }, 3500);
  }, []);

  const closeToast = (id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, isClosing: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Container perfectly overlapping the navbar in the center */}
      <div className="fixed top-[20px] md:top-[41px] left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-[10px] items-center pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto transition-all duration-300 ease-out origin-top ${
              toast.isClosing ? "opacity-0 scale-95 -translate-y-2" : "opacity-100 scale-100 translate-y-0"
            }`}
          >
            <Alert
              variant={toast.variant}
              message={toast.message}
              onClose={() => closeToast(toast.id)}
              className="shadow-[0px_4px_16px_rgba(0,0,0,0.15)]"
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
