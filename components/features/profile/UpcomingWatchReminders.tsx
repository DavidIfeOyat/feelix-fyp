"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type PlannedWatch = {
  id: number;
  external_id: string;
  title: string;
  poster: string | null;
  planned_for: string;
};

const MAX_VISIBLE_PLANNED_WATCHES = 4;

function formatPlannedDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function localDateKey(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function statusForDate(plannedFor: string) {
  const today = localDateKey();

  if (plannedFor < today) {
    return { label: "Overdue" };
  }

  if (plannedFor === today) {
    return { label: "Today" };
  }

  return { label: "Upcoming" };
}

function ReminderCard(props: {
  item: PlannedWatch;
  busyAction: "remove" | "watched" | null;
  onRemove: () => void;
  onMarkWatched: () => void;
}) {
  const { item, busyAction, onRemove, onMarkWatched } = props;
  const tmdbId = Number(item.external_id);
  const dateText = formatPlannedDate(item.planned_for);
  const status = statusForDate(item.planned_for);

  return (
    <article className="border-2 border-black bg-[var(--surface)]">
      <div className="grid grid-cols-[56px_1fr] gap-3 p-3 sm:grid-cols-[72px_1fr] sm:p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.poster ?? "/placeholder.svg"}
          alt={item.title}
          className="h-20 w-14 border border-black object-cover sm:h-24 sm:w-16"
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-[10px]">
              {status.label}
            </p>
          </div>

          <h4 className="mt-2 line-clamp-2 text-base font-extrabold uppercase leading-[0.95] tracking-[-0.05em] text-[var(--foreground)] sm:text-lg">
            {item.title || "Untitled film"}
          </h4>

          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Planned for {dateText}
          </p>
        </div>
      </div>

      <div className="grid gap-2 border-t-2 border-black p-3 min-[420px]:grid-cols-3 sm:p-4">
        {Number.isFinite(tmdbId) ? (
          <Link href={`/films/${tmdbId}`} className="btn btn-ghost text-center">
            Open
          </Link>
        ) : (
          <div className="hidden min-[420px]:block" />
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={onMarkWatched}
          disabled={busyAction !== null}
        >
          {busyAction === "watched" ? "Saving..." : "Mark Watched"}
        </button>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={onRemove}
          disabled={busyAction !== null}
        >
          {busyAction === "remove" ? "Removing..." : "Remove"}
        </button>
      </div>
    </article>
  );
}

export function UpcomingWatchReminders({ userId }: { userId: string }) {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [rows, setRows] = useState<PlannedWatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<"remove" | "watched" | null>(null);

  async function load() {
    setLoading(true);

    const { data } = await supabase
      .from("planned_watches")
      .select("id, external_id, title, poster, planned_for")
      .eq("user_id", userId)
      .order("planned_for", { ascending: true })
      .limit(20);

    setRows(Array.isArray(data) ? (data as PlannedWatch[]) : []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [supabase, userId]);

  const visibleRows = useMemo(() => rows.slice(0, MAX_VISIBLE_PLANNED_WATCHES), [rows]);

  async function removeReminder(item: PlannedWatch) {
    setBusyId(item.id);
    setBusyAction("remove");
    setBanner(null);

    try {
      const { error } = await supabase
        .from("planned_watches")
        .delete()
        .eq("user_id", userId)
        .eq("id", item.id);

      if (error) throw error;

      setRows((prev) => prev.filter((row) => row.id !== item.id));
      setBanner(`Removed "${item.title}" from planned watches.`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Remove failed.";
      setBanner(message);
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  async function markAsWatched(item: PlannedWatch) {
    const tmdbId = Number(item.external_id);

    setBusyId(item.id);
    setBusyAction("watched");
    setBanner(null);

    try {
      const { error: watchedErr } = await supabase.from("watched_items").insert({
        user_id: userId,
        external_id: item.external_id,
        title: item.title,
        poster: item.poster ?? "/placeholder.svg",
        payload: { tmdbId: Number.isFinite(tmdbId) ? tmdbId : null },
        watched_at: new Date().toISOString(),
      });

      if (watchedErr && watchedErr.code !== "23505") throw watchedErr;

      const { error: plannedErr } = await supabase
        .from("planned_watches")
        .delete()
        .eq("user_id", userId)
        .eq("id", item.id);

      if (plannedErr) throw plannedErr;

      await supabase
        .from("watchlist_items")
        .delete()
        .eq("user_id", userId)
        .eq("external_id", item.external_id);

      setRows((prev) => prev.filter((row) => row.id !== item.id));
      setBanner(`Moved "${item.title}" to watched history.`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Update failed.";
      setBanner(message);
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  if (loading) {
    return (
      <section className="border-2 border-black bg-[var(--surface)]">
        <div className="border-b-2 border-black px-4 py-4 sm:px-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
            Planned watches
          </p>
          <h2 className="mt-3 text-2xl font-extrabold uppercase leading-[0.95] tracking-[-0.06em] text-[var(--foreground)] sm:text-3xl">
            Loading reminders.
          </h2>
        </div>
      </section>
    );
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="border-2 border-black bg-[var(--surface)]">
      <div className="border-b-2 border-black px-4 py-4 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Planned watches
            </p>
            <h2 className="mt-3 text-2xl font-extrabold uppercase leading-[0.95] tracking-[-0.06em] text-[var(--foreground)] sm:text-3xl">
              Next planned watches
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Keep a short list of upcoming films here.
            </p>
          </div>

          <Link href="/watchlist" className="btn btn-ghost w-full text-center sm:w-auto">
            View Watchlist
          </Link>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:p-6">
        {banner ? (
          <div className="border border-black bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)]">
            {banner}
          </div>
        ) : null}

        {visibleRows.map((item) => (
          <ReminderCard
            key={item.id}
            item={item}
            busyAction={busyId === item.id ? busyAction : null}
            onRemove={() => void removeReminder(item)}
            onMarkWatched={() => void markAsWatched(item)}
          />
        ))}
      </div>
    </section>
  );
}