"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Undo2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatPriceExact } from "@/lib/format"

/**
 * Estorna um PIX recebido. Pede confirmação porque devolve dinheiro de verdade
 * e não tem desfazer — depois de estornado, o convidado teria que presentear
 * de novo.
 */
export function RefundButton({
  paymentId,
  amount,
  giftName,
}: {
  paymentId: string
  amount: number
  giftName: string | null
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refund() {
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.functions.invoke("refund-payment", {
        body: { payment_id: paymentId },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setConfirming(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível estornar.")
    } finally {
      setLoading(false)
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
      >
        <Undo2 className="w-3.5 h-3.5" />
        Estornar
      </button>
    )
  }

  return (
    <div className="text-right space-y-2">
      <p className="text-xs text-foreground">
        Devolver R$ {formatPriceExact(amount)}
        {giftName ? ` de "${giftName}"` : ""}?
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => {
            setConfirming(false)
            setError(null)
          }}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          onClick={refund}
          disabled={loading}
          className="inline-flex items-center gap-1.5 bg-destructive text-white px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {loading ? "Estornando..." : "Confirmar estorno"}
        </button>
      </div>
    </div>
  )
}
