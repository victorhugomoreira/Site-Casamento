// Edge Function: mercadopago-webhook
// Recebe as notificações do Mercado Pago e atualiza `public.payments`.
//
// Segurança: valida a assinatura HMAC do header `x-signature` e, mesmo assim,
// NUNCA confia no corpo da requisição — o status é relido da API do Mercado
// Pago usando o access token. Assim ninguém consegue marcar um presente como
// pago só chamando esta URL.
//
// Deploy (precisa de --no-verify-jwt: o Mercado Pago não manda JWT):
//   npx supabase functions deploy mercadopago-webhook --no-verify-jwt --project-ref <REF>
// Secrets necessárias:
//   npx supabase secrets set MERCADO_PAGO_ACCESS_TOKEN=<access_token> --project-ref <REF>
//   npx supabase secrets set MERCADO_PAGO_WEBHOOK_SECRET=<assinatura_secreta> --project-ref <REF>
//
// A "assinatura secreta" sai no painel do Mercado Pago em
// Suas integrações -> (aplicação) -> Webhooks -> Configurar notificações.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/** Comparação em tempo constante, para não vazar a assinatura por timing. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Valida o header `x-signature` conforme a documentação do Mercado Pago.
 * Manifesto: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 */
async function isValidSignature(req: Request, dataId: string, secret: string) {
  const signature = req.headers.get("x-signature")
  if (!signature) return false

  let ts = ""
  let v1 = ""
  for (const part of signature.split(",")) {
    const [rawKey, ...rest] = part.split("=")
    const key = rawKey?.trim()
    const value = rest.join("=").trim()
    if (key === "ts") ts = value
    else if (key === "v1") v1 = value
  }
  if (!ts || !v1) return false

  const requestId = req.headers.get("x-request-id") ?? ""
  // O Mercado Pago normaliza ids alfanuméricos para minúsculo no manifesto.
  const normalizedId = /[a-zA-Z]/.test(dataId) ? dataId.toLowerCase() : dataId

  const manifest = `id:${normalizedId};request-id:${requestId};ts:${ts};`
  const expected = await hmacSha256Hex(secret, manifest)
  return safeEqual(expected, v1)
}

/** Status do Mercado Pago que significam "dinheiro recebido". */
const APPROVED = new Set(["approved", "authorized"])

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok")
  // O Mercado Pago considera qualquer 2xx como entregue. Respondemos 200 mesmo
  // em casos ignorados para não gerar reenvio infinito; erros reais devolvem 5xx
  // para que ele tente de novo.
  if (req.method !== "POST") return new Response("ok", { status: 200 })

  try {
    const url = new URL(req.url)
    const body = await req.json().catch(() => ({} as Record<string, unknown>))

    const type = body?.type ?? body?.topic ?? url.searchParams.get("type")
    const dataId = String(
      body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "",
    )

    if (type !== "payment" || !dataId) {
      // Notificação de outro tópico (merchant_order, etc.) — não interessa aqui.
      return new Response("ignored", { status: 200 })
    }

    const secret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET")
    if (!secret) {
      console.error("MERCADO_PAGO_WEBHOOK_SECRET não configurada — webhook rejeitado.")
      return new Response("not configured", { status: 500 })
    }

    if (!(await isValidSignature(req, dataId, secret))) {
      console.warn("Assinatura inválida no webhook do Mercado Pago.")
      return new Response("invalid signature", { status: 401 })
    }

    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")
    if (!mpToken) {
      console.error("MERCADO_PAGO_ACCESS_TOKEN não configurada.")
      return new Response("not configured", { status: 500 })
    }

    // Relê o pagamento na fonte — o corpo do webhook não é confiável.
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    })
    if (!mpRes.ok) {
      console.error("Falha ao consultar o pagamento no Mercado Pago:", mpRes.status)
      return new Response("upstream error", { status: 502 })
    }
    const mpPayment = await mpRes.json()

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const status = String(mpPayment.status ?? "pending")
    const update = {
      mp_payment_id: String(mpPayment.id),
      status,
      status_detail: mpPayment.status_detail ?? null,
      paid_at: APPROVED.has(status)
        ? (mpPayment.date_approved ?? new Date().toISOString())
        : null,
    }

    // Casa pelo external_reference (nosso id) e, como reserva, pelo id do MP.
    const externalRef = mpPayment.external_reference
    const { data: updated } = externalRef
      ? await supabase.from("payments").update(update).eq("id", externalRef).select("id")
      : { data: null }

    if (!updated || updated.length === 0) {
      await supabase.from("payments").update(update).eq("mp_payment_id", String(mpPayment.id))
    }

    return new Response("ok", { status: 200 })
  } catch (e) {
    console.error("Erro no webhook do Mercado Pago:", e)
    return new Response("error", { status: 500 })
  }
})
