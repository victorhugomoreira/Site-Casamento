"use client"

import { Check, Copy } from "lucide-react"
import { useCopy } from "@/hooks/use-copy"

interface Props {
  /** Caminho relativo, ex. "/convite" ou "/convite/abc123" */
  path: string
  label?: string
  className?: string
}

export function CopyLinkButton({ path, label = "Copiar link", className }: Props) {
  const { copied, copy } = useCopy(1800)

  function handleClick() {
    const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path
    copy(url)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
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
