"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/admin"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError("E-mail ou senha inválidos.")
        return
      }
      router.replace(next)
      router.refresh()
    } catch {
      setError("Não foi possível conectar. Verifique a configuração do Supabase.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-great-vibes)] text-5xl text-primary mb-1">
            Bruna &amp; Victor
          </h1>
          <p className="text-muted-foreground tracking-wide text-sm">Área dos noivos</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-lg p-6 md:p-8 shadow-sm space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              placeholder="voce@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm tracking-widest uppercase disabled:opacity-60"
          >
            <Lock className="w-4 h-4" />
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  )
}
