import { unstable_cache } from "next/cache"
import { createPublicClient } from "@/lib/supabase/public"
import type { Gift } from "@/lib/supabase/types"

export const GIFTS_TAG = "gifts"
/** Revalida a lista a cada 5 min; edições no admin invalidam na hora via revalidateTag. */
const REVALIDATE_SECONDS = 300

/**
 * Busca a lista de presentes uma vez e reaproveita o resultado entre visitantes.
 * Antes, cada acesso à home e a /presentes disparava uma consulta ao Supabase.
 */
export const getGifts = unstable_cache(
  async (limit?: number): Promise<Gift[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []

    const supabase = createPublicClient()
    let query = supabase
      .from("gifts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (limit) query = query.limit(limit)

    const { data } = await query
    return (data ?? []) as Gift[]
  },
  ["gifts-list"],
  { revalidate: REVALIDATE_SECONDS, tags: [GIFTS_TAG] },
)
