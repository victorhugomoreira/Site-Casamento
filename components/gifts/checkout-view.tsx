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
  XCircle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatPriceExact } from "@/lib/format"
import { useCopy } from "@/hooks/use-copy"
import { buscarPendente, removerPendente, salvarPendente } from "@/lib/pix-pendentes"
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

/** O que a tela mostra depois que o convidado volta do Checkout Pro. */
type CardReturn = {
  status: string
  paid: boolean
  amount: number
  gift_name: string | null
}

declare global {
  interface Window {
    /** Preenchido pelo security.js do Mercado Pago. */
    MP_DEVICE_SESSION_ID?: string
  }
}

const onlyDigits = (s: string) => s.replace(/\D/g, "")

/** 000.000.000-00 conforme o convidado digita. */
function formatCpf(value: string) {
  const d = onlyDigits(value).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
}

/**
 * Confere os dígitos verificadores só para avisar o convidado antes de enviar.
 * Quem valida de verdade é a Edge Function.
 */
function isValidCpf(value: string) {
  const cpf = onlyDigits(value)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  for (const [len, weight] of [[9, 10], [10, 11]] as const) {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (weight - i)
    if (((sum * 10) % 11) % 10 !== Number(cpf[len])) return false
  }
  return true
}

export function CheckoutView({ gift }: { gift: Gift }) {
  const supabase = useMemo(() => createClient(), [])

  const [method, setMethod] = useState<"pix" | "card">("pix")
  const [loading, setLoading] = useState(false)
  const [pix, setPix] = useState<PixData | null>(null)
  const [status, setStatus] = useState<"pending" | "paid" | "expired">("pending")
  const [error, setError] = useState<string | null>(null)
  /** True enquanto verificamos se existe cobrança em aberto deste navegador. */
  const [restaurando, setRestaurando] = useState(true)
  /** True quando o QR na tela veio de uma cobrança anterior, não de agora. */
  const [recuperado, setRecuperado] = useState(false)
  const { copied, copy } = useCopy()

  const [payerName, setPayerName] = useState("")
  const [payerEmail, setPayerEmail] = useState("")
  const [payerDoc, setPayerDoc] = useState("")

  // O Mercado Pago exige nome e CPF do pagador para liberar a cobrança PIX.
  const canGenerate = payerName.trim().length > 2 && isValidCpf(payerDoc)

  // ---------- Cartão de crédito (Checkout Pro) ----------
  // O convidado é redirecionado pra uma página do PRÓPRIO Mercado Pago pra
  // digitar o cartão — nenhum dado de cartão passa pelo nosso site.
  const [cardLoading, setCardLoading] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  /** True só na primeira renderização, enquanto conferimos se acabamos de voltar do MP. */
  const [checkingReturn, setCheckingReturn] = useState(true)
  const [cardReturn, setCardReturn] = useState<CardReturn | null>(null)

  async function generatePix() {
    setError(null)
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke("create-pix-payment", {
        body: {
          gift_id: gift.id,
          payer_name: payerName.trim(),
          payer_doc: onlyDigits(payerDoc),
          payer_email: payerEmail || undefined,
          // Identificador do dispositivo: o antifraude do Mercado Pago usa
          // isso para não recusar pagamento legítimo por falta de contexto.
          device_id: window.MP_DEVICE_SESSION_ID,
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      const novo = data as PixData
      setStatus("pending")
      setRecuperado(false)
      setPix(novo)
      salvarPendente({
        payment_id: novo.payment_id,
        gift_id: gift.id,
        gift_name: gift.name,
        amount: novo.amount ?? gift.price,
        expires_at: novo.expires_at,
      })
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível gerar o PIX. Tente novamente.",
      )
    } finally {
      setLoading(false)
    }
  }

  // Cria a preference no Checkout Pro e manda o convidado pra lá.
  async function payWithCard() {
    setCardError(null)
    setCardLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-preference", {
        body: { gift_id: gift.id, payer_email: payerEmail || undefined },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      window.location.href = data.init_point as string
    } catch (e) {
      setCardError(
        e instanceof Error ? e.message : "Não foi possível iniciar o pagamento. Tente novamente.",
      )
      setCardLoading(false)
    }
  }

  // O security.js do Mercado Pago preenche window.MP_DEVICE_SESSION_ID, que o
  // antifraude deles usa para não recusar pagamento legítimo. Injetamos na mão
  // porque o next/script não aceita o atributo `view` que o script exige.
  useEffect(() => {
    const el = document.createElement("script")
    el.src = "https://www.mercadopago.com/v2/security.js"
    el.setAttribute("view", "checkout")
    document.body.appendChild(el)
    return () => el.remove()
  }, [])

  // Se a URL tem `external_reference` (o Mercado Pago sempre devolve isso nas
  // back_urls do Checkout Pro), acabamos de voltar de lá — confere o status
  // dessa cobrança e mostra o resultado, em vez do botão de pagar de novo.
  useEffect(() => {
    const externalReference = new URLSearchParams(window.location.search).get(
      "external_reference",
    )
    if (!externalReference) {
      setCheckingReturn(false)
      return
    }

    setMethod("card")
    let cancelled = false
    void (async () => {
      const { data } = await supabase.functions.invoke("pix-payment-status", {
        body: { payment_id: externalReference },
      })
      if (!cancelled && data && !data.error) {
        setCardReturn({
          status: String(data.status),
          paid: !!data.paid,
          amount: Number(data.amount ?? gift.price),
          gift_name: data.gift_name ?? gift.name,
        })
      }
      if (!cancelled) setCheckingReturn(false)
      // Limpa a URL para não reprocessar isso se o convidado atualizar a página.
      window.history.replaceState(null, "", window.location.pathname)
    })()

    return () => {
      cancelled = true
    }
    // Só na primeira renderização — é a URL com que a página abriu que importa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Se este navegador já gerou uma cobrança para este presente e ela ainda
  // vale, recupera o QR em vez de deixar o convidado gerar outra à toa.
  useEffect(() => {
    const pendente = buscarPendente(gift.id)
    if (!pendente) {
      setRestaurando(false)
      return
    }

    let cancelled = false
    void (async () => {
      const { data } = await supabase.functions.invoke("pix-payment-status", {
        body: { payment_id: pendente.payment_id },
      })
      if (cancelled) return

      if (data?.paid) {
        setPix(data as PixData)
        setStatus("paid")
        removerPendente(pendente.payment_id)
      } else if (data?.pending && data.qr_code) {
        setPix(data as PixData)
        setStatus("pending")
        setRecuperado(true)
      } else {
        // Expirou, foi cancelada ou recusada: começa do zero.
        removerPendente(pendente.payment_id)
      }
      setRestaurando(false)
    })()

    return () => {
      cancelled = true
    }
  }, [gift.id, supabase])

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
      if (data.paid) {
        setStatus("paid")
        removerPendente(pix.payment_id)
      } else if (data.expired) {
        setStatus("expired")
        removerPendente(pix.payment_id)
      }
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
            {restaurando ? (
              <div className="flex items-center justify-center gap-3 py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Verificando se você já tem um PIX em aberto...</span>
              </div>
            ) : !pix ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Geramos um QR Code PIX no valor do presente. O nome e o CPF são
                  exigidos pelo banco para emitir a cobrança — e ainda ajudam os noivos
                  a saber quem presenteou.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    value={payerDoc}
                    onChange={(e) => setPayerDoc(formatCpf(e.target.value))}
                    placeholder="Seu CPF"
                    inputMode="numeric"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder="Seu e-mail (opcional)"
                    autoComplete="email"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 sm:col-span-2"
                  />
                </div>

                {payerDoc && !isValidCpf(payerDoc) && (
                  <p className="text-sm text-muted-foreground">
                    Confira o CPF — os dígitos não batem.
                  </p>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                <button
                  onClick={generatePix}
                  disabled={loading || !canGenerate}
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
                        removerPendente(pix.payment_id)
                        setPix(null)
                        setStatus("pending")
                        setRecuperado(false)
                      }}
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-md hover:bg-accent transition-colors font-medium"
                    >
                      <QrCode className="w-5 h-5" />
                      Gerar novo QR Code
                    </button>
                  </div>
                ) : recuperado ? (
                  <div className="rounded-md bg-secondary p-3 text-sm text-foreground">
                    Você já tinha gerado um PIX para este presente e ele ainda é válido —
                    reaproveitamos o mesmo QR Code para não cobrar duas vezes.
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

        {/* Painel Cartão (Checkout Pro — o convidado paga numa página do Mercado Pago) */}
        {method === "card" && (
          <div className="bg-card rounded-lg border border-border shadow-sm p-6">
            {checkingReturn ? (
              <div className="flex items-center justify-center gap-3 py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Confirmando o pagamento...</span>
              </div>
            ) : cardReturn?.paid ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
                <h3 className="text-2xl font-medium text-foreground">
                  Pagamento confirmado!
                </h3>
                <p className="text-2xl font-semibold text-primary">
                  R$ {formatPriceExact(cardReturn.amount ?? gift.price)}
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
            ) : cardReturn && (cardReturn.status === "in_process" || cardReturn.status === "pending") ? (
              <div className="text-center space-y-3 py-4">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-foreground font-medium">Pagamento em análise</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Seu banco está avaliando esse pagamento. Assim que sair da análise, os
                  noivos são avisados — não precisa tentar de novo.
                </p>
              </div>
            ) : cardReturn ? (
              <div className="text-center space-y-3 py-4">
                <XCircle className="w-12 h-12 text-destructive mx-auto" />
                <p className="text-foreground font-medium">Não foi possível aprovar o cartão</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  O cartão foi recusado pelo Mercado Pago. Confira os dados ou tente outro cartão.
                </p>
                <button
                  onClick={() => setCardReturn(null)}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-md hover:bg-accent transition-colors font-medium"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Você será levado para uma página segura do Mercado Pago para digitar os
                  dados do cartão — nenhum dado de cartão passa pelo nosso site. Depois do
                  pagamento, você volta pra cá automaticamente.
                </p>

                {cardError && <p className="text-sm text-destructive">{cardError}</p>}

                <button
                  onClick={payWithCard}
                  disabled={cardLoading}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-md hover:bg-accent transition-colors font-medium disabled:opacity-60"
                >
                  {cardLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  {cardLoading ? "Preparando pagamento..." : "Pagar com cartão de crédito"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
