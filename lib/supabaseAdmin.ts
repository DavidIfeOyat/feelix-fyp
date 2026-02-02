import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,         // URL from .env.local
  process.env.SUPABASE_SERVICE_ROLE_KEY!,        // SERVICE role key (server-side only)
  { auth: { persistSession: false } }
);
