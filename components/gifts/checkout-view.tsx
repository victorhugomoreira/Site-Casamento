"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Gift as GiftIcon,
  QrCode,
  CreditCard,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatPriceExact } from "@/lib/format"
import { useCopy } from "@/hooks/use-copy"
import type { Gift } from "@/lib/supabase/types"

type PixData = {
  payment_id: string
  qr_code: string | null
  qr_code_base64: string | null
  amount: number
  ticket_url: string | null
  expires_at: string | null
}

/** De quanto em quanto tempo perguntamos ao Supabase se o PIX já caiu. */
const POLL_MS = 5000

export function CheckoutView({ gift }: { gift: Gift }) {
  const supabase = useMemo(() => createClient(), [])

  const [method, setMethod] = useState<"pix" | "card">("pix")
  const [loading, setLoading] = useState(false)
  const [pix, setPix] = useState<PixData | null>(null)
  const [status, setStatus] = useState<"pending" | "paid" | "expired">("pending")
  const [error, setError] = useState<string | null>(null)
  const { copied, copy } = useCopy()

  const [payerName, setPayerName] = useState("")
  const [payerEmail, setPayerEmail] = useState("")

  async function generatePix() {
    setError(null)
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke("create-pix-payment", {
        body: {
          gift_id: gift.id,
          payer_name: payerName || undefined,
          payer_email: payerEmail || undefined,
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setStatus("pending")
      setPix(data as PixData)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível gerar o PIX. Tente novamente.",
      )
    } finally {
      setLoading(false)
    }
  }

  // Enquanto o QR Code está na tela, pergunta ao Supabase se o pagamento caiu.
  // Quem confirma é o webhook do Mercado Pago; aqui só lemos o resultado.
  useEffect(() => {
    if (!pix || status !== "pending") return

    let cancelled = false
    const timer = setInterval(async () => {
      const { data } = await supabase.functions.invoke("pix-payment-status", {
        body: { payment_id: pix.payment_id },
      })
      if (cancelled || !data) return
      if (data.paid) setStatus("paid")
      else if (data.expired) setStatus("expired")
    }, POLL_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [pix, status, supabase])

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/presentes"
            className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar para a lista</span>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Agradecimento */}
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-great-vibes)] text-4xl md:text-5xl text-primary mb-3">
            Muito obrigado!
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Ficamos imensamente felizes com o seu carinho. Escolha abaixo a forma de
            pagamento para concluir o seu presente. 🤍
          </p>
        </div>

        {/* Resumo do presente */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-4 flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden bg-secondary">
            {gift.image_url ? (
              <Image src={gift.image_url} alt={gift.name} fill sizes="80px" className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <GiftIcon className="w-8 h-8 text-primary/40" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-medium text-foreground">{gift.name}</h2>
            {gift.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{gift.description}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Valor</p>
            <p className="text-xl font-semibold text-primary">R$ {formatPriceExact(gift.price)}</p>
          </div>
        </div>

        {/* Seleção de método */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Forma de pagamento</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMethod("pix")}
              className={`flex items-center justify-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors ${
                method === "pix"
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              <QrCode className="w-5 h-5 text-primary" />
              PIX
            </button>
            <button
              onClick={() => setMethod("card")}
              className={`flex items-center justify-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors ${
                method === "card"
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              <CreditCard className="w-5 h-5 text-primary" />
              Cartão de crédito
            </button>
          </div>
        </div>

        {/* Painel PIX */}
        {method === "pix" && (
          <div className="bg-card rounded-lg border border-border shadow-sm p-6">
            {!pix ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Geramos um QR Code PIX no valor do presente. Se quiser, informe seu nome e
                  e-mail para que os noivos saibam quem presenteou.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Seu nome (opcional)"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder="Seu e-mail (opcional)"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <button
                  onClick={generatePix}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-md hover:bg-accent transition-colors font-medium disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <QrCode className="w-5 h-5" />
                  )}
                  {loading ? "Gerando PIX..." : "Gerar QR Code PIX"}
                </button>
              </div>
            ) : status === "paid" ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
                <h3 className="text-2xl font-medium text-foreground">
                  Pagamento confirmado!
                </h3>
                <p className="text-2xl font-semibold text-primary">
                  R$ {formatPriceExact(pix.amount ?? gift.price)}
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Recebemos o seu presente e não temos palavras para agradecer. Ver
                  vocês com a gente nesse dia já é o maior presente. 🤍
                </p>
                <Link
                  href="/presentes"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-md hover:bg-accent transition-colors font-medium"
                >
                  Voltar para a lista
                </Link>
              </div>
            ) : (
              <div className="text-center space-y-4">
                {status === "expired" ? (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <Clock className="w-10 h-10 text-muted-foreground" />
                    <p className="text-foreground font-medium">Este QR Code expirou</p>
                    <p className="text-sm text-muted-foreground">
                      Nenhuma cobrança foi feita. Gere um novo para continuar.
                    </p>
                    <button
                      onClick={() => {
                        setPix(null)
                        setStatus("pending")
                      }}
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-md hover:bg-accent transition-colors font-medium"
                    >
                      <QrCode className="w-5 h-5" />
                      Gerar novo QR Code
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Escaneie o QR Code no app do seu banco ou use o código copia e cola.
                  </p>
                )}

                {status === "pending" && pix.qr_code_base64 && (
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${pix.qr_code_base64}`}
                      alt="QR Code PIX"
                      className="w-56 h-56 rounded-lg border border-border"
                    />
                  </div>
                )}

                {status === "pending" && (
                  <p className="text-2xl font-semibold text-primary">
                    R$ {formatPriceExact(pix.amount ?? gift.price)}
                  </p>
                )}

                {status === "pending" && pix.qr_code && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-secondary rounded-lg p-3">
                      <code className="text-foreground text-xs flex-1 truncate text-left">
                        {pix.qr_code}
                      </code>
                      <button
                        onClick={() => pix.qr_code && copy(pix.qr_code)}
                        className="p-2 hover:bg-background rounded-md transition-colors shrink-0"
                        aria-label="Copiar código PIX"
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-primary" />
                        ) : (
                          <Copy className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {copied && <p className="text-primary text-sm">Código copiado!</p>}
                  </div>
                )}

                {status === "pending" && (
                  <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aguardando o pagamento — esta tela confirma sozinha assim que cair.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Painel Cartão (em breve) */}
        {method === "card" && (
          <div className="bg-card rounded-lg border border-border shadow-sm p-6 text-center">
            <CreditCard className="w-10 h-10 text-primary/60 mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">Pagamento com cartão em breve</p>
            <p className="text-sm text-muted-foreground">
              Por enquanto, você pode presentear via PIX. Em breve habilitaremos o cartão de
              crédito.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
