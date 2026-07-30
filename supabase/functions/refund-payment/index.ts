// Edge Function: refund-payment
// Estorna um PIX já aprovado, devolvendo o valor para quem pagou.
//
// DIFERENTE das outras funções: esta NÃO é pública. As de checkout são
// chamadas por convidado sem login; esta mexe com dinheiro, então exige um
// admin autenticado. A verificação é feita aqui dentro (auth.getUser com o
// token de quem chamou) e não apenas no gateway — a chave publicável do
// projeto sozinha não pode servir de senha para estornar pagamento.
//
// Deploy:
//   npx supabase functions deploy refund-payment --project-ref <REF>

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!

    // 1) Só admin logado. O token do usuário vem no Authorization.
    const authHeader = req.headers.get("Authorization") ?? ""
    const token = authHeader.replace(/^Bearer\s+/i, "").trim()
    if (!token) {
      return json({ error: "Não autorizado." }, 401)
    }

    const asUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: userData, error: userError } = await asUser.auth.getUser()
    if (userError || !userData?.user) {
      return json({ error: "Não autorizado." }, 401)
    }

    const admin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    // 2) Estar logado não basta: precisa constar em admin_users. Consultamos
    //    com a service_role para a resposta não depender de RLS.
    const { data: isAdmin } = await admin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle()

    if (!isAdmin) {
      console.warn(
        `Estorno negado: ${userData.user.email ?? userData.user.id} nao e admin.`,
      )
      return json({ error: "Você não tem permissão para estornar." }, 403)
    }

    const { payment_id } = await req.json().catch(() => ({}))
    if (typeof payment_id !== "string" || !UUID_RE.test(payment_id)) {
      return json({ error: "payment_id inválido." }, 400)
    }

    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")
    if (!mpToken) {
      return json({ error: "Pagamento não configurado (token ausente)." }, 500)
    }

    const { data: payment, error } = await admin
      .from("payments")
      .select("id, status, amount, gift_name, mp_payment_id")
      .eq("id", payment_id)
      .single()

    if (error || !payment) {
      return json({ error: "Pagamento não encontrado." }, 404)
    }
    if (!payment.mp_payment_id) {
      return json({ error: "Esta cobrança nunca chegou ao Mercado Pago." }, 400)
    }
    if (payment.status !== "approved" && payment.status !== "authorized") {
      return json(
        { error: `Só dá para estornar pagamento aprovado (este está "${payment.status}").` },
        409,
      )
    }

    // 2) Estorno total no Mercado Pago. Corpo vazio = devolve o valor inteiro.
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${payment.mp_payment_id}/refunds`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpToken}`,
          "Content-Type": "application/json",
          // Amarrada ao pagamento: clique duplo não vira estorno duplo.
          "X-Idempotency-Key": `refund-${payment.id}`,
        },
        body: "{}",
      },
    )

    const mpData = await mpRes.json()
    if (!mpRes.ok) {
      return json(
        { error: "O Mercado Pago recusou o estorno.", details: mpData },
        502,
      )
    }

    await admin
      .from("payments")
      .update({
        status: "refunded",
        status_detail: `estornado por ${userData.user.email ?? userData.user.id}`,
        refunded_by: userData.user.id,
        refunded_at: new Date().toISOString(),
        paid_at: null,
      })
      .eq("id", payment.id)

    return json({
      ok: true,
      payment_id: payment.id,
      refund_id: mpData.id,
      amount: mpData.amount ?? payment.amount,
      status: mpData.status,
    })
  } catch (e) {
    return json({ error: "Erro inesperado.", details: String(e) }, 500)
  }
})
