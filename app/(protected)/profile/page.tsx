"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useProfileHub } from "@/hooks/useProfileHub";
import { createSupabaseBrowser } from "@/lib/supabase/client";

import { ProfileHero } from "@/components/features/profile/ProfileHero";
import { MountRushmoreSection } from "@/components/features/profile/MountRushmoreSection";
import { UpcomingWatchReminders } from "@/components/features/profile/UpcomingWatchReminders";
import { FollowersModal } from "@/components/features/profile/FollowersModal";
import { SettingsModal } from "@/components/features/profile/SettingsModal";

function LoadingShell({ title }: { title: string }) {
  return (
    <section className="container py-6 sm:py-8 md:py-10">
      <div className="mx-auto max-w-6xl border-2 border-black bg-[var(--surface)]">
        <div className="border-b-2 border-black px-5 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            Feelix profile
          </p>
          <h1 className="mt-3 text-3xl font-extrabold uppercase leading-none tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
            {title}
          </h1>
        </div>

        <div className="p-5 text-sm leading-7 text-[var(--muted)] sm:p-6">
          Please wait while your profile is prepared.
        </div>
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const hub = useProfileHub(user?.id);
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [banner, setBanner] = useState<string | null>(null);
  const [socialKind, setSocialKind] = useState<null | "followers" | "following">(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const resolvedUsername = useMemo(() => {
    if (hub.profile?.username) return hub.profile.username;
    return user?.email?.split("@")[0] ?? "member";
  }, [hub.profile?.username, user?.email]);

  const resolvedName = hub.profile?.display_name ?? resolvedUsername ?? "member";
  const resolvedBio = hub.profile?.bio ?? "Your personal cinema hub";

  const heroBackdrop = useMemo(() => {
    const first = hub.topFour.find((x): x is number => typeof x === "number" && x > 0);
    if (!first) return null;
    const m = hub.topFourMeta[first];
    return m?.backdrop ?? m?.poster ?? null;
  }, [hub.topFour, hub.topFourMeta]);

  if (authLoading) {
    return <LoadingShell title="Loading Profile" />;
  }

  if (!user) {
    return (
      <section className="container py-6 sm:py-8 md:py-10">
        <div className="mx-auto max-w-4xl border-2 border-black bg-[var(--surface)]">
          <div className="grid md:grid-cols-[1fr_auto]">
            <div className="border-b-2 border-black p-5 sm:p-6 md:border-b-0 md:border-r-2 md:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                Feelix profile
              </p>

              <h1 className="mt-4 text-4xl font-extrabold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:text-5xl">
                Sign in to view your profile.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                Your Mount Rushmore, saved identity, favourites, and personal film space live
                here.
              </p>
            </div>

            <div className="grid gap-3 p-5 sm:p-6 md:w-[260px] md:content-end md:p-8">
              <Link className="btn btn-primary text-center" href="/login">
                Sign In
              </Link>

              <Link className="btn btn-ghost text-center" href="/signup">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (hub.loading) {
    return <LoadingShell title="Loading Profile" />;
  }

  return (
    <section className="container py-6 sm:py-8 md:py-10">
      <div className="grid gap-6">
        <ProfileHero
          heroBackdrop={heroBackdrop}
          avatarUrl={hub.profile?.avatar_url ?? null}
          resolvedName={resolvedName}
          resolvedUsername={resolvedUsername}
          resolvedBio={resolvedBio}
          counts={{
            followers: hub.counts.followers,
            following: hub.counts.following,
            filmsWatched: hub.counts.filmsWatched,
            watchlistCount: hub.counts.watchlistCount,
          }}
          hubError={hub.error ?? null}
          onOpenFollowers={() => setSocialKind("followers")}
          onOpenFollowing={() => setSocialKind("following")}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <UpcomingWatchReminders userId={user.id} />

        {banner ? (
          <div className="border-2 border-black bg-[var(--surface-strong)] px-4 py-4 text-sm text-[var(--foreground)]">
            {banner}
          </div>
        ) : null}

        <MountRushmoreSection
          topFour={hub.topFour}
          topFourMeta={hub.topFourMeta}
          setTopFourSlot={hub.setTopFourSlot}
          onNotify={setBanner}
        />
      </div>

      <FollowersModal
        open={Boolean(socialKind)}
        kind={socialKind}
        onClose={() => setSocialKind(null)}
        supabase={supabase as never}
        userId={user.id}
        onChanged={() => hub.refresh()}
        onNotify={setBanner}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        supabase={supabase as never}
        userId={user.id}
        profile={hub.profile ?? null}
        resolvedName={resolvedName}
        resolvedBio={resolvedBio}
        onSaved={() => hub.refresh()}
        onNotify={setBanner}
      />
    </section>
  );
}