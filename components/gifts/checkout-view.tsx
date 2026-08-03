"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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

/** Formato que o Card Payment Brick devolve no onSubmit. */
type CardFormData = {
  token: string
  issuer_id?: string
  payment_method_id: string
  installments: number
  payer: {
    email: string
    identification: { type: string; number: string }
  }
}

type CardBrickController = { unmount: () => void }

declare global {
  interface Window {
    /** Preenchido pelo security.js do Mercado Pago. */
    MP_DEVICE_SESSION_ID?: string
    /** Disponível depois que o SDK do Mercado Pago (v2) termina de carregar. */
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => {
      bricks: () => {
        create: (
          type: "cardPayment",
          containerId: string,
          settings: Record<string, unknown>,
        ) => Promise<CardBrickController>
      }
    }
  }
}

type CardResult = {
  payment_id: string
  status: string
  status_detail: string | null
  paid: boolean
  amount: number
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

  // ---------- Cartão de crédito (Card Payment Brick) ----------
  const [sdkReady, setSdkReady] = useState(false)
  const [cardStatus, setCardStatus] = useState<
    "idle" | "processing" | "approved" | "in_process" | "rejected"
  >("idle")
  const [cardError, setCardError] = useState<string | null>(null)
  const [cardResult, setCardResult] = useState<CardResult | null>(null)
  const brickRef = useRef<CardBrickController | null>(null)

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

  // SDK do Card Payment Brick. Carregado uma vez, independente do método
  // escolhido, para já estar pronto quando o convidado clicar em "Cartão".
  useEffect(() => {
    if (window.MercadoPago) {
      setSdkReady(true)
      return
    }
    const el = document.createElement("script")
    el.src = "https://sdk.mercadopago.com/js/v2"
    el.onload = () => setSdkReady(true)
    document.body.appendChild(el)
    return () => el.remove()
  }, [])

  // Manda o cartão já tokenizado (nunca os dados crus) para a Edge Function,
  // que relê o preço no banco e cria a cobrança no Mercado Pago.
  const submitCardPayment = useCallback(
    async (cardFormData: CardFormData) => {
      const { token, issuer_id, payment_method_id, installments, payer } = cardFormData
      const { data, error } = await supabase.functions.invoke("create-card-payment", {
        body: {
          gift_id: gift.id,
          token,
          issuer_id,
          payment_method_id,
          installments,
          payer,
          device_id: window.MP_DEVICE_SESSION_ID,
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data as CardResult
    },
    [gift.id, supabase],
  )

  // Renderiza o formulário de cartão sempre que ele precisa aparecer — na
  // primeira vez e de novo a cada "Tentar novamente" (cardStatus volta a "idle").
  useEffect(() => {
    if (method !== "card" || !sdkReady || cardStatus !== "idle") return

    let cancelled = false
    void (async () => {
      const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY
      if (!publicKey) {
        setCardError("Pagamento por cartão não configurado.")
        return
      }
      const mp = new window.MercadoPago!(publicKey, { locale: "pt-BR" })
      const controller = await mp.bricks().create("cardPayment", "card-payment-brick", {
        initialization: { amount: gift.price },
        customization: { paymentMethods: { maxInstallments: 1 } },
        callbacks: {
          onReady: () => {},
          onError: () => {
            if (!cancelled) {
              setCardError("Não foi possível carregar o formulário de cartão. Recarregue a página.")
            }
          },
          onSubmit: async (cardFormData: CardFormData) => {
            setCardError(null)
            setCardStatus("processing")
            try {
              const result = await submitCardPayment(cardFormData)
              if (cancelled) return
              setCardResult(result)
              if (result.paid) setCardStatus("approved")
              else if (result.status === "in_process" || result.status === "pending") {
                setCardStatus("in_process")
              } else {
                setCardStatus("rejected")
              }
            } catch (e) {
              if (cancelled) return
              setCardError(
                e instanceof Error ? e.message : "Não foi possível processar o cartão.",
              )
              setCardStatus("rejected")
            }
          },
        },
      })
      if (cancelled) {
        controller.unmount()
        return
      }
      brickRef.current = controller
    })()

    return () => {
      cancelled = true
      brickRef.current?.unmount()
      brickRef.current = null
    }
  }, [method, sdkReady, cardStatus, gift.price, submitCardPayment])

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

        {/* Painel Cartão */}
        {method === "card" && (
          <div className="bg-card rounded-lg border border-border shadow-sm p-6">
            {cardStatus === "approved" && cardResult ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
                <h3 className="text-2xl font-medium text-foreground">
                  Pagamento confirmado!
                </h3>
                <p className="text-2xl font-semibold text-primary">
                  R$ {formatPriceExact(cardResult.amount ?? gift.price)}
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
            ) : cardStatus === "in_process" ? (
              <div className="text-center space-y-3 py-4">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-foreground font-medium">Pagamento em análise</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Seu banco está avaliando esse pagamento. Assim que sair da análise, os
                  noivos são avisados — não precisa tentar de novo.
                </p>
              </div>
            ) : cardStatus === "rejected" ? (
              <div className="text-center space-y-3 py-4">
                <XCircle className="w-12 h-12 text-destructive mx-auto" />
                <p className="text-foreground font-medium">Não foi possível aprovar o cartão</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {cardError ?? "O cartão foi recusado. Confira os dados ou tente outro cartão."}
                </p>
                <button
                  onClick={() => {
                    setCardError(null)
                    setCardResult(null)
                    setCardStatus("idle")
                  }}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-md hover:bg-accent transition-colors font-medium"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {!sdkReady && (
                  <div className="flex items-center justify-center gap-3 py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Carregando formulário de cartão...</span>
                  </div>
                )}
                {cardError && <p className="text-sm text-destructive">{cardError}</p>}
                <div id="card-payment-brick" />
                {cardStatus === "processing" && (
                  <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando pagamento...
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
