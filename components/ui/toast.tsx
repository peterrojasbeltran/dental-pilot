"use client";

import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";
export type ToastState = { type: ToastType; title: string; description?: string } | null;

export function useToast(timeoutMs = 4200) {
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), timeoutMs);
    return () => window.clearTimeout(timeout);
  }, [toast, timeoutMs]);

  function showToast(type: ToastType, title: string, description?: string) {
    setToast({ type, title, description });
  }

  return { toast, showToast, closeToast: () => setToast(null) };
}

export function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  if (!toast) return null;

  const styles: Record<ToastType, string> = {
    success: "border-emerald-100 bg-emerald-50 text-emerald-800",
    error: "border-red-100 bg-red-50 text-red-800",
    warning: "border-amber-100 bg-amber-50 text-amber-800",
    info: "border-blue-100 bg-blue-50 text-blue-800"
  };

  const iconClass: Record<ToastType, string> = {
    success: "text-emerald-600",
    error: "text-red-600",
    warning: "text-amber-600",
    info: "text-blue-600"
  };

  return (
    <div className="fixed right-4 top-4 z-[80] w-[calc(100%-2rem)] max-w-md sm:right-6 sm:top-6">
      <div className={`rounded-3xl border p-4 shadow-soft ${styles[toast.type]}`}>
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className={`mt-0.5 shrink-0 ${iconClass[toast.type]}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{toast.title}</p>
            {toast.description ? <p className="mt-1 text-sm leading-6 opacity-90">{toast.description}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-full p-1 opacity-70 transition hover:bg-white/60 hover:opacity-100" aria-label="Cerrar notificación">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
