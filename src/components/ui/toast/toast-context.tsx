/**
 * Toast Context and Provider
 */

"use client";

import { createContext, useContext, useCallback, useState } from "react";
import type { Toast, ToastOptions, ToastVariant } from "./types";

interface ToastContextValue {
  toast: (
    variant: ToastVariant,
    message: string,
    options?: ToastOptions,
  ) => string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback(
    (
      variant: ToastVariant,
      message: string,
      options: ToastOptions = {},
    ): string => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const toast: Toast = {
        id,
        variant,
        message,
        duration: options.duration ?? DEFAULT_DURATION,
        action: options.action,
        dismissible: options.dismissible ?? true,
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev, toast]);

      // Auto-dismiss after duration
      if (toast.duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, toast.duration);
      }

      return id;
    },
    [dismiss],
  );

  const contextValue: ToastContextValue = {
    toast: addToast,
    success: (message, options) => addToast("success", message, options),
    error: (message, options) => addToast("error", message, options),
    warning: (message, options) => addToast("warning", message, options),
    info: (message, options) => addToast("info", message, options),
    dismiss,
    dismissAll,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

/**
 * Toast Container Component
 * Displays all active toasts in a fixed position
 */
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/**
 * Individual Toast Component
 */
function ToastComponent({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300); // Wait for animation
  };

  const variantStyles = {
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    error: "bg-red-500/10 border-red-500/30 text-red-400",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  };

  const variantIcons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div
      className={`
        pointer-events-auto
        ${variantStyles[toast.variant]}
        border rounded-xl p-4 shadow-lg
        animate-in slide-in-from-right-4 fade-in duration-300
        ${isExiting ? "animate-out slide-out-to-right-4 fade-out duration-300" : ""}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="text-lg font-bold flex-shrink-0 mt-0.5">
          {variantIcons[toast.variant]}
        </span>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">{toast.message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick();
                handleDismiss();
              }}
              className="text-sm font-semibold hover:underline"
            >
              {toast.action.label}
            </button>
          )}
          {toast.dismissible && (
            <button
              onClick={handleDismiss}
              className="text-sm opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
