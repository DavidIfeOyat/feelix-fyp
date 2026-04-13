"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type MovieRef = {
  tmdbId: number;
  title: string;
  poster: string | null;
  genreIds: number[];
};

const MAX_PLANNED_WATCHES = 6;

function dateInputValue(daysAhead = 2) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

export function ScheduleWatchModal(props: {
  open: boolean;
  userId: string;
  movie: MovieRef | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const { open, userId, movie, onClose, onSaved } = props;
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [plannedFor, setPlannedFor] = useState(dateInputValue(2));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPlannedFor(dateInputValue(2));
    setErr(null);
  }, [open, movie?.tmdbId]);

  async function savePlan() {
    if (!movie) return;

    setBusy(true);
    setErr(null);

    try {
      const { data: existingRows, error: existingErr } = await supabase
        .from("planned_watches")
        .select("external_id")
        .eq("user_id", userId);

      if (existingErr) throw existingErr;

      const rows = Array.isArray(existingRows) ? existingRows : [];
      const alreadyExists = rows.some((row: any) => String(row?.external_id ?? "") === String(movie.tmdbId));

      if (!alreadyExists && rows.length >= MAX_PLANNED_WATCHES) {
        throw new Error(`You can only keep ${MAX_PLANNED_WATCHES} planned watches at a time.`);
      }

      const { error } = await supabase.from("planned_watches").upsert(
        {
          user_id: userId,
          external_id: String(movie.tmdbId),
          title: movie.title,
          poster: movie.poster ?? "/placeholder.svg",
          planned_for: plannedFor,
          payload: {
            tmdbId: movie.tmdbId,
            genreIds: movie.genreIds ?? [],
            source: "recommendations_schedule",
          },
        },
        { onConflict: "user_id,external_id" }
      );

      if (error) throw error;

      onSaved(`Saved "${movie.title}" to your planned watches for ${plannedFor}.`);
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to schedule watch.";
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="PLAN A WATCH"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="grid gap-4">
        {movie ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={movie.poster ?? "/placeholder.svg"}
              alt={movie.title}
              className="h-16 w-12 rounded-lg object-cover bg-black/20"
            />
            <div className="min-w-0">
              <div className="font-semibold break-words">{movie.title}</div>
              <div className="text-sm text-[--color-muted]">
                Pick a date and it will appear in your next planned watches.
              </div>
              <div className="text-xs text-[--color-muted] mt-1">
                You can keep up to {MAX_PLANNED_WATCHES} planned films at once.
              </div>
            </div>
          </div>
        ) : null}

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Watch date</span>
          <input
            type="date"
            className="input w-full"
            value={plannedFor}
            min={dateInputValue(0)}
            onChange={(e) => setPlannedFor(e.target.value)}
          />
        </label>

        {err ? <div className="surface p-3 text-sm text-red-200">⚠️ {err}</div> : null}

        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy} type="button">
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={savePlan}
            disabled={busy || !plannedFor}
            type="button"
          >
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}