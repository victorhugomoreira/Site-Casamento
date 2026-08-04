import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  COOKIE_DESAFIO,
  DESAFIO_MINUTOS,
  consultarBloqueio,
  limparBloqueio,
  minutosRestantes,
  normalizarEmail,
  registrarErroDeSenha,
} from "@/lib/admin-login"

export const runtime = "nodejs"

/**
 * Etapa 1 do login do admin: confere a senha e dispara o código por e-mail.
 *
 * A senha é validada AQUI no servidor, com um client descartável — a sessão
 * que o Supabase devolve nunca chega ao browser. Só depois de acertar também
 * o código (etapa 2) é que a sessão é criada de verdade. Assim, saber só a
 * senha não entra no painel.
 */
export async function POST(request: Request) {
  let email = ""
  let password = ""
  try {
    const body = await request.json()
    email = normalizarEmail(String(body?.email ?? ""))
    password = String(body?.password ?? "")
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 })
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 })
  }

  // 1) O e-mail já está de castigo?
  const bloqueio = await consultarBloqueio(email)
  if (bloqueio.bloqueado && bloqueio.liberaEm) {
    return NextResponse.json(
      {
        error: `Muitas tentativas. Tente de novo em ${minutosRestantes(bloqueio.liberaEm)} min.`,
        bloqueado: true,
      },
      { status: 429 },
    )
  }

  // 2) Confere a senha sem persistir sessão nenhuma.
  const efemero = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const { data: login, error: erroLogin } = await efemero.auth.signInWithPassword({
    email,
    password,
  })

  if (erroLogin || !login?.user) {
    const restantes = await registrarErroDeSenha(email)
    return NextResponse.json(
      {
        error:
          restantes > 0
            ? `E-mail ou senha inválidos. Restam ${restantes} tentativas.`
            : "Muitas tentativas. Acesso bloqueado por 15 minutos.",
        bloqueado: restantes === 0,
      },
      { status: restantes === 0 ? 429 : 401 },
    )
  }

  const userId = login.user.id
  // Sessão criada só para validar a senha — descartada aqui.
  await efemero.auth.signOut({ scope: "local" })

  // 3) Senha certa não basta: precisa ser admin de verdade.
  const admin = createAdminClient()
  const { data: ehAdmin } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (!ehAdmin) {
    return NextResponse.json(
      { error: "Esta conta não tem acesso ao painel." },
      { status: 403 },
    )
  }

  // 4) Manda o código. `shouldCreateUser: false` evita criar conta por engano.
  const { error: erroOtp } = await efemero.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })

  if (erroOtp) {
    return NextResponse.json(
      { error: "Não foi possível enviar o código. Tente de novo em instantes." },
      { status: 502 },
    )
  }

  // 5) Abre o desafio. O id vai num cookie httpOnly e é a única prova de que
  //    a senha passou — o browser não consegue forjar nem ler.
  const expiraEm = new Date(Date.now() + DESAFIO_MINUTOS * 60_000)
  const { data: desafio, error: erroDesafio } = await admin
    .from("admin_login_challenges")
    .insert({ email, expires_at: expiraEm.toISOString() })
    .select("id")
    .single()

  if (erroDesafio || !desafio) {
    return NextResponse.json(
      { error: "Não foi possível iniciar a verificação." },
      { status: 500 },
    )
  }

  const jar = await cookies()
  jar.set(COOKIE_DESAFIO, desafio.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DESAFIO_MINUTOS * 60,
  })

  await limparBloqueio(email)

  return NextResponse.json({ ok: true, expiraEm: expiraEm.toISOString() })
}
