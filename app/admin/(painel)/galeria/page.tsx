import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { GalleryPhoto } from "@/lib/supabase/types"
import { GalleryManager } from "@/components/admin/gallery-manager"

export const dynamic = "force-dynamic"

export default async function GaleriaAdminPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/admin/login")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  const { data } = await supabase
    .from("gallery_photos")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  const photos = (data ?? []) as GalleryPhoto[]

  return <GalleryManager photos={photos} />
}
