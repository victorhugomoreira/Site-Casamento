import { notFound } from "next/navigation"
import { createPublicClient } from "@/lib/supabase/public"
import type { Gift } from "@/lib/supabase/types"
import { CheckoutView } from "@/components/gifts/checkout-view"

export const revalidate = 300

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createPublicClient()
  const { data } = await supabase.from("gifts").select("*").eq("id", id).single()

  if (!data) notFound()

  return <CheckoutView gift={data as Gift} />
}
