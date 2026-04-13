"use client";

import { useState } from "react";

export default function WatchedFeedbackModal(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (liked: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  if (!props.open) return null;

  async function submit(liked: boolean) {
    setBusy(true);
    try {
      await props.onSubmit(liked);
      props.onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[--radius-xl] border border-white/10 bg-neutral-950 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold">Quick feedback</h2>
            <p className="mt-1 text-sm text-[--color-muted]">
              Did you like <span className="font-semibold text-white">{props.title}</span>?
            </p>
          </div>

          <button
            className="btn btn-ghost"
            type="button"
            onClick={props.onClose}
            disabled={busy}
          >
            Skip
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => submit(true)}
            disabled={busy}
          >
            👍 Liked
          </button>

          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => submit(false)}
            disabled={busy}
          >
            👎 Not for me
          </button>
        </div>

        <p className="mt-3 text-xs text-[--color-muted]">
          This helps improve future recommendations.
        </p>
      </div>
    </div>
  );
}