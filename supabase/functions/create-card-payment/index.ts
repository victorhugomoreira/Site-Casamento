// Edge Function: create-card-payment
// Cria uma cobrança de cartão de crédito no Mercado Pago com o VALOR vindo do
// banco (tabela gifts), nunca do cliente. O front tokeniza o cartão com o
// Card Payment Brick (o número, validade e CVV nunca passam por aqui) e manda
// só o token + dados do pagador; o valor é relido com a service_role.
//
// Diferente do PIX, a resposta já vem síncrona (approved/rejected/in_process)
// — não fica esperando o webhook. Mesmo assim gravamos em `public.payments` e
// o webhook (que já é genérico) confirma/atualiza se o status mudar depois.
//
// Deploy:
//   npx supabase functions deploy create-card-payment --no-verify-jwt --project-ref <REF>
// Secret necessária (a mesma já usada pelo PIX):
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

const digits = (s: string) => s.replace(/\D/g, "")

/** Dígitos verificadores do CPF. */
function isValidCpf(cpf: string) {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  for (const [len, weight] of [[9, 10], [10, 11]] as const) {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (weight - i)
    const rest = (sum * 10) % 11 % 10
    if (rest !== Number(cpf[len])) return false
  }
  return true
}

/** Dígitos verificadores do CNPJ. */
function isValidCnpj(cnpj: string) {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false
  const check = (len: number) => {
    let sum = 0
    let pos = len - 7
    for (let i = 0; i < len; i++) {
      sum += Number(cnpj[i]) * pos--
      if (pos < 2) pos = 9
    }
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }
  return check(12) === Number(cnpj[12]) && check(13) === Number(cnpj[13])
}

function parseDoc(raw: unknown): { type: "CPF" | "CNPJ"; number: string } | null {
  if (typeof raw !== "string") return null
  const value = digits(raw)
  if (value.length === 11 && isValidCpf(value)) return { type: "CPF", number: value }
  if (value.length === 14 && isValidCnpj(value)) return { type: "CNPJ", number: value }
  return null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405)
  }

  try {
    const body = await req.json().catch(() => ({}))
    const {
      gift_id,
      token,
      payment_method_id,
      issuer_id,
      installments,
      payer,
      device_id,
      message,
    } = body

    if (!gift_id || typeof gift_id !== "string") {
      return json({ error: "gift_id é obrigatório." }, 400)
    }
    if (!token || typeof token !== "string") {
      return json({ error: "Cartão não tokenizado." }, 400)
    }
    if (!payment_method_id || typeof payment_method_id !== "string") {
      return json({ error: "payment_method_id é obrigatório." }, 400)
    }

    const email =
      typeof payer?.email === "string" && payer.email.includes("@") ? payer.email : null
    if (!email) {
      return json({ error: "E-mail do pagador é obrigatório." }, 400)
    }

    const doc = parseDoc(payer?.identification?.number)
    if (!doc) {
      return json({ error: "Documento do pagador inválido." }, 400)
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

    const note =
      typeof message === "string" && message.trim()
        ? message.trim().slice(0, 500)
        : null

    const installmentsNum =
      Number.isFinite(Number(installments)) && Number(installments) > 0
        ? Math.floor(Number(installments))
        : 1

    // 2) Registra a cobrança ANTES de chamar o Mercado Pago, para termos um id
    //    próprio (external_reference) que o webhook usa para casar o retorno.
    const { data: payment, error: insertError } = await supabase
      .from("payments")
      .insert({
        gift_id: gift.id,
        gift_name: gift.name,
        amount,
        status: "creating",
        payer_email: email,
        message: note,
      })
      .select("id")
      .single()

    if (insertError || !payment) {
      return json(
        { error: "Não foi possível registrar o pagamento.", details: insertError?.message },
        500,
      )
    }

    // 3) Cria o pagamento no Mercado Pago com o cartão já tokenizado no front.
    const mpHeaders: Record<string, string> = {
      Authorization: `Bearer ${mpToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": payment.id,
    }
    if (typeof device_id === "string" && device_id.trim()) {
      mpHeaders["X-meli-session-id"] = device_id.trim()
    }

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: mpHeaders,
      body: JSON.stringify({
        transaction_amount: Number(amount.toFixed(2)),
        token,
        description: `Presente de casamento: ${gift.name}`,
        installments: installmentsNum,
        payment_method_id,
        issuer_id: issuer_id ? String(issuer_id) : undefined,
        external_reference: payment.id,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        payer: {
          email,
          identification: { type: doc.type, number: doc.number },
        },
      }),
    })

    const mpData = await mpRes.json()

    if (!mpRes.ok) {
      await supabase
        .from("payments")
        .update({ status: "error", status_detail: JSON.stringify(mpData).slice(0, 500) })
        .eq("id", payment.id)

      return json(
        { error: mpData?.message ?? "Pagamento recusado.", details: mpData },
        mpRes.status === 400 ? 400 : 502,
      )
    }

    const status = String(mpData.status ?? "pending")
    const APPROVED = status === "approved"

    // 4) Guarda o resultado — diferente do PIX, aqui o status final costuma
    //    já vir na resposta síncrona (o webhook só confirma depois).
    await supabase
      .from("payments")
      .update({
        mp_payment_id: String(mpData.id),
        status,
        status_detail: mpData.status_detail ?? null,
        paid_at: APPROVED ? (mpData.date_approved ?? new Date().toISOString()) : null,
      })
      .eq("id", payment.id)

    return json({
      payment_id: payment.id,
      status,
      status_detail: mpData.status_detail ?? null,
      paid: APPROVED,
      amount,
      gift_name: gift.name,
    })
  } catch (e) {
    return json({ error: "Erro inesperado.", details: String(e) }, 500)
  }
})
