// Edge Function: create-pix-payment
// Cria uma cobrança PIX no Mercado Pago com o VALOR vindo do banco (tabela gifts),
// nunca do cliente. O front envia apenas o `gift_id`; o valor/descrição são
// buscados aqui com a service_role, evitando adulteração pela rota.
//
// Grava a cobrança em `public.payments` e devolve o QR Code. A confirmação do
// pagamento chega depois pela função `mercadopago-webhook`.
//
// Deploy:
//   npx supabase functions deploy create-pix-payment --no-verify-jwt --project-ref <REF>
// Secret necessária:
//   npx supabase secrets set MERCADO_PAGO_ACCESS_TOKEN=<access_token> --project-ref <REF>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

/** Data no formato que o Mercado Pago exige (ISO com offset), fuso de Brasília. */
function isoWithOffset(date: Date, offsetMinutes = -180) {
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000)
  const pad = (n: number, len = 2) => String(n).padStart(len, "0")
  const abs = Math.abs(offsetMinutes)
  const sign = offsetMinutes >= 0 ? "+" : "-"
  return (
    `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}` +
    `T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}` +
    `.${pad(shifted.getUTCMilliseconds(), 3)}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  )
}

/** Quebra "Maria Silva Souza" em first/last name para o payer do Mercado Pago. */
function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first: undefined, last: undefined }
  if (parts.length === 1) return { first: parts[0], last: undefined }
  return { first: parts[0], last: parts.slice(1).join(" ") }
}

/** Validade da cobrança PIX. */
const EXPIRES_IN_MINUTES = 30

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405)
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { gift_id, payer_name, payer_email, message } = body

    if (!gift_id || typeof gift_id !== "string") {
      return json({ error: "gift_id é obrigatório." }, 400)
    }

    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")
    if (!mpToken) {
      return json({ error: "Pagamento não configurado (token ausente)." }, 500)
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    // 1) Busca o presente no banco — fonte da verdade do valor.
    const { data: gift, error: giftError } = await supabase
      .from("gifts")
      .select("id, name, price")
      .eq("id", gift_id)
      .single()

    if (giftError || !gift) {
      return json({ error: "Presente não encontrado." }, 404)
    }

    const amount = Number(gift.price)
    if (!(amount > 0)) {
      return json({ error: "Valor inválido para este presente." }, 400)
    }

    const name = typeof payer_name === "string" ? payer_name.trim() : ""
    const email =
      typeof payer_email === "string" && payer_email.includes("@")
        ? payer_email.trim()
        : "convidado@brunaevictorhugo.com.br"
    const note =
      typeof message === "string" && message.trim()
        ? message.trim().slice(0, 500)
        : null

    const expiresAt = new Date(Date.now() + EXPIRES_IN_MINUTES * 60_000)

    // 2) Registra a cobrança ANTES de chamar o Mercado Pago, para termos um id
    //    próprio (external_reference) que o webhook usa para casar o retorno.
    const { data: payment, error: insertError } = await supabase
      .from("payments")
      .insert({
        gift_id: gift.id,
        gift_name: gift.name,
        amount,
        status: "creating",
        payer_name: name || null,
        payer_email: email,
        message: note,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single()

    if (insertError || !payment) {
      return json(
        { error: "Não foi possível registrar o pagamento.", details: insertError?.message },
        500,
      )
    }

    // 3) Cria a cobrança PIX no Mercado Pago.
    const { first, last } = splitName(name)

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": payment.id,
      },
      body: JSON.stringify({
        transaction_amount: Number(amount.toFixed(2)),
        description: `Presente de casamento: ${gift.name}`,
        payment_method_id: "pix",
        external_reference: payment.id,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        date_of_expiration: isoWithOffset(expiresAt),
        payer: { email, first_name: first, last_name: last },
      }),
    })

    const mpData = await mpRes.json()

    if (!mpRes.ok) {
      await supabase
        .from("payments")
        .update({ status: "error", status_detail: JSON.stringify(mpData).slice(0, 500) })
        .eq("id", payment.id)

      return json(
        { error: "Falha ao gerar o PIX no Mercado Pago.", details: mpData },
        502,
      )
    }

    const tx = mpData?.point_of_interaction?.transaction_data ?? {}

    // 4) Guarda o QR Code e o id do Mercado Pago.
    await supabase
      .from("payments")
      .update({
        mp_payment_id: String(mpData.id),
        status: mpData.status ?? "pending",
        status_detail: mpData.status_detail ?? null,
        qr_code: tx.qr_code ?? null,
        qr_code_base64: tx.qr_code_base64 ?? null,
        ticket_url: tx.ticket_url ?? null,
      })
      .eq("id", payment.id)

    return json({
      payment_id: payment.id, // id interno — use para consultar o status
      status: mpData.status ?? "pending",
      amount,
      gift_name: gift.name,
      expires_at: expiresAt.toISOString(),
      qr_code: tx.qr_code ?? null, // código copia e cola
      qr_code_base64: tx.qr_code_base64 ?? null, // imagem PNG em base64
      ticket_url: tx.ticket_url ?? null,
    })
  } catch (e) {
    return json({ error: "Erro inesperado.", details: String(e) }, 500)
  }
})
