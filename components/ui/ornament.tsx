import { cn } from "@/lib/utils"

/**
 * Filete com um losango ao centro — separador das seções do convite.
 * `tone="light"` para usar sobre foto escura.
 */
export function Ornament({
  className,
  tone = "gold",
}: {
  className?: string
  tone?: "gold" | "light"
}) {
  const linha =
    tone === "light"
      ? ["from-transparent to-card/60", "from-transparent to-card/60"]
      : ["from-transparent to-primary/50", "from-transparent to-primary/50"]
  const losango = tone === "light" ? "bg-card" : "bg-primary/70"

  return (
    <div className={cn("flex items-center justify-center gap-3", className)} aria-hidden="true">
      <span className={cn("h-px w-12 md:w-20 bg-gradient-to-r", linha[0])} />
      <span className={cn("w-1.5 h-1.5 rotate-45", losango)} />
      <span className={cn("h-px w-12 md:w-20 bg-gradient-to-l", linha[1])} />
    </div>
  )
}
