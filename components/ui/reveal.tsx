"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Revela o conteúdo com um fade + subida suave quando ele entra na tela.
 *
 * Usa IntersectionObserver (sem biblioteca, sem listener de scroll) e só anima
 * uma vez por elemento. Quem tem "reduzir movimento" ligado no sistema vê o
 * conteúdo direto, sem animação.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  id,
  as: Tag = "div",
}: {
  children: React.ReactNode
  /** Atraso em ms, para escalonar elementos vizinhos. */
  delay?: number
  className?: string
  id?: string
  as?: "div" | "section" | "li"
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Sem animação para quem pediu menos movimento.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      // Dispara um pouco antes de entrar totalmente, para não parecer atrasado.
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as never}
      id={id}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        // A classe "reveal" existe para o <noscript> conseguir forçar a
        // visibilidade: sem JS, o conteúdo ficaria preso em opacity-0.
        "reveal transition-all duration-[900ms] ease-out motion-reduce:transition-none",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className,
      )}
    >
      {children}
    </Tag>
  )
}
