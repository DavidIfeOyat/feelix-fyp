"use client";

import type { ReactNode } from "react";

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto p-3 sm:p-4">
      <button
        className="fixed inset-0 bg-black/55"
        onClick={onClose}
        aria-label="Close"
        type="button"
      />

      <div className="relative mx-auto my-3 w-full max-w-[920px] sm:my-6">
        <div className="overflow-hidden border-2 border-black bg-[var(--background)] shadow-[6px_6px_0_rgba(17,17,17,0.14)]">
          <div className="flex items-start justify-between gap-3 border-b-2 border-black px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                Feelix modal
              </p>
              <h3 className="mt-2 break-words text-xl font-extrabold uppercase leading-none tracking-[-0.05em] text-[var(--foreground)] sm:text-3xl">
                {title}
              </h3>
            </div>

            <button
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-transparent text-[var(--foreground)] transition hover:bg-black hover:text-[var(--background)]"
              onClick={onClose}
              aria-label="Close"
              type="button"
            >
              <span className="text-lg font-bold">×</span>
            </button>
          </div>

          <div className="max-h-[calc(100dvh-110px)] overflow-y-auto bg-[var(--surface)] p-4 sm:max-h-[calc(100dvh-132px)] sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}