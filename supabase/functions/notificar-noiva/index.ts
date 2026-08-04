// Edge Function: notificar-noiva
// Avisa a noiva por e-mail quando alguém responde o RSVP ou manda um presente.
//
// Não é chamada pelo site: quem chama são gatilhos no banco (ver a migration
// 0010). Assim o aviso sai independente do caminho que alterou o dado — pelo
// site, pelo painel ou por SQL na mão — e não existe rota pública que dê para
// usar como disparador de spam.
//
// Deploy (o gatilho não manda JWT, manda um segredo próprio no header):
//   npx supabase functions deploy notificar-noiva --no-verify-jwt --project-ref <REF>
// Secrets necessárias:
//   RESEND_API_KEY     -> chave da conta no Resend
//   NOTIFY_SECRET      -> mesmo valor gravado em public.app_config
//   NOTIFY_TO          -> (opcional) para quem avisar; padrão é a noiva
//   NOTIFY_FROM        -> (opcional) remetente verificado no Resend

const REMETENTE_PADRAO = "Casamento <nao-responda@moreiraprodutosgraficos.pro>"
const DESTINO_PADRAO = "brasimm1717@gmail.com"

/** Comparação em tempo constante, para não vazar o segredo por timing. */
function iguaisSeguro(a: string, b: string) {
  if (a.length !== b.length) return false
  let dif = 0
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return dif === 0
}

const dinheiro = (v: unknown) =>
  `R$ ${Number(v ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

/** Escapa o que veio do convidado — nome e recado entram no HTML do e-mail. */
const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

function montarEmail(p: Record<string, unknown>) {
  const bloco = (linhas: string[]) =>
    `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
                 max-width:520px;margin:0 auto;padding:24px;color:#2b2b2b">
       ${linhas.join("")}
       <p style="margin-top:28px;padding-top:16px;border-top:1px solid #e6e2dc;
                 font-size:12px;color:#8a8279">
         Aviso automático do site do casamento.
       </p>
     </div>`

  if (p.tipo === "rsvp") {
    const veio = p.status === "confirmed"
    const titulo = veio ? "Confirmou presença 🤍" : "Não poderá ir"
    const linhas = [
      `<h2 style="margin:0 0 4px;font-size:20px">${titulo}</h2>`,
      `<p style="margin:0 0 16px;font-size:16px"><strong>${esc(p.casa)}</strong></p>`,
    ]
    if (veio) {
      linhas.push(
        `<p style="margin:0 0 8px">Lugares confirmados: <strong>${esc(p.lugares)}</strong></p>`,
      )
    }
    if (p.respondeu) {
      linhas.push(`<p style="margin:0 0 8px">Quem respondeu: ${esc(p.respondeu)}</p>`)
    }
    if (p.recado) {
      linhas.push(
        `<p style="margin:16px 0 0;padding:12px;background:#f6f3ef;border-radius:8px;
                   font-style:italic">“${esc(p.recado)}”</p>`,
      )
    }
    return { assunto: `${titulo} — ${String(p.casa ?? "")}`, html: bloco(linhas) }
  }

  // presente
  const linhas = [
    `<h2 style="margin:0 0 4px;font-size:20px">Vocês receberam um presente 🎁</h2>`,
    `<p style="margin:0 0 16px;font-size:16px"><strong>${esc(p.presente)}</strong></p>`,
    `<p style="margin:0 0 8px;font-size:22px;color:#b08d57">
       <strong>${dinheiro(p.valor)}</strong></p>`,
    `<p style="margin:0 0 4px">De: ${esc(p.de) || "não informado"}</p>`,
    `<p style="margin:0;color:#8a8279;font-size:13px">
       Pago por ${p.metodo === "card" ? "cartão de crédito" : "PIX"}</p>`,
  ]
  if (p.recado) {
    linhas.push(
      `<p style="margin:16px 0 0;padding:12px;background:#f6f3ef;border-radius:8px;
                 font-style:italic">“${esc(p.recado)}”</p>`,
    )
  }
  return { assunto: `Presente recebido: ${dinheiro(p.valor)}`, html: bloco(linhas) }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok", { status: 200 })

  const segredo = Deno.env.get("NOTIFY_SECRET")
  if (!segredo) {
    console.error("NOTIFY_SECRET não configurada — notificação recusada.")
    return new Response("not configured", { status: 500 })
  }

  const enviado = req.headers.get("x-notify-secret") ?? ""
  if (!iguaisSeguro(enviado, segredo)) {
    return new Response("unauthorized", { status: 401 })
  }

  const chaveResend = Deno.env.get("RESEND_API_KEY")
  if (!chaveResend) {
    console.error("RESEND_API_KEY não configurada.")
    return new Response("not configured", { status: 500 })
  }

  try {
    const payload = await req.json().catch(() => ({}))
    const { assunto, html } = montarEmail(payload)

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chaveResend}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("NOTIFY_FROM") ?? REMETENTE_PADRAO,
        to: [Deno.env.get("NOTIFY_TO") ?? DESTINO_PADRAO],
        subject: assunto,
        html,
      }),
    })

    if (!resp.ok) {
      // Não relança: o gatilho é assíncrono e ninguém está esperando resposta.
      // O que importa é deixar rastro no log para dar para investigar depois.
      console.error("Resend recusou o envio:", resp.status, await resp.text())
      return new Response("upstream error", { status: 502 })
    }

    return new Response("ok", { status: 200 })
  } catch (e) {
    console.error("Erro ao notificar:", e)
    return new Response("error", { status: 500 })
  }
})
