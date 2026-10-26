'use client';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  createdAt: number;
}

export interface ToastOptions {
  title?: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();
  private recentMessages: Map<string, number> = new Map();

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public add(type: ToastType, message: string, options?: ToastOptions): string {
    const trimmedMsg = message.trim();
    if (!trimmedMsg) return '';

    // Prevent duplicate spam within 1.5 seconds
    const dedupeKey = `${type}:${trimmedMsg}`;
    const now = Date.now();
    const lastTime = this.recentMessages.get(dedupeKey);
    if (lastTime && now - lastTime < 1500) {
      return '';
    }
    this.recentMessages.set(dedupeKey, now);

    const id = `toast-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = options?.duration ?? (type === 'error' ? 5000 : 3500);

    const toast: ToastItem = {
      id,
      type,
      title: options?.title,
      message: trimmedMsg,
      duration,
      createdAt: now,
    };

    // Keep max 5 toasts on screen
    this.toasts = [...this.toasts.slice(-4), toast];
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  public remove(id: string) {
    const initialLen = this.toasts.length;
    this.toasts = this.toasts.filter((t) => t.id !== id);
    if (this.toasts.length !== initialLen) {
      this.notify();
    }
  }

  public clear() {
    this.toasts = [];
    this.notify();
  }
}

const toastManager = new ToastManager();

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    toastManager.add('success', message, options),
  error: (message: string, options?: ToastOptions) =>
    toastManager.add('error', message, options),
  warning: (message: string, options?: ToastOptions) =>
    toastManager.add('warning', message, options),
  info: (message: string, options?: ToastOptions) =>
    toastManager.add('info', message, options),
  dismiss: (id: string) => toastManager.remove(id),
  clear: () => toastManager.clear(),
};

export function subscribeToasts(listener: ToastListener) {
  return toastManager.subscribe(listener);
}
