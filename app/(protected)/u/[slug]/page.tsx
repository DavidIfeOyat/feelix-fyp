"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import PublicMovieCard from "@/components/shared/PublicMovieCard";
import type { MovieItem } from "@/components/shared/MovieCard";
import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type ProfileRow = {
  user_id: string;
  display_name: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  top_four_ids: number[] | null;
  mount_rushmore_public: boolean | null;
  watchlist_public: boolean | null;
};

type Mini = {
  tmdbId: number;
  title: string;
  poster: string | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function fetchMini(tmdbId: number) {
  const res = await fetch(`/api/tmdb/movie/${tmdbId}`, { cache: "no-store" });
  if (!res.ok) return null;

  const j = await res.json();

  return {
    tmdbId,
    title: String(j?.title ?? ""),
    poster: (j?.poster ?? null) as string | null,
  } as Mini;
}

function dedupeMovies(items: MovieItem[]) {
  const seen = new Set<number>();
  const out: MovieItem[] = [];

  for (const item of items) {
    if (seen.has(item.tmdbId)) continue;
    seen.add(item.tmdbId);
    out.push(item);
  }

  return out;
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="border-2 border-black bg-[var(--surface)] px-4 py-6 text-center text-sm leading-7 text-[var(--muted)] sm:px-6">
      {text}
    </div>
  );
}

export default function UserProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(String(params.slug || ""));

  const [p, setP] = useState<ProfileRow | null>(null);
  const [watchlist, setWatchlist] = useState<MovieItem[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowingState, setIsFollowingState] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [mountMeta, setMountMeta] = useState<Record<number, Mini>>({});
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!user) return;

      setLoadingPage(true);
      setErr(null);

      let prof: ProfileRow | null = null;

      // Prefer username-based lookup first. Fall back to UUID lookup so
      // member profiles remain accessible even if a username is missing.
      {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "user_id,display_name,username,bio,avatar_url,top_four_ids,mount_rushmore_public,watchlist_public"
          )
          .ilike("username", slug)
          .maybeSingle();

        if (!alive) return;

        if (error) {
          setErr(error.message);
          setLoadingPage(false);
          return;
        }

        prof = (data as ProfileRow | null) ?? null;
      }

      if (!prof && isUuid(slug)) {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "user_id,display_name,username,bio,avatar_url,top_four_ids,mount_rushmore_public,watchlist_public"
          )
          .eq("user_id", slug)
          .maybeSingle();

        if (!alive) return;

        if (error) {
          setErr(error.message);
          setLoadingPage(false);
          return;
        }

        prof = (data as ProfileRow | null) ?? null;
      }

      if (!prof) {
        setErr("User not found.");
        setLoadingPage(false);
        return;
      }

      setP(prof);

      const targetId = String(prof.user_id);

      const [followersQ, followingQ, relQ] = await Promise.all([
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", targetId),

        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", targetId),

        supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .eq("following_id", targetId)
          .maybeSingle(),
      ]);

      if (!alive) return;

      setFollowers(Number(followersQ.count ?? 0));
      setFollowing(Number(followingQ.count ?? 0));
      setIsFollowingState(Boolean(relQ.data));

      const canSeeMount =
        Boolean(prof.mount_rushmore_public ?? true) || targetId === user.id;

      if (canSeeMount) {
        const ids = Array.isArray(prof.top_four_ids) ? prof.top_four_ids : [];
        const valid = ids
          .map((x) => Number(x))
          .filter((x) => Number.isFinite(x))
          .slice(0, 4) as number[];

        const minis = await Promise.all(valid.map(fetchMini));
        if (!alive) return;

        const next: Record<number, Mini> = {};
        for (const mini of minis) {
          if (mini?.tmdbId) next[mini.tmdbId] = mini;
        }

        setMountMeta(next);
      } else {
        setMountMeta({});
      }

      const { data: wl, error: wlErr } = await supabase
        .from("watchlist_items")
        .select("external_id,title,poster,payload,created_at,user_id")
        .eq("user_id", targetId)
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (wlErr) {
        setWatchlist([]);
      } else {
        const mapped: MovieItem[] = (wl ?? [])
          .map(
            (row: {
              external_id?: string;
              title?: string;
              poster?: string;
              payload?: { tmdbId?: number };
            }) => {
              const tmdbId = Number(row?.payload?.tmdbId ?? row?.external_id);
              if (!Number.isFinite(tmdbId)) return null;

              return {
                tmdbId,
                title: String(row?.title ?? "Untitled"),
                poster: String(row?.poster ?? "/placeholder.svg"),
              };
            }
          )
          .filter(Boolean) as MovieItem[];

        setWatchlist(dedupeMovies(mapped));
      }

      setLoadingPage(false);
    }

    void run();

    return () => {
      alive = false;
    };
  }, [user?.id, slug, supabase, user]);

  async function toggleFollow() {
    if (!user || !p) return;
    if (p.user_id === user.id) return;

    setErr(null);

    try {
      if (isFollowingState) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", p.user_id);

        if (error) throw error;

        setIsFollowingState(false);
        setFollowers((n) => Math.max(0, n - 1));
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: p.user_id,
        });

        // Ignore duplicate relation errors so the UI still converges safely.
        if (error && (error as { code?: string }).code !== "23505") {
          throw error;
        }

        setIsFollowingState(true);
        setFollowers((n) => n + 1);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Follow failed.");
    }
  }

  if (authLoading) {
    return (
      <section className="container py-8 sm:py-10">
        <div className="border-2 border-black bg-[var(--surface)]">
          <div className="border-b-2 border-black px-4 py-4 sm:px-6">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Public profile
            </p>

            <h1 className="mt-3 text-3xl font-extrabold uppercase leading-none tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
              Loading Profile
            </h1>
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="container py-8 sm:py-10">
        <div className="mx-auto max-w-4xl border-2 border-black bg-[var(--surface)]">
          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end lg:p-8">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                Public profile
              </p>

              <h1 className="mt-4 text-3xl font-extrabold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:text-5xl">
                Sign in to view profiles.
              </h1>
            </div>

            <Link
              href={`/login?from=/u/${encodeURIComponent(slug)}`}
              className="btn btn-primary text-center lg:w-auto"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (loadingPage) {
    return (
      <section className="container py-8 sm:py-10">
        <div className="border-2 border-black bg-[var(--surface)]">
          <div className="border-b-2 border-black px-4 py-4 sm:px-6">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Public profile
            </p>

            <h1 className="mt-3 text-3xl font-extrabold uppercase leading-none tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
              Loading Profile
            </h1>
          </div>
        </div>
      </section>
    );
  }

  if (!p) {
    return (
      <section className="container py-8 sm:py-10">
        <EmptyPanel text={err ?? "User not found."} />
      </section>
    );
  }

  const handle = p.username ? `@${p.username}` : p.user_id.slice(0, 8);
  const isSelf = p.user_id === user.id;
  const canSeeMount = Boolean(p.mount_rushmore_public ?? true) || isSelf;
  const canSeeWatchlist = Boolean(p.watchlist_public ?? false) || isSelf;

  return (
    <section className="container py-8 sm:py-10">
      <div className="grid gap-6">
        <section className="overflow-hidden border-2 border-black bg-[var(--surface)]">
          <div className="hidden border-b-2 border-black md:grid md:grid-cols-3">
            <div className="border-r-2 border-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
              Public profile
            </div>
            <div className="border-r-2 border-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
              Taste display
            </div>
            <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
              Shared collection
            </div>
          </div>

          <div className="grid gap-0 xl:grid-cols-[1.02fr_0.98fr]">
            <div className="border-b-2 border-black p-4 sm:p-6 lg:p-8 xl:border-b-0 xl:border-r-2">
              <div className="grid grid-cols-[72px_1fr] gap-4 md:grid-cols-[88px_1fr] md:gap-5">
                <div className="h-[72px] w-[72px] border-2 border-black bg-[var(--surface-strong)] md:h-[88px] md:w-[88px]">
                  {p.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.avatar_url}
                      alt="avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl font-extrabold uppercase tracking-[-0.06em] text-[var(--foreground)] md:text-3xl">
                      {p.display_name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                    Member
                  </p>

                  <h1 className="mt-3 break-all text-[1.8rem] font-extrabold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:break-words sm:text-4xl lg:text-5xl">
                    {p.display_name}
                  </h1>

                  <p className="mt-2 break-all text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] sm:text-[11px]">
                    {handle}
                  </p>
                </div>
              </div>

              <p className="mt-4 max-w-2xl break-words text-sm leading-7 text-[var(--foreground)] sm:text-base">
                {p.bio ?? "Your personal cinema hub"}
              </p>

              <div className="mt-6 border-t-2 border-black pt-4 md:mt-7">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                  Actions
                </p>

                <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 2xl:grid-cols-2">
                  <Link href="/people" className="btn btn-ghost text-center">
                    Find People
                  </Link>

                  {!isSelf ? (
                    <button
                      type="button"
                      className="btn btn-primary text-center"
                      onClick={toggleFollow}
                    >
                      {isFollowingState ? "Following" : "Follow"}
                    </button>
                  ) : (
                    <Link href="/profile" className="btn btn-primary text-center">
                      View My Profile
                    </Link>
                  )}
                </div>
              </div>

              {err ? (
                <div className="mt-4 border border-black bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] sm:mt-5">
                  {err}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 p-4 sm:p-6 lg:p-8">
              <div className="border-b-2 border-black pb-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                  Social stats
                </p>

                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  A quick view of this member’s public film presence.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                <div className="border-2 border-black bg-[var(--surface)] px-4 py-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-[10px]">
                    Followers
                  </p>
                  <p className="mt-2 text-2xl font-extrabold uppercase leading-none tracking-[-0.05em] text-[var(--foreground)] md:text-3xl">
                    {followers}
                  </p>
                </div>

                <div className="border-2 border-black bg-[var(--surface)] px-4 py-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-[10px]">
                    Following
                  </p>
                  <p className="mt-2 text-2xl font-extrabold uppercase leading-none tracking-[-0.05em] text-[var(--foreground)] md:text-3xl">
                    {following}
                  </p>
                </div>
              </div>

              <div className="border-t-2 border-black pt-4 sm:pt-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                  Visibility
                </p>

                <div className="mt-3 grid gap-2 min-[420px]:grid-cols-2">
                  <div className="border border-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)]">
                    Mount Rushmore {canSeeMount ? "Visible" : "Private"}
                  </div>

                  <div className="border border-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)]">
                    Watchlist {canSeeWatchlist ? "Visible" : "Private"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-2 border-black bg-[var(--surface)]">
          <div className="border-b-2 border-black px-4 py-4 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                  Mount Rushmore
                </p>

                <h2 className="mt-3 text-2xl font-extrabold uppercase leading-[0.95] tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
                  Four defining films.
                </h2>
              </div>

              {!canSeeMount ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Private
                </p>
              ) : null}
            </div>
          </div>

          {canSeeMount ? (
            <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => {
                const id = Array.isArray(p.top_four_ids) ? p.top_four_ids[i] : null;
                const tmdbId = Number(id);
                const meta = Number.isFinite(tmdbId) ? mountMeta[tmdbId] : null;

                return (
                  <article
                    key={i}
                    className="overflow-hidden border-2 border-black bg-[var(--surface-strong)]"
                  >
                    <div className="aspect-[2/3] bg-[var(--surface)]">
                      {meta?.poster ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={meta.poster}
                          alt={meta.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center px-3 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] sm:text-[10px]">
                          {Number.isFinite(tmdbId) ? "Loading..." : "Empty"}
                        </div>
                      )}
                    </div>

                    <div className="border-t-2 border-black p-3 sm:p-4">
                      <p className="line-clamp-2 text-sm font-extrabold uppercase leading-[0.95] tracking-[-0.05em] text-[var(--foreground)] sm:text-base">
                        {meta?.title ?? "—"}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <EmptyPanel text="This user has hidden their Mount Rushmore." />
            </div>
          )}
        </section>

        <section className="border-2 border-black bg-[var(--surface)]">
          <div className="border-b-2 border-black px-4 py-4 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                  Watchlist
                </p>

                <h2 className="mt-3 text-2xl font-extrabold uppercase leading-[0.95] tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
                  Saved films.
                </h2>
              </div>

              {!canSeeWatchlist ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Private
                </p>
              ) : null}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {!canSeeWatchlist ? (
              <EmptyPanel text="This user has hidden their watchlist." />
            ) : watchlist.length === 0 ? (
              <EmptyPanel text="No films in watchlist yet." />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {watchlist.map((item) => (
                  <PublicMovieCard key={`pubwl-${item.tmdbId}`} item={item} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}