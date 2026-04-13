"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Modal } from "@/components/shared/Modal";

function panelClass(extra = "") {
  return `border-2 border-black bg-[var(--surface)] ${extra}`.trim();
}

export function SettingsModal(props: {
  open: boolean;
  onClose: () => void;
  supabase: SupabaseClient;
  userId: string | null;
  profile: {
    display_name?: string | null;
    username?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    mount_rushmore_public?: boolean | null;
    watchlist_public?: boolean | null;
  } | null;
  resolvedName: string;
  resolvedBio: string;
  onSaved: () => Promise<void> | void;
  onNotify: (msg: string | null) => void;
}) {
  const {
    open,
    onClose,
    supabase,
    userId,
    profile,
    resolvedName,
    resolvedBio,
    onSaved,
    onNotify,
  } = props;

  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [mountPublic, setMountPublic] = useState(true);
  const [watchlistPublic, setWatchlistPublic] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  useEffect(() => {
    if (!open) return;

    onNotify(null);
    setDisplayName(profile?.display_name ?? resolvedName);
    setUsername(profile?.username ?? "");
    setBio(profile?.bio ?? resolvedBio);
    setMountPublic(Boolean(profile?.mount_rushmore_public ?? true));
    setWatchlistPublic(Boolean(profile?.watchlist_public ?? false));
    setDeleteOpen(false);
    setDeleteText("");
  }, [open, profile, resolvedName, resolvedBio, onNotify]);

  async function saveSettings() {
    if (!userId) return;

    setSaving(true);
    onNotify(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || resolvedName,
          username: username.trim() || null,
          bio: bio.trim() || resolvedBio,
          mount_rushmore_public: mountPublic,
          watchlist_public: watchlistPublic,
        })
        .eq("user_id", userId);

      if (error) throw error;

      onNotify("Settings saved.");
      onClose();
      await onSaved();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Save failed.";
      onNotify(`Save failed: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  async function onPickAvatar(file: File | null) {
    if (!userId || !file) return;

    setAvatarUploading(true);
    onNotify(null);

    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        cacheControl: "3600",
        contentType: file.type || "image/jpeg",
      });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data?.publicUrl ?? null;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("user_id", userId);

      if (profileError) throw profileError;

      onNotify("Avatar updated.");
      await onSaved();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Upload failed.";
      onNotify(`Upload failed: ${message}`);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function deleteAccount() {
    if (!userId) return;
    if (deleteText.trim().toUpperCase() !== "DELETE") return;

    onNotify(null);

    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;

      onNotify("Account deleted.");
      setDeleteOpen(false);
      setDeleteText("");
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Delete failed.";
      onNotify(`Delete failed: ${message}`);
    }
  }

  return (
    <>
      <Modal open={open} title="Settings" onClose={onClose}>
        <div className="grid gap-4 sm:gap-5">
          <section className={panelClass()}>
            <div className="border-b-2 border-black px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                Profile
              </p>
            </div>

            <div className="grid gap-4 p-4 sm:p-5">
              <label className="grid gap-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] sm:text-[10px]">
                  Display name
                </span>
                <input
                  className="input w-full"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] sm:text-[10px]">
                  Username
                </span>
                <input
                  className="input w-full"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] sm:text-[10px]">
                  Bio
                </span>
                <textarea
                  className="input min-h-[92px] w-full resize-none py-3"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                />
                <span className="text-right text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--muted)] sm:text-[10px]">
                  {bio.length}/160
                </span>
              </label>

              <label className="grid gap-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] sm:text-[10px]">
                  Profile picture
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void onPickAvatar(e.target.files?.[0] ?? null)}
                  disabled={avatarUploading}
                  className="block w-full border-2 border-black bg-[var(--surface-strong)] px-3 py-3 text-sm text-[var(--foreground)] file:mr-3 file:border-0 file:bg-black file:px-3 file:py-2 file:text-[9px] file:font-bold file:uppercase file:tracking-[0.16em] file:text-[var(--background)] sm:file:text-[10px]"
                />
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--muted)] sm:text-[10px]">
                  {avatarUploading ? "Uploading avatar..." : "Choose an image file"}
                </span>
              </label>
            </div>
          </section>

          <section className={panelClass()}>
            <div className="border-b-2 border-black px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                Privacy
              </p>
            </div>

            <div className="grid gap-3 p-4 sm:p-5">
              <label className="grid cursor-pointer grid-cols-[auto_1fr] gap-3 border-2 border-black bg-[var(--surface-strong)] p-3">
                <input
                  type="checkbox"
                  checked={mountPublic}
                  onChange={(e) => setMountPublic(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-black"
                />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)] sm:text-[11px]">
                    Public Mount Rushmore
                  </div>
                  <div className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    Show your top four films publicly on your profile.
                  </div>
                </div>
              </label>

              <label className="grid cursor-pointer grid-cols-[auto_1fr] gap-3 border-2 border-black bg-[var(--surface-strong)] p-3">
                <input
                  type="checkbox"
                  checked={watchlistPublic}
                  onChange={(e) => setWatchlistPublic(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-black"
                />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)] sm:text-[11px]">
                    Public Watchlist
                  </div>
                  <div className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    Let other users view films saved to your watchlist.
                  </div>
                </div>
              </label>

              <div className="grid gap-2 border-t-2 border-black pt-4 sm:grid-cols-2">
                <button className="btn btn-ghost w-full" onClick={onClose} type="button">
                  Cancel
                </button>
                <button
                  className="btn btn-primary w-full"
                  onClick={() => void saveSettings()}
                  disabled={saving}
                  type="button"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </section>

          <section className="border-2 border-black bg-[var(--surface)]">
            <div className="border-b-2 border-black px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                Danger zone
              </p>
            </div>

            <div className="grid gap-4 p-4 sm:p-5">
              <p className="text-sm leading-7 text-[var(--foreground)]">
                Deleting your account is permanent and cannot be undone.
              </p>

              <div>
                <button
                  className="btn btn-ghost w-full sm:w-auto"
                  onClick={() => setDeleteOpen(true)}
                  type="button"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </div>
      </Modal>

      <Modal open={deleteOpen} title="Delete Account" onClose={() => setDeleteOpen(false)}>
        <div className="grid gap-4">
          <section className={panelClass()}>
            <div className="border-b-2 border-black px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                Confirmation
              </p>
            </div>

            <div className="grid gap-4 p-4 sm:p-5">
              <p className="text-sm leading-7 text-[var(--foreground)]">
                Type <span className="font-bold uppercase">DELETE</span> to confirm account removal.
              </p>

              <input
                className="input w-full"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
              />

              <div className="grid gap-2 border-t-2 border-black pt-4 sm:grid-cols-2">
                <button
                  className="btn btn-ghost w-full"
                  onClick={() => setDeleteOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary w-full"
                  onClick={() => void deleteAccount()}
                  disabled={deleteText.trim().toUpperCase() !== "DELETE"}
                  type="button"
                >
                  Confirm
                </button>
              </div>
            </div>
          </section>
        </div>
      </Modal>
    </>
  );
}