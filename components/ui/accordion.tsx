"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Acordeão de item único aberto por vez. O FAQ e as Indicações tinham cada um a
 * sua própria cópia dessa lógica.
 *
 * Usa grid-rows 0fr/1fr para animar sem precisar de `max-h` chutado — assim o
 * conteúdo nunca é cortado, independentemente do tamanho.
 */
export function Accordion({
  items,
  variant = "plain",
}: {
  items: { id: string; header: React.ReactNode; content: React.ReactNode }[]
  /** "plain" = card fixo (FAQ). "highlight" = destaca o item aberto (Indicações). */
  variant?: "plain" | "highlight"
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isOpen = openId === item.id
        return (
          <div
            key={item.id}
            className={cn(
              "rounded-lg overflow-hidden shadow-sm border transition-colors",
              variant === "highlight" && isOpen
                ? "border-primary bg-secondary/40"
                : "border-border bg-card",
            )}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-secondary/50 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="font-medium text-foreground">{item.header}</span>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-primary shrink-0 transition-transform duration-300",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            <div
              className={cn(
                "grid transition-all duration-500 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">{item.content}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
