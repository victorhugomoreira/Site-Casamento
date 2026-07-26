"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"

const GALLERY_FILES = [
  "SGF_2190", "SGF_1181", "SGF_1366", "SGF_1398", "SGF_1538",
  "SGF_1548", "SGF_1586", "SGF_1915", "SGF_1925", "SGF_1944",
  "SGF_2031", "SGF_2057", "SGF_2232",
]

const galleryImages = GALLERY_FILES.map((name, i) => ({
  src: `/images/carrocel/${name}.webp`,
  alt: `Bruna e Victor Hugo - Foto ${i + 1}`,
}))

const AUTOPLAY_MS = 4000
const SWIPE_THRESHOLD = 50
/** Quantos slides à frente/atrás já ficam baixados (o resto só carrega ao chegar perto). */
const PRELOAD_RADIUS = 1

export function GallerySection() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  /**
   * Fotos já liberadas para download. Cresce conforme o convidado navega e nunca
   * encolhe, então voltar um slide não baixa a imagem de novo.
   */
  const [loaded, setLoaded] = useState<Set<number>>(
    () => new Set([galleryImages.length - 1, 0, 1]),
  )

  // Estado do arraste (dedo no celular ou mouse no notebook)
  const dragStartX = useRef<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  const total = galleryImages.length

  const goTo = useCallback(
    (index: number) => setCurrent((index + total) % total),
    [total],
  )
  const goToPrevious = useCallback(() => goTo(current - 1), [current, goTo])
  const goToNext = useCallback(() => goTo(current + 1), [current, goTo])

  // Libera os vizinhos do slide atual para download
  useEffect(() => {
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
    if (isPaused) return
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

  return (
    <section id="galeria" className="py-20 md:py-32 bg-background">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Galeria" subtitle="Momentos especiais da nossa jornada" />

        {/* Carrossel */}
        <div
          className="relative overflow-hidden rounded-lg select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          role="region"
          aria-roledescription="carrossel"
          aria-label="Galeria de fotos"
        >
          <div
            className="flex touch-pan-y cursor-grab active:cursor-grabbing"
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
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className="relative w-full shrink-0 h-[60vh] md:h-[80vh] bg-secondary"
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
          {galleryImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all ${
                index === current ? "w-6 bg-primary" : "w-2 bg-primary/30 hover:bg-primary/50"
              }`}
              aria-label={`Ir para a foto ${index + 1}`}
              aria-current={index === current}
            />
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-muted-foreground mt-8 text-sm">
          * Fotos ilustrativas - Em breve compartilharemos nossas fotos oficiais
        </p>
      </div>
    </section>
  )
}
