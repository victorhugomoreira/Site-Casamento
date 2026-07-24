import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Gift } from "@/lib/supabase/types"
import { CheckoutView } from "@/components/gifts/checkout-view"

export const dynamic = "force-dynamic"

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data } = await supabase.from("gifts").select("*").eq("id", id).single()

  if (!data) notFound()

  return <CheckoutView gift={data as Gift} />
}
