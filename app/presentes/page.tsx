import { createClient } from "@/lib/supabase/server"
import type { Gift } from "@/lib/supabase/types"
import { GiftsView } from "@/components/gifts/gifts-view"

export const dynamic = "force-dynamic"

export default async function GiftsPage() {
  let gifts: Gift[] = []

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("gifts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
    gifts = (data ?? []) as Gift[]
  }

  return <GiftsView gifts={gifts} />
}
