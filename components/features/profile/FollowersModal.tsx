"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Modal } from "@/components/shared/Modal";

type MiniProfile = {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

const PUBLIC_PROFILE_BASE = "/u";

function userHref(p: MiniProfile) {
  const handle = (p.username || "").trim();
  return `${PUBLIC_PROFILE_BASE}/${encodeURIComponent(handle || p.userId)}`;
}

function actionClass(primary: boolean) {
  return [
    "inline-flex items-center justify-center border-2 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] transition disabled:opacity-50",
    primary
      ? "border-black bg-black text-[var(--background)]"
      : "border-black bg-transparent text-[var(--foreground)] hover:bg-black hover:text-[var(--background)]",
  ].join(" ");
}

export function FollowersModal(props: {
  open: boolean;
  kind: "followers" | "following" | null;
  onClose: () => void;
  supabase: SupabaseClient;
  userId: string | null;
  onChanged: () => Promise<void> | void;
  onNotify: (msg: string | null) => void;
}) {
  const { open, kind, onClose, supabase, userId, onChanged, onNotify } = props;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [list, setList] = useState<MiniProfile[]>([]);
  const [filter, setFilter] = useState("");
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return list;

    return list.filter((p) => {
      const a = (p.displayName || "").toLowerCase();
      const b = (p.username || "").toLowerCase();
      const c = (p.bio || "").toLowerCase();
      return a.includes(f) || b.includes(f) || c.includes(f);
    });
  }, [filter, list]);

  async function load() {
    if (!userId || !kind) return;

    setLoading(true);
    setErr(null);

    try {
      const idField = kind === "followers" ? "follower_id" : "following_id";
      const matchField = kind === "followers" ? "following_id" : "follower_id";

      const { data: rel, error: relErr } = await supabase
        .from("follows")
        .select(`${idField}`)
        .eq(matchField, userId);

      if (relErr) throw relErr;

      const ids = (rel ?? [])
        .map((r: { [key: string]: unknown }) => String(r?.[idField] ?? ""))
        .filter((x) => x.length > 0);

      if (ids.length === 0) {
        setList([]);
        setFollowMap({});
        return;
      }

      const { data: profs, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, bio")
        .in("user_id", ids);

      if (profErr) throw profErr;

      const nextList: MiniProfile[] = (profs ?? []).map(
        (p: {
          user_id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
        }) => ({
          userId: String(p.user_id),
          username: p.username ?? null,
          displayName: p.display_name ?? null,
          avatarUrl: p.avatar_url ?? null,
          bio: p.bio ?? null,
        })
      );

      const { data: mine, error: mineErr } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId)
        .in("following_id", ids);

      if (mineErr) throw mineErr;

      const map: Record<string, boolean> = {};
      (mine ?? []).forEach((r: { following_id?: string | null }) => {
        const fid = String(r?.following_id ?? "");
        if (fid) map[fid] = true;
      });

      nextList.sort((a, b) => {
        const an = (a.displayName || a.username || "").toLowerCase();
        const bn = (b.displayName || b.username || "").toLowerCase();
        return an.localeCompare(bn);
      });

      setList(nextList);
      setFollowMap(map);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open || !kind) return;
    setFilter("");
    void load();
  }, [open, kind, userId]);

  async function follow(targetId: string) {
    if (!userId || !targetId || targetId === userId) return;

    setBusyId(targetId);
    onNotify(null);

    try {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: userId, following_id: targetId });

      if (error) throw error;

      setFollowMap((m) => ({ ...m, [targetId]: true }));
      await onChanged();
    } catch (e: unknown) {
      onNotify(e instanceof Error ? `Follow failed: ${e.message}` : "Follow failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function unfollow(targetId: string) {
    if (!userId || !targetId || targetId === userId) return;

    setBusyId(targetId);
    onNotify(null);

    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", userId)
        .eq("following_id", targetId);

      if (error) throw error;

      setFollowMap((m) => {
        const next = { ...m };
        delete next[targetId];
        return next;
      });

      if (kind === "following") {
        setList((lst) => lst.filter((p) => p.userId !== targetId));
      }

      await onChanged();
    } catch (e: unknown) {
      onNotify(e instanceof Error ? `Unfollow failed: ${e.message}` : "Unfollow failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Modal
      open={open}
      title={kind === "followers" ? "Followers" : kind === "following" ? "Following" : "People"}
      onClose={onClose}
    >
      <div className="grid gap-5">
        <div className="grid gap-3 border-b-2 border-black pb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            Search people
          </p>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              className="input w-full"
              placeholder="Search people"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />

            <button className={actionClass(false)} onClick={() => void load()} disabled={loading}>
              {loading ? "Loading" : "Refresh"}
            </button>
          </div>
        </div>

        {err ? (
          <div className="border border-black bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)]">
            {err}
          </div>
        ) : null}

        <div className="border-2 border-black bg-[var(--surface)]">
          {loading ? (
            <div className="px-4 py-4 text-sm text-[var(--muted)]">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-4 text-sm text-[var(--muted)]">
              {kind === "followers" ? "No followers yet." : "Not following anyone yet."}
            </div>
          ) : (
            <ul>
              {filtered.map((p) => {
                const isMe = p.userId === userId;
                const youFollow = Boolean(followMap[p.userId]);
                const busy = busyId === p.userId;

                const primary = (p.displayName || p.username || "Member").trim();
                const handle = p.username ? `@${p.username}` : "";
                const subtitle = p.bio ? p.bio : handle;

                const action = isMe ? null : youFollow ? (
                  <button
                    className={actionClass(false)}
                    onClick={() => void unfollow(p.userId)}
                    disabled={busy}
                    title="Unfollow"
                    type="button"
                  >
                    {busy ? "Working" : "Following"}
                  </button>
                ) : (
                  <button
                    className={actionClass(true)}
                    onClick={() => void follow(p.userId)}
                    disabled={busy}
                    title={kind === "followers" ? "Follow back" : "Follow"}
                    type="button"
                  >
                    {busy ? "Working" : kind === "followers" ? "Follow Back" : "Follow"}
                  </button>
                );

                return (
                  <li
                    key={p.userId}
                    className="grid gap-4 border-b border-black px-4 py-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <Link
                      href={userHref(p)}
                      className="grid min-w-0 grid-cols-[52px_1fr] gap-3 no-underline"
                      onClick={onClose}
                    >
                      <div className="h-13 w-13 border-2 border-black bg-[var(--surface-strong)]">
                        {p.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-lg font-extrabold uppercase tracking-[-0.05em] text-[var(--foreground)]">
                            {primary.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--foreground)]">
                            {primary}
                          </p>

                          {handle ? (
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                              {handle}
                            </span>
                          ) : null}

                          {isMe ? (
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                              You
                            </span>
                          ) : null}
                        </div>

                        {subtitle ? (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                            {subtitle}
                          </p>
                        ) : null}
                      </div>
                    </Link>

                    <div className="shrink-0">{action}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end border-t-2 border-black pt-5">
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}