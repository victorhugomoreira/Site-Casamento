import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Gift } from "@/lib/supabase/types"
import { GiftManager } from "@/components/admin/gift-manager"

export const dynamic = "force-dynamic"

export default async function PresentesAdminPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/admin/login")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  const { data } = await supabase
    .from("gifts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  const gifts = (data ?? []) as Gift[]

  return <GiftManager gifts={gifts} />
}
