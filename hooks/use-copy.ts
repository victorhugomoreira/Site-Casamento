"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Copia um texto e sinaliza "copiado!" por alguns segundos.
 * Substitui a lógica que estava repetida na chave PIX, no checkout e no admin.
 */
export function useCopy(resetMs = 2000) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Evita atualizar estado depois que o componente sai da tela.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        // Navegador sem permissão de área de transferência (ou HTTP): mostra para copiar na mão.
        window.prompt("Copie manualmente:", text)
        return
      }
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), resetMs)
    },
    [resetMs],
  )

  return { copied, copy }
}
