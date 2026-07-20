import "server-only"
import { createClient } from "@supabase/supabase-js"

/**
 * Client Supabase com a service_role key. IGNORA RLS — use APENAS em código
 * server-side (route handlers) e NUNCA exponha a chave ao browser.
 * Usado para o fluxo público de RSVP e para o import da planilha.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
    )
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
