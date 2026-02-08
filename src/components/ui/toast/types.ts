/**
 * Toast Types and Interfaces
 */

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
}

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  duration: number;
  action?: ToastAction;
  dismissible: boolean;
  createdAt: number;
}
