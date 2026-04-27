"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { createSupabaseBrowser } from "@/lib/supabase/client";

type AuthState = {
  user: User | null;
  loading: boolean;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseBrowser();

    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (!mounted) return;

      setUser(data.user ?? null);
      setLoading(false);
    }

    void loadUser();

    // Keep the local auth state aligned with Supabase session changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}