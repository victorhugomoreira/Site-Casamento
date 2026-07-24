"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import {
  ArrowLeft,
  Gift as GiftIcon,
  QrCode,
  CreditCard,
  Copy,
  Check,
  Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Gift } from "@/lib/supabase/types"

type PixData = {
  qr_code: string | null
  qr_code_base64: string | null
  amount: number
  ticket_url: string | null
}

function formatPrice(price: number) {
  return Number(price).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function CheckoutView({ gift }: { gift: Gift }) {
  const supabase = createClient()

  const [method, setMethod] = useState<"pix" | "card">("pix")
  const [loading, setLoading] = useState(false)
  const [pix, setPix] = useState<PixData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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
      setPix(data as PixData)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível gerar o PIX. Tente novamente.",
      )
    } finally {
      setLoading(false)
    }
  }

  function copyCode() {
    if (!pix?.qr_code) return
    navigator.clipboard.writeText(pix.qr_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
              <Image src={gift.image_url} alt={gift.name} fill className="object-cover" />
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
            <p className="text-xl font-semibold text-primary">R$ {formatPrice(gift.price)}</p>
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
            ) : (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR Code no app do seu banco ou use o código copia e cola.
                </p>

                {pix.qr_code_base64 && (
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${pix.qr_code_base64}`}
                      alt="QR Code PIX"
                      className="w-56 h-56 rounded-lg border border-border"
                    />
                  </div>
                )}

                <p className="text-2xl font-semibold text-primary">
                  R$ {formatPrice(pix.amount ?? gift.price)}
                </p>

                {pix.qr_code && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-secondary rounded-lg p-3">
                      <code className="text-foreground text-xs flex-1 truncate text-left">
                        {pix.qr_code}
                      </code>
                      <button
                        onClick={copyCode}
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

                <p className="text-xs text-muted-foreground">
                  Após o pagamento, a confirmação pode levar alguns instantes. Muito obrigado
                  pelo carinho! 🤍
                </p>
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
