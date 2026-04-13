"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";

type SearchItem = {
  tmdbId: number;
  title: string;
  year?: string;
  poster?: string;
  overview?: string;
  mediaType?: string;
  media_type?: string;
};

type TopFourMeta = {
  title?: string;
  poster?: string | null;
  backdrop?: string | null;
};

function normalizeMovieOnly(items: SearchItem[]) {
  return items.filter((item) => {
    const id = Number(item.tmdbId);
    if (!Number.isFinite(id) || id <= 0) return false;

    const mediaType = (item.mediaType ?? item.media_type ?? "").toLowerCase();
    if (!mediaType) return true;
    return mediaType === "movie";
  });
}

export function MountRushmoreSection(props: {
  topFour: Array<number | null>;
  topFourMeta: Record<number, TopFourMeta | undefined>;
  setTopFourSlot: (slotIndex: number, tmdbId: number | null) => Promise<void>;
  onNotify: (msg: string | null) => void;
}) {
  const { topFour, topFourMeta, setTopFourSlot, onNotify } = props;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlot, setPickerSlot] = useState(0);

  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [savingPick, setSavingPick] = useState(false);

  function openPicker(slotIndex: number) {
    setPickerSlot(slotIndex);
    setPickerOpen(true);
    setQ("");
    setResults([]);
    setActiveIdx(0);
    onNotify(null);
  }

  useEffect(() => {
    if (!pickerOpen) return;

    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      setActiveIdx(0);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);

      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`, {
          cache: "no-store",
        });

        const json = await res.json();
        const items = Array.isArray(json?.results) ? (json.results as SearchItem[]) : [];
        setResults(normalizeMovieOnly(items));
        setActiveIdx(0);
      } catch {
        setResults([]);
        setActiveIdx(0);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [q, pickerOpen]);

  async function selectMovie(tmdbId: number) {
    const id = Number(tmdbId);
    if (!Number.isFinite(id) || id <= 0) return;

    setSavingPick(true);
    onNotify(null);

    try {
      await setTopFourSlot(pickerSlot, id);
      setPickerOpen(false);
      setQ("");
      setResults([]);
      setActiveIdx(0);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Save failed.";
      onNotify(`Save failed: ${message}`);
    } finally {
      setSavingPick(false);
    }
  }

  async function removeSlot(slotIndex: number) {
    setSavingPick(true);
    onNotify(null);

    try {
      await setTopFourSlot(slotIndex, null);

      if (pickerOpen && pickerSlot === slotIndex) {
        setPickerOpen(false);
        setQ("");
        setResults([]);
        setActiveIdx(0);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Remove failed.";
      onNotify(`Remove failed: ${message}`);
    } finally {
      setSavingPick(false);
    }
  }

  return (
    <section className="border-2 border-black bg-[var(--surface)]">
      <div className="border-b-2 border-black px-4 py-4 sm:px-6">
        <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Mount Rushmore
            </p>
            <h2 className="mt-3 text-2xl font-extrabold uppercase leading-[0.95] tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
              Four films that define your taste.
            </h2>
          </div>

          <p className="max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            Pick four titles that best represent your personal film identity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-6 lg:grid-cols-4">
        {topFour.map((id, idx) => {
          const meta = id ? topFourMeta[id] : null;
          const poster = meta?.poster ?? null;
          const title = meta?.title ?? (id ? `TMDb #${id}` : "Empty slot");

          return (
            <article
              key={`${idx}-${id ?? "empty"}`}
              className="grid border-2 border-black bg-[var(--surface-strong)]"
            >
              <div className="flex items-center justify-between border-b border-black px-3 py-2 sm:px-4 sm:py-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-[10px]">
                  Slot 0{idx + 1}
                </p>

                {id ? (
                  <button
                    type="button"
                    className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--foreground)] underline-offset-4 hover:underline sm:text-[10px]"
                    onClick={() => void removeSlot(idx)}
                    disabled={savingPick}
                    aria-label="Remove film"
                    title="Remove film"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                className="group grid text-left"
                onClick={() => openPicker(idx)}
                title={id ? "Change film" : "Add film"}
              >
                <div className="border-b border-black bg-[var(--surface)]">
                  <div className="aspect-[2/3] w-full overflow-hidden">
                    {poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={poster}
                        alt={title}
                        className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center px-3 text-center">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] sm:text-[10px]">
                            No film selected
                          </p>
                          <p className="mt-2 text-3xl font-extrabold uppercase tracking-[-0.08em] text-[var(--foreground)] sm:text-4xl">
                            +
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-2 p-3 sm:gap-3 sm:p-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-[10px]">
                      {id ? "Selected film" : "Add a film"}
                    </p>

                    <h3 className="mt-2 line-clamp-2 text-base font-extrabold uppercase leading-[0.95] tracking-[-0.05em] text-[var(--foreground)] sm:text-xl">
                      {title}
                    </h3>
                  </div>

                  <div className="border-t border-black pt-2 sm:pt-3">
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--foreground)] underline-offset-4 group-hover:underline sm:text-[10px]">
                      {id ? "Change" : "Choose"}
                    </span>
                  </div>
                </div>
              </button>
            </article>
          );
        })}
      </div>

      <Modal
        open={pickerOpen}
        title="Pick a favourite film"
        onClose={() => (!savingPick ? setPickerOpen(false) : null)}
      >
        <div className="grid gap-5">
          <div className="grid gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
              Search film
            </p>

            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Start typing a film title"
                className="input w-full"
                autoFocus
                onKeyDown={(e) => {
                  const max = Math.min(results.length, 8);

                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    if (max > 0) setActiveIdx((i) => Math.min(i + 1, max - 1));
                  }

                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    if (max > 0) setActiveIdx((i) => Math.max(i - 1, 0));
                  }

                  if (e.key === "Enter") {
                    e.preventDefault();
                    const picked = results[activeIdx];
                    const tmdbId = Number(picked?.tmdbId);
                    if (Number.isFinite(tmdbId)) {
                      void selectMovie(tmdbId);
                    }
                  }

                  if (e.key === "Escape") {
                    e.preventDefault();
                    setPickerOpen(false);
                  }
                }}
              />

              {q.trim().length >= 2 ? (
                <div className="absolute left-0 right-0 z-10 mt-2 max-h-80 overflow-auto border-2 border-black bg-[var(--background)] shadow-[4px_4px_0_rgba(17,17,17,0.12)]">
                  {searching ? (
                    <div className="px-4 py-4 text-sm text-[var(--muted)]">Searching...</div>
                  ) : results.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-[var(--muted)]">No results.</div>
                  ) : (
                    results.slice(0, 8).map((item, i) => {
                      const tmdbId = Number(item.tmdbId);
                      const title = String(item.title ?? "Untitled");
                      const year = item.year ? ` (${item.year})` : "";
                      const poster = item.poster || "/placeholder.svg";

                      return (
                        <button
                          key={`${tmdbId}-${i}`}
                          type="button"
                          className={`grid w-full grid-cols-[56px_1fr] gap-3 border-b border-black px-4 py-3 text-left last:border-b-0 ${
                            i === activeIdx
                              ? "bg-black text-[var(--background)]"
                              : "bg-transparent text-[var(--foreground)] hover:bg-black hover:text-[var(--background)]"
                          }`}
                          onMouseDown={(e) => e.preventDefault()}
                          onMouseEnter={() => setActiveIdx(i)}
                          onClick={() => void selectMovie(tmdbId)}
                          disabled={savingPick}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={poster}
                            alt=""
                            className="h-16 w-14 border border-black object-cover"
                          />

                          <div className="min-w-0">
                            <div className="truncate text-[11px] font-bold uppercase tracking-[0.14em]">
                              {title}
                              <span className="opacity-75">{year}</span>
                            </div>

                            {item.overview ? (
                              <div className="mt-2 line-clamp-2 text-xs opacity-80">
                                {item.overview}
                              </div>
                            ) : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t-2 border-black pt-5 sm:flex-row sm:items-center sm:justify-between">
            {topFour[pickerSlot] ? (
              <button
                className="btn btn-ghost"
                onClick={() => void removeSlot(pickerSlot)}
                disabled={savingPick}
                type="button"
              >
                Remove
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}

            <button
              className="btn btn-ghost"
              onClick={() => setPickerOpen(false)}
              disabled={savingPick}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}