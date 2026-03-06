import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

// Admin client — uses the service role key.
// Can bypass RLS. Only for server-side operations.
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Anon client — used only for verifying user tokens (getUser).
export const supabaseAnon = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
