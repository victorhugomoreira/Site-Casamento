"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import type { GalleryImage } from "@/lib/gallery"

const AUTOPLAY_MS = 4000
const SWIPE_THRESHOLD = 50
/** Quantos slides à frente/atrás já ficam baixados (o resto só carrega ao chegar perto). */
const PRELOAD_RADIUS = 1

/** As fotos vêm do Supabase (painel dos noivos) — ver `lib/gallery.ts`. */
export function GallerySection({ images }: { images: GalleryImage[] }) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  /**
   * Fotos já liberadas para download. Cresce conforme o convidado navega e nunca
   * encolhe, então voltar um slide não baixa a imagem de novo.
   */
  const [loaded, setLoaded] = useState<Set<number>>(
    () => new Set([images.length - 1, 0, 1]),
  )

  // Estado do arraste (dedo no celular ou mouse no notebook)
  const dragStartX = useRef<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  const total = images.length

  const goTo = useCallback(
    (index: number) => setCurrent((index + total) % total),
    [total],
  )
  const goToPrevious = useCallback(() => goTo(current - 1), [current, goTo])
  const goToNext = useCallback(() => goTo(current + 1), [current, goTo])

  // Libera os vizinhos do slide atual para download
  useEffect(() => {
    if (!total) return
    setLoaded((prev) => {
      const next = new Set(prev)
      for (let d = -PRELOAD_RADIUS; d <= PRELOAD_RADIUS; d++) {
        next.add((current + d + total) % total)
      }
      return next.size === prev.size ? prev : next
    })
  }, [current, total])

  // Passagem automática
  useEffect(() => {
    if (isPaused || !total) return
    const id = setInterval(() => setCurrent((c) => (c + 1) % total), AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [isPaused, total])

  // Navegação com as setas do teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious()
      if (e.key === "ArrowRight") goToNext()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [goToPrevious, goToNext])

  // Arraste (pointer events cobrem dedo e mouse)
  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX
    setIsPaused(true)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return
    setDragOffset(e.clientX - dragStartX.current)
  }
  const endDrag = () => {
    if (dragStartX.current === null) return
    if (dragOffset > SWIPE_THRESHOLD) goToPrevious()
    else if (dragOffset < -SWIPE_THRESHOLD) goToNext()
    dragStartX.current = null
    setDragOffset(0)
    setIsPaused(false)
  }

  // Galeria vazia: some com a seção em vez de mostrar uma moldura em branco.
  if (total === 0) return null

  return (
    <section id="galeria" className="py-20 md:py-32 bg-background">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Galeria" subtitle="Momentos especiais da nossa jornada" />

        {/*
          Carrossel — as fotos são retrato (2:3). No mobile a moldura ocupa a
          largura toda (leve corte é aceitável); a partir do desktop ela vira um
          quadro 2:3 centralizado do tamanho da altura disponível, senão o
          object-cover esticaria a foto numa janela bem mais larga que alta e
          cortaria a maior parte da imagem.
        */}
        <div
          className="relative overflow-hidden rounded-lg select-none mx-auto h-[60vh] w-full md:h-[80vh] md:w-[min(calc(80vh*2/3),100%)]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          role="region"
          aria-roledescription="carrossel"
          aria-label="Galeria de fotos"
        >
          <div
            // h-full é essencial: os slides usam `h-full` e, sem altura aqui, a
            // porcentagem resolve contra `auto`. Como a única coisa dentro do
            // slide é um next/image com `fill` (absoluto, fora do fluxo), não
            // há conteúdo para esticar nada e o carrossel inteiro vira 0px.
            className="flex h-full touch-pan-y cursor-grab active:cursor-grabbing"
            style={{
              transform: `translateX(calc(-${current * 100}% + ${dragOffset}px))`,
              transition: dragStartX.current === null ? "transform 500ms ease" : "none",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            onPointerCancel={endDrag}
          >
            {images.map((image, index) => (
              <div
                key={image.src}
                className="relative w-full h-full shrink-0 bg-secondary"
                aria-hidden={index !== current}
              >
                {loaded.has(index) && (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 1600px) 100vw, 1600px"
                    priority={index === 0}
                    loading={index === 0 ? undefined : "lazy"}
                    draggable={false}
                    className="object-cover pointer-events-none"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Botões de navegação */}
          <button
            onClick={goToPrevious}
            className="absolute top-1/2 left-3 -translate-y-1/2 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-background/70 text-foreground hover:bg-background transition-colors"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute top-1/2 right-3 -translate-y-1/2 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-background/70 text-foreground hover:bg-background transition-colors"
            aria-label="Próxima foto"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Indicadores */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {images.map((image, index) => (
            <button
              key={image.src}
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all ${
                index === current ? "w-6 bg-primary" : "w-2 bg-primary/30 hover:bg-primary/50"
              }`}
              aria-label={`Ir para a foto ${index + 1}`}
              aria-current={index === current}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
