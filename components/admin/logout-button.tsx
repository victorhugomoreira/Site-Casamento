"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function LogoutButton() {
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/admin/login")
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Sair
    </button>
  )
}
