// Edge Function: create-checkout-preference
// Cria uma "preference" do Checkout Pro do Mercado Pago e devolve o
// `init_point` — o convidado é redirecionado pra uma página do PRÓPRIO
// Mercado Pago pra digitar o cartão. Nenhum dado de cartão passa pelo nosso
// site nem pelo nosso backend, nem tokenizado: quem cuida de tudo é o MP.
//
// O valor vem do banco (tabela gifts), nunca do cliente — mesmo padrão do
// PIX. A confirmação chega depois pelo `mercadopago-webhook`, que já é
// genérico (não distingue PIX de cartão).
//
// Deploy:
//   npx supabase functions deploy create-checkout-preference --no-verify-jwt --project-ref <REF>
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

/** Quebra "Maria Silva Souza" em first/last name para o payer do Mercado Pago. */
function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first: undefined, last: undefined }
  if (parts.length === 1) return { first: parts[0], last: undefined }
  return { first: parts[0], last: parts.slice(1).join(" ") }
}

/**
 * De onde o convidado está chamando — usada pra montar as back_urls (pra
 * onde o Mercado Pago devolve o navegador depois do pagamento).
 *
 * Vem do header `Origin`, que o navegador define sozinho em toda chamada
 * fetch/invoke e uma página não consegue forjar via JS — diferente de um
 * campo no corpo da requisição, que qualquer um poderia mandar apontando
 * pra um site de phishing.
 */
function siteOriginFrom(req: Request) {
  const origin = req.headers.get("origin")
  if (origin && /^https?:\/\//.test(origin)) return origin
  return "https://brunaevictorhugo.vercel.app"
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
    const { gift_id, payer_name, payer_email } = body

    if (!gift_id || typeof gift_id !== "string") {
      return json({ error: "gift_id é obrigatório." }, 400)
    }

    const name = typeof payer_name === "string" ? payer_name.trim() : ""
    if (name.length < 2) {
      return json({ error: "Informe seu nome." }, 400)
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

    // 2) Registra a cobrança ANTES de chamar o Mercado Pago, para termos um id
    //    próprio (external_reference) que o webhook e a tela de retorno usam.
    const { data: payment, error: insertError } = await supabase
      .from("payments")
      .insert({
        gift_id: gift.id,
        gift_name: gift.name,
        amount,
        status: "creating",
        payment_method: "card",
        payer_name: name,
        payer_email:
          typeof payer_email === "string" && payer_email.includes("@")
            ? payer_email
            : null,
      })
      .select("id")
      .single()

    if (insertError || !payment) {
      return json(
        { error: "Não foi possível registrar o pagamento.", details: insertError?.message },
        500,
      )
    }

    // 3) Cria a preference no Checkout Pro. O convidado digita o cartão na
    //    página do próprio Mercado Pago, nunca na nossa.
    const site = siteOriginFrom(req)
    const backUrl = `${site}/presentes/${gift.id}`

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": payment.id,
      },
      body: JSON.stringify({
        items: [
          {
            title: `Presente de casamento: ${gift.name}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(amount.toFixed(2)),
          },
        ],
        external_reference: payment.id,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        back_urls: { success: backUrl, pending: backUrl, failure: backUrl },
        // O PIX já tem tela própria no site — aqui só interessa cartão, senão
        // o convidado veria PIX/boleto de novo dentro do Checkout Pro.
        payment_methods: {
          excluded_payment_types: [
            { id: "ticket" },
            { id: "atm" },
            { id: "bank_transfer" },
            { id: "digital_wallet" },
            { id: "digital_currency" },
          ],
        },
        // O Mercado Pago só aceita auto_return com back_url em HTTPS — em
        // localhost (testes) o convidado só perde o redirecionamento
        // automático e precisa clicar em "Voltar ao site" na página deles.
        ...(backUrl.startsWith("https://") ? { auto_return: "approved" } : {}),
        statement_descriptor: "CASAMENTO BEV",
        payer: {
          name: splitName(name).first,
          surname: splitName(name).last,
          email:
            typeof payer_email === "string" && payer_email.includes("@")
              ? payer_email
              : undefined,
        },
      }),
    })

    const mpData = await mpRes.json()

    if (!mpRes.ok || !mpData.init_point) {
      await supabase
        .from("payments")
        .update({ status: "error", status_detail: JSON.stringify(mpData).slice(0, 500) })
        .eq("id", payment.id)

      return json(
        { error: "Não foi possível iniciar o Checkout Pro.", details: mpData },
        502,
      )
    }

    return json({
      payment_id: payment.id,
      init_point: mpData.init_point as string,
    })
  } catch (e) {
    return json({ error: "Erro inesperado.", details: String(e) }, 500)
  }
})
