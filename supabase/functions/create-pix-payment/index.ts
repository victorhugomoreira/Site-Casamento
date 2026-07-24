// Edge Function: create-pix-payment
// Cria um pagamento PIX no Mercado Pago com o VALOR vindo do banco (tabela gifts),
// nunca do cliente. O front envia apenas o `gift_id`; o valor/descrição são
// buscados aqui com a service_role, evitando adulteração pela rota.
//
// Deploy:
//   npx supabase functions deploy create-pix-payment --no-verify-jwt --project-ref <REF>
// Secret necessária:
//   npx supabase secrets set MERCADO_PAGO_ACCESS_TOKEN=<seu_access_token> --project-ref <REF>

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405)
  }

  try {
    const { gift_id, payer_name, payer_email } = await req.json().catch(() => ({}))
    if (!gift_id || typeof gift_id !== "string") {
      return json({ error: "gift_id é obrigatório." }, 400)
    }

    // 1) Busca o presente no banco (fonte da verdade do valor)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const { data: gift, error } = await supabase
      .from("gifts")
      .select("id, name, price")
      .eq("id", gift_id)
      .single()

    if (error || !gift) {
      return json({ error: "Presente não encontrado." }, 404)
    }

    const amount = Number(gift.price)
    if (!(amount > 0)) {
      return json({ error: "Valor inválido para este presente." }, 400)
    }

    // 2) Cria o pagamento PIX no Mercado Pago
    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")
    if (!mpToken) {
      return json({ error: "Pagamento não configurado (token ausente)." }, 500)
    }

    const email =
      typeof payer_email === "string" && payer_email.includes("@")
        ? payer_email
        : "convidado@brunaevictorhugo.com.br"

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: Number(amount.toFixed(2)),
        description: `Presente de casamento: ${gift.name}`,
        payment_method_id: "pix",
        payer: {
          email,
          first_name:
            typeof payer_name === "string" && payer_name.trim()
              ? payer_name.trim()
              : undefined,
        },
      }),
    })

    const mpData = await mpRes.json()
    if (!mpRes.ok) {
      return json(
        { error: "Falha ao gerar o PIX no Mercado Pago.", details: mpData },
        502,
      )
    }

    const tx = mpData?.point_of_interaction?.transaction_data
    return json({
      payment_id: mpData.id,
      amount,
      gift_name: gift.name,
      qr_code: tx?.qr_code ?? null, // código copia e cola
      qr_code_base64: tx?.qr_code_base64 ?? null, // imagem PNG em base64
      ticket_url: tx?.ticket_url ?? null,
    })
  } catch (e) {
    return json({ error: "Erro inesperado.", details: String(e) }, 500)
  }
})
