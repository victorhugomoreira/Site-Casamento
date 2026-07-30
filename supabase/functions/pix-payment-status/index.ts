// Edge Function: pix-payment-status
// Consulta o status de uma cobrança PIX. O front chama em loop enquanto o
// convidado tem o QR Code na tela.
//
// Recebe o `payment_id` interno (uuid da tabela `payments`), que só quem gerou
// a cobrança conhece. Devolve apenas os campos necessários para a tela — nada
// de dados de outros convidados.
//
// Se o webhook ainda não chegou, consulta o Mercado Pago direto como reserva.
// Isso faz o fluxo funcionar mesmo em desenvolvimento, sem webhook configurado.
//
// Deploy:
//   npx supabase functions deploy pix-payment-status --no-verify-jwt --project-ref <REF>

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Status do Mercado Pago que significam "dinheiro recebido". */
const APPROVED = new Set(["approved", "authorized"])
/** Status que ainda podem virar aprovados — vale seguir consultando. */
const OPEN = new Set(["creating", "pending", "in_process", "in_mediation"])

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405)
  }

  try {
    const { payment_id } = await req.json().catch(() => ({}))
    if (typeof payment_id !== "string" || !UUID_RE.test(payment_id)) {
      return json({ error: "payment_id inválido." }, 400)
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const { data: payment, error } = await supabase
      .from("payments")
      .select("id, status, amount, gift_name, mp_payment_id, paid_at, expires_at")
      .eq("id", payment_id)
      .single()

    if (error || !payment) {
      return json({ error: "Pagamento não encontrado." }, 404)
    }

    let status = String(payment.status)
    let paidAt: string | null = payment.paid_at

    // Reserva: o webhook pode não ter chegado ainda (ou não estar configurado).
    if (OPEN.has(status) && payment.mp_payment_id) {
      const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")
      if (mpToken) {
        const mpRes = await fetch(
          `https://api.mercadopago.com/v1/payments/${payment.mp_payment_id}`,
          { headers: { Authorization: `Bearer ${mpToken}` } },
        )
        if (mpRes.ok) {
          const mpPayment = await mpRes.json()
          const fresh = String(mpPayment.status ?? status)
          if (fresh !== status) {
            status = fresh
            paidAt = APPROVED.has(fresh)
              ? (mpPayment.date_approved ?? new Date().toISOString())
              : null
            await supabase
              .from("payments")
              .update({
                status,
                status_detail: mpPayment.status_detail ?? null,
                paid_at: paidAt,
              })
              .eq("id", payment.id)
          }
        }
      }
    }

    const expired =
      !!payment.expires_at && new Date(payment.expires_at).getTime() < Date.now()

    return json({
      payment_id: payment.id,
      status,
      paid: APPROVED.has(status),
      pending: OPEN.has(status) && !expired,
      expired: expired && OPEN.has(status),
      amount: Number(payment.amount),
      gift_name: payment.gift_name,
      paid_at: paidAt,
    })
  } catch (e) {
    return json({ error: "Erro inesperado.", details: String(e) }, 500)
  }
})
