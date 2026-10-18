"use client";

import { create } from "zustand";

interface ConfirmRequest {
  title: string;
  body: string;
  confirmLabel: string;
  resolve: (ok: boolean) => void;
}

interface UIStore {
  confirm: ConfirmRequest | null;
  toast: { id: number; text: string } | null;
}

export const useUI = create<UIStore>(() => ({ confirm: null, toast: null }));

export function askConfirm(title: string, body: string, confirmLabel = "Potwierdzam"): Promise<boolean> {
  return new Promise((resolve) => {
    useUI.setState({
      confirm: {
        title,
        body,
        confirmLabel,
        resolve: (ok) => {
          useUI.setState({ confirm: null });
          resolve(ok);
        },
      },
    });
  });
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;
export function toast(text: string, ms = 2800) {
  const id = Date.now();
  useUI.setState({ toast: { id, text } });
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => useUI.setState({ toast: null }), ms);
}
