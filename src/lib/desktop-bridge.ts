"use client";

export interface DesktopBridge {
  setApiKey: (provider: string, value: string) => Promise<void>;
  getApiKey: (provider: string) => Promise<string | null>;
  deleteApiKey: (provider: string) => Promise<boolean>;
  listProviders: () => Promise<Record<string, boolean>>;
  restartServer: () => Promise<{ ok: true } | { ok: false; error: string }>;
  platform: NodeJS.Platform;
}

declare global {
  interface Window {
    desktop?: DesktopBridge;
  }
}

export function getDesktopBridge(): DesktopBridge | null {
  if (typeof window === "undefined") return null;
  return window.desktop ?? null;
}

export function isDesktop(): boolean {
  return getDesktopBridge() !== null;
}
