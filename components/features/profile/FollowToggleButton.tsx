"use client";

import { useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type FollowToggleButtonProps = {
  targetUserId: string;
  initialFollowing: boolean;
  className?: string;
  onChange?: (following: boolean) => void;
};

export default function FollowToggleButton({
  targetUserId,
  initialFollowing,
  className,
  onChange,
}: FollowToggleButtonProps) {
  const { user } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [following, setFollowing] = useState(Boolean(initialFollowing));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function gateToLogin() {
    window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
  }

  async function toggle() {
    setErr(null);

    if (!user?.id) return gateToLogin();
    if (user.id === targetUserId) return;

    setBusy(true);

    try {
      if (following) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);

        if (error) throw error;

        setFollowing(false);
        onChange?.(false);
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

        // Ignore duplicate insert attempts if the relation already exists.
        if (error && (error as { code?: string }).code !== "23505") {
          throw error;
        }

        setFollowing(true);
        onChange?.(true);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Follow action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={className ?? "btn btn-ghost"}
      >
        {following ? "Following" : "Follow"}
      </button>

      {err ? <div className="text-xs text-red-200">{err}</div> : null}
    </div>
  );
}