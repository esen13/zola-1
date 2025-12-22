import type { Database } from "@/app/types/database.types"
import { createClient } from "@supabase/supabase-js"
import { isSupabaseEnabled } from "./config"

/**
 * Creates a Supabase client with service role key
 * This client bypasses RLS policies and should only be used server-side
 * for operations that require elevated privileges
 */
export function createServiceRoleClient() {
  if (!isSupabaseEnabled) {
    return null
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE

  if (!serviceRoleKey) {
    console.warn("SUPABASE_SERVICE_ROLE is not set")
    return null
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
