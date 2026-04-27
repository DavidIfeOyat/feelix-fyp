"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type Person = {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  watchlist_public: boolean | null;
};

type FollowRow = {
  following_id: string;
};

export default function PeoplePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Stable client instance for profile search and follow actions.
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    let alive = true;
    const term = q.trim();

    async function run() {
      if (!user) return;

      setErr(null);

      if (!term) {
        setSuggestions([]);
        setFollowingSet(new Set());
        return;
      }

      const { data: p, error: pErr } = await supabase
        .from("profiles")
        .select("user_id,display_name,username,avatar_url,bio,watchlist_public")
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(8);

      if (!alive) return;

      if (pErr) {
        setErr(pErr.message);
        setSuggestions([]);
        setFollowingSet(new Set());
        return;
      }

      const list = (p ?? []).filter(
        (x: Person) => x.user_id !== user.id
      ) as Person[];

      setSuggestions(list);

      const ids = list.map((x) => x.user_id);
      if (ids.length === 0) {
        setFollowingSet(new Set());
        return;
      }

      const { data: f } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id)
        .in("following_id", ids);

      if (!alive) return;

      setFollowingSet(
        new Set((f ?? []).map((r: FollowRow) => String(r.following_id)))
      );
    }

    const t = setTimeout(run, 250); // lightweight debounce for search
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, user?.id, supabase, user]);

  function profileHref(person: Person) {
    return `/u/${encodeURIComponent(person.username ?? person.user_id)}`;
  }

  async function toggleFollow(targetId: string) {
    if (!user) return;

    setBusyId(targetId);
    setErr(null);

    const isFollowing = followingSet.has(targetId);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetId);

        if (error) throw error;

        setFollowingSet((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: targetId,
        });

        // Ignore duplicate follow attempts if the relation already exists.
        if (error && (error as { code?: string }).code !== "23505") {
          throw error;
        }

        setFollowingSet((prev) => {
          const next = new Set(prev);
          next.add(targetId);
          return next;
        });
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Follow failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="container py-10">Loading…</p>;
  }

  if (!user) {
    return (
      <section className="container max-w-xl py-10">
        <div className="card p-7 text-center">
          <h1 className="text-2xl font-extrabold">Sign in to find people</h1>

          <div className="mt-5 flex justify-center gap-2">
            <Link className="btn btn-primary" href="/login?from=/people">
              Sign in
            </Link>

            <Link className="btn btn-ghost" href="/signup">
              Create account
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Find people</h1>
          <p className="text-sm text-[--color-muted]">
            Type a username or name.
          </p>
        </div>

        <Link
          href="/profile"
          className="text-sm text-[--color-muted] hover:underline"
        >
          Back to profile →
        </Link>
      </div>

      <div className="relative mt-5" ref={boxRef}>
        <input
          className="input w-full"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search @username or display name…"
        />

        {open && q.trim() ? (
          <div className="surface absolute z-50 mt-2 w-full overflow-hidden rounded-[--radius-xl] border border-white/10">
            {err ? (
              <div className="p-3 text-sm text-red-200">⚠️ {err}</div>
            ) : null}

            {suggestions.length === 0 && !err ? (
              <div className="p-3 text-sm text-[--color-muted]">
                No matches.
              </div>
            ) : (
              suggestions.map((person) => {
                const handle = person.username
                  ? `@${person.username}`
                  : person.user_id.slice(0, 8);

                const isFollowing = followingSet.has(person.user_id);

                return (
                  <div
                    key={person.user_id}
                    className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-white/10"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 items-center gap-3 text-left"
                      onClick={() => {
                        setOpen(false);
                        router.push(profileHref(person));
                      }}
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
                        {person.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={person.avatar_url}
                            alt="avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center font-semibold text-white/80">
                            {(person.display_name ?? "U")
                              .slice(0, 1)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate font-semibold">
                          {person.display_name}{" "}
                          <span className="font-normal text-[--color-muted]">
                            {handle}
                          </span>
                        </div>

                        <div className="truncate text-xs text-[--color-muted]">
                          {person.bio ?? ""}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`btn ${
                        isFollowing ? "btn-ghost" : "btn-primary"
                      }`}
                      disabled={busyId === person.user_id}
                      onClick={() => toggleFollow(person.user_id)}
                    >
                      {busyId === person.user_id
                        ? "…"
                        : isFollowing
                        ? "Following"
                        : "Follow"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-xs text-[--color-muted]">
        Tip: press enter after typing to open the first result (click a
        suggestion).
      </p>
    </section>
  );
}