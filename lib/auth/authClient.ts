'use client';
import { useGuestWatchlist } from '@/hooks/useGuestWatchlist';
import { createSupabaseBrowser } from "@/lib/supabase/client"

const supabase = createSupabaseBrowser();

export function initAuthSideEffects() {
  const { get, clear } = useGuestWatchlist();
  supabase.auth.onAuthStateChange(async (ev, sess) => {
    if (ev === 'SIGNED_IN' && sess?.user) {
      try {
        const ghost = get();
        if (ghost.length) {
          await fetch('/api/watchlist/ghost-migrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: ghost }),
          });
          clear();
        }
      } catch { /* non-blocking */ }
    }
  });
}
