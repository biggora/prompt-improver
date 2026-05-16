"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Save, Trash2, X } from "lucide-react";
import { getDesktopBridge } from "@/lib/desktop-bridge";
import { AI_PROVIDERS } from "@/lib/constants";

const KEY_PROVIDERS = ["anthropic", "openai", "gemini", "zhipu"] as const;
type KeyProvider = (typeof KEY_PROVIDERS)[number];

interface ApiKeysSettingsProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ApiKeysSettings({
  open,
  onClose,
  onSaved,
}: ApiKeysSettingsProps) {
  const bridge = getDesktopBridge();
  const [values, setValues] = useState<Record<KeyProvider, string>>({
    anthropic: "",
    openai: "",
    gemini: "",
    zhipu: "",
  });
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<KeyProvider, boolean>>({
    anthropic: false,
    openai: false,
    gemini: false,
    zhipu: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || !bridge) return;
    let cancelled = false;
    (async () => {
      try {
        const status = await bridge.listProviders();
        const loadedValues: Record<KeyProvider, string> = {
          anthropic: "",
          openai: "",
          gemini: "",
          zhipu: "",
        };
        for (const p of KEY_PROVIDERS) {
          if (status[p]) {
            const v = await bridge.getApiKey(p);
            loadedValues[p] = v ?? "";
          }
        }
        if (cancelled) return;
        setConfigured(status);
        setValues(loadedValues);
        setLoaded(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, bridge]);

  if (!open) return null;

  if (!bridge) {
    return (
      <Modal onClose={onClose}>
        <h2 className="text-lg font-bold text-foreground mb-2">Settings</h2>
        <p className="text-sm text-muted-foreground">
          API keys management is only available in the desktop app. In the web
          version keys come from environment variables on the server.
        </p>
      </Modal>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      for (const p of KEY_PROVIDERS) {
        await bridge.setApiKey(p, values[p]);
      }
      const result = await bridge.restartServer();
      if (!result.ok) {
        setError(result.error);
        setSaving(false);
        return;
      }
      onSaved?.();
      onClose();
      // Reload renderer so SSR picks up new env on next request
      if (typeof window !== "undefined") {
        setTimeout(() => window.location.reload(), 200);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (provider: KeyProvider) => {
    setSaving(true);
    try {
      await bridge.deleteApiKey(provider);
      setValues((v) => ({ ...v, [provider]: "" }));
      setConfigured((c) => ({ ...c, [provider]: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">API Keys</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Keys are stored in your OS keychain ({bridge.platform}). They are
        injected into the local Next.js server only at startup.
      </p>

      {!loaded ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-6 justify-center">
          <Loader2 size={16} className="animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="space-y-3">
          {KEY_PROVIDERS.map((p) => {
            const meta = AI_PROVIDERS[p];
            return (
              <div key={p} className="bg-muted/30 rounded-xl p-3 border border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    {meta?.name ?? p}
                  </label>
                  {configured[p] && (
                    <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">
                      Configured
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={revealed[p] ? "text" : "password"}
                      value={values[p]}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [p]: e.target.value }))
                      }
                      placeholder={`Enter ${meta?.name ?? p} API key`}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 pr-9 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setRevealed((r) => ({ ...r, [p]: !r[p] }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={revealed[p] ? "Hide" : "Show"}
                    >
                      {revealed[p] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {configured[p] && (
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={saving}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg px-2.5 transition-colors disabled:opacity-50"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-5">
        <button
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium border border-border disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !loaded}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Save &amp; Restart
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
