import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Client Supabase somente-leitura, SEM cookies.
 *
 * O client de `server.ts` lê cookies para saber a sessão do admin, e isso obriga
 * o Next a renderizar a página a cada visita. A lista de presentes é pública
 * (RLS "gifts public read"), então aqui usamos a chave anônima pura — assim a
 * home e a página /presentes podem ficar em cache e serem servidas na hora.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
