"use client";

import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://")
    );
  });

  const [isIOS, setIsIOS] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return (
      /iphone|ipad|ipod/.test(userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream
    );
  });

  const [isInstallable, setIsInstallable] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");
    return isIosDevice && !isStandalone;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Listen for beforeinstallprompt on Chromium / Android / Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsModalOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "unsupported" | "ios"> => {
    if (isIOS) {
      setIsModalOpen(true);
      return "ios";
    }

    if (!deferredPrompt) {
      setIsModalOpen(true);
      return "unsupported";
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstallable(false);
        setIsModalOpen(false);
      }
      return choice.outcome;
    } catch (err) {
      console.warn("[CrushSVG] PWA installation prompt error:", err);
      return "dismissed";
    }
  }, [deferredPrompt, isIOS]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isModalOpen,
    openModal,
    closeModal,
    promptInstall,
  };
}
