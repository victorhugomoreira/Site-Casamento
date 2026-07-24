import Link from "next/link"
import { redirect } from "next/navigation"
import { Users, CheckCircle, Clock, XCircle, Armchair, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import type { Household } from "@/lib/supabase/types"
import { HouseholdTable } from "@/components/admin/household-table"
import { ImportForm } from "@/components/admin/import-form"
import { CopyLinkButton } from "@/components/admin/copy-link-button"

export const dynamic = "force-dynamic"

export default async function ConvidadosPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/admin/login")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  const { data, error } = await supabase
    .from("households")
    .select("*")
    .order("host_name")

  const households = (data ?? []) as Household[]

  const confirmed = households.filter((h) => h.rsvp_status === "confirmed")
  const declined = households.filter((h) => h.rsvp_status === "declined")
  const pending = households.filter((h) => h.rsvp_status === "pending")
  const seatsConfirmed = confirmed.reduce((s, h) => s + (h.confirmed_seats ?? 0), 0)
  const seatsTotal = households.reduce((s, h) => s + h.max_seats, 0)

  const stats = [
    { label: "Casas", value: households.length, icon: Users },
    { label: "Confirmadas", value: confirmed.length, icon: CheckCircle },
    { label: "Pendentes", value: pending.length, icon: Clock },
    { label: "Recusadas", value: declined.length, icon: XCircle },
    { label: "Lugares (confirm./total)", value: `${seatsConfirmed}/${seatsTotal}`, icon: Armchair },
  ]

  return (
    <>
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
          Não consegui carregar a lista. Verifique se o Supabase está configurado e a
          migration foi aplicada. ({error.message})
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <s.icon className="w-4 h-4 text-primary" />
              <span className="text-xs">{s.label}</span>
            </div>
            <div className="text-2xl font-semibold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Convite genérico + importar */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-5 shadow-sm">
          <h2 className="font-medium text-foreground mb-1">Convite virtual (genérico)</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Link único para compartilhar com todos os convidados (WhatsApp, redes...).
          </p>
          <div className="flex items-center gap-4">
            <CopyLinkButton path="/convite" label="Copiar link do convite" />
            <Link
              href="/convite"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="w-4 h-4" /> Abrir
            </Link>
          </div>
        </div>

        <div className="bg-card rounded-lg p-5 shadow-sm">
          <h2 className="font-medium text-foreground mb-1">Lista de convidados</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Importe a planilha (.xlsx). Casas já existentes são atualizadas sem perder o RSVP.
          </p>
          <ImportForm />
        </div>
      </div>

      {/* Tabela */}
      <HouseholdTable households={households} />
    </>
  )
}
