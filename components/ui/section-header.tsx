import { cn } from "@/lib/utils"

/**
 * Título em Great Vibes + subtítulo. Estava copiado em todas as seções da home
 * e nas páginas de presentes.
 */
export function SectionHeader({
  title,
  subtitle,
  className,
  size = "lg",
}: {
  title: string
  subtitle?: React.ReactNode
  className?: string
  /** "lg" nas seções da home, "md" em cabeçalhos internos. */
  size?: "lg" | "md"
}) {
  return (
    <div className={cn("text-center", className ?? "mb-16")}>
      <h2
        className={cn(
          "font-[family-name:var(--font-great-vibes)] text-primary mb-4",
          size === "lg" ? "text-5xl md:text-6xl" : "text-4xl md:text-5xl",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground tracking-wide max-w-2xl mx-auto">{subtitle}</p>
      )}
    </div>
  )
}
