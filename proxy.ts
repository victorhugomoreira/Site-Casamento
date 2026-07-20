import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Protege /admin/** (exceto /admin/login) e mantém a sessão do Supabase
 * atualizada nos cookies.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Sem env configurada ainda: não quebra o site, só não autentica.
  if (!url || !anonKey) return response

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isLogin = pathname.startsWith("/admin/login")
  const isAdmin = pathname.startsWith("/admin")

  if (isAdmin && !isLogin && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/admin/login"
    redirectUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isLogin && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/admin"
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*"],
}
