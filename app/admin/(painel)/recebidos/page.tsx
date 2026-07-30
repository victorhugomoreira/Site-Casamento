import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Payment } from "@/lib/supabase/types"
import { PaymentsReceived } from "@/components/admin/payments-received"

export const dynamic = "force-dynamic"

/** Status do Mercado Pago que significam dinheiro recebido. */
const APROVADOS = ["approved", "authorized"]
/** Cobranças geradas que ainda podem virar pagamento. */
const EM_ABERTO = ["pending", "in_process"]

export default async function RecebidosPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/admin/login")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  // A policy de `payments` libera SELECT para autenticado, então o próprio
  // client do admin já enxerga — não precisa de service_role aqui.
  const [{ data: pagos }, { data: pendentes }] = await Promise.all([
    supabase
      .from("payments")
      .select("*")
      .in("status", APROVADOS)
      .order("paid_at", { ascending: false }),
    supabase
      .from("payments")
      .select("*")
      .in("status", EM_ABERTO)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ])

  return (
    <PaymentsReceived
      paid={(pagos ?? []) as Payment[]}
      pending={(pendentes ?? []) as Payment[]}
    />
  )
}
