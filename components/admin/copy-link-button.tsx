"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

interface Props {
  /** Caminho relativo, ex. "/convite" ou "/convite/abc123" */
  path: string
  label?: string
  className?: string
}

export function CopyLinkButton({ path, label = "Copiar link", className }: Props) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // fallback: seleciona via prompt
      window.prompt("Copie o link:", url)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={
        className ??
        "inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
      }
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copiado!" : label}
    </button>
  )
}
