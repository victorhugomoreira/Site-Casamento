import { Gift as GiftIcon, Clock, Wallet } from "lucide-react"
import { formatPriceExact } from "@/lib/format"
import type { Payment } from "@/lib/supabase/types"

/** "2026-07-30T03:12:00Z" -> "30/07 às 00:12" (horário de Brasília). */
function formatMoment(iso: string) {
  return new Date(iso)
    .toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    })
    .replace(", ", " às ")
}

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint?: string
  icon: typeof Wallet
}) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

export function PaymentsReceived({
  paid,
  pending,
}: {
  paid: Payment[]
  pending: Payment[]
}) {
  const total = paid.reduce((sum, p) => sum + Number(p.amount), 0)
  const media = paid.length ? total / paid.length : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium text-foreground">Presentes recebidos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cada PIX confirmado pelo Mercado Pago aparece aqui automaticamente.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Total recebido"
          value={`R$ ${formatPriceExact(total)}`}
          icon={Wallet}
        />
        <Stat
          label="Presentes pagos"
          value={String(paid.length)}
          icon={GiftIcon}
        />
        <Stat
          label="Valor médio"
          value={`R$ ${formatPriceExact(media)}`}
          hint="Por presente confirmado"
          icon={GiftIcon}
        />
      </div>

      {/* Confirmados */}
      <section className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-medium text-foreground">Confirmados</h2>
        </div>

        {paid.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhum presente foi pago ainda. Assim que o primeiro PIX cair, ele aparece
            aqui — sem precisar atualizar nada à mão.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Quando</th>
                  <th className="text-left font-medium px-5 py-3">Presente</th>
                  <th className="text-left font-medium px-5 py-3">Quem presenteou</th>
                  <th className="text-right font-medium px-5 py-3">Valor</th>
                </tr>
              </thead>
              <tbody>
                {paid.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                      {formatMoment(p.paid_at ?? p.created_at)}
                    </td>
                    <td className="px-5 py-3 text-foreground">{p.gift_name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className="text-foreground">{p.payer_name ?? "Anônimo"}</span>
                      {p.payer_email && (
                        <span className="block text-xs text-muted-foreground">
                          {p.payer_email}
                        </span>
                      )}
                      {p.message && (
                        <span className="block text-xs text-muted-foreground italic mt-1">
                          “{p.message}”
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-primary whitespace-nowrap">
                      R$ {formatPriceExact(Number(p.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Aguardando pagamento */}
      {pending.length > 0 && (
        <section className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-medium text-foreground">Aguardando pagamento</h2>
          </div>
          <p className="px-5 pt-4 text-xs text-muted-foreground">
            QR Codes gerados que ainda não foram pagos. Expiram sozinhos — não é preciso
            fazer nada.
          </p>
          <ul className="divide-y divide-border mt-2">
            {pending.map((p) => (
              <li key={p.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-foreground truncate">{p.gift_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.payer_name ?? "Anônimo"} · gerado {formatMoment(p.created_at)}
                  </p>
                </div>
                <span className="text-muted-foreground whitespace-nowrap">
                  R$ {formatPriceExact(Number(p.amount))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
