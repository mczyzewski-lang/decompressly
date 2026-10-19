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

let confirmClosedAt = 0;

/** True while a confirmation is open or was just closed (focus is still returning to the sheet underneath). */
export function confirmGuardActive(): boolean {
  return !!useUI.getState().confirm || Date.now() - confirmClosedAt < 800;
}

export function askConfirm(title: string, body: string, confirmLabel = "Potwierdzam"): Promise<boolean> {
  return new Promise((resolve) => {
    useUI.setState({
      confirm: {
        title,
        body,
        confirmLabel,
        resolve: (ok) => {
          confirmClosedAt = Date.now();
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
