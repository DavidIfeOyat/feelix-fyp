"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function FollowToggleButton(props: {
  targetUserId: string;
  initialFollowing: boolean;
  className?: string;
  onChange?: (following: boolean) => void;
}) {
  const { user } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [following, setFollowing] = useState(Boolean(props.initialFollowing));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function gateToLogin() {
    window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
  }

  async function toggle() {
    setErr(null);

    if (!user?.id) return gateToLogin();
    if (user.id === props.targetUserId) return;

    setBusy(true);
    try {
      if (following) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", props.targetUserId);

        if (error) throw error;

        setFollowing(false);
        props.onChange?.(false);
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: props.targetUserId,
        });

        // ignore "already exists" (unique constraint)
        if (error && (error as any).code !== "23505") throw error;

        setFollowing(true);
        props.onChange?.(true);
      }
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Follow action failed");
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
        className={props.className ?? "btn btn-ghost"}
      >
        {following ? "Following" : "Follow"}
      </button>
      {err && <div className="text-xs text-red-200">{err}</div>}
    </div>
  );
}