"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const galleryImages = [
  { src: "/images/carrocel/SGF_2190.jpg", alt: "Bruna e Victor Hugo - Foto 1" },
  { src: "/images/carrocel/SGF_1181.jpg", alt: "Bruna e Victor Hugo - Foto 2" },
  { src: "/images/carrocel/SGF_1366.jpg", alt: "Bruna e Victor Hugo - Foto 3" },
  { src: "/images/carrocel/SGF_1398.jpg", alt: "Bruna e Victor Hugo - Foto 4" },
  { src: "/images/carrocel/SGF_1538.jpg", alt: "Bruna e Victor Hugo - Foto 5" },
  { src: "/images/carrocel/SGF_1548.jpg", alt: "Bruna e Victor Hugo - Foto 6" },
  { src: "/images/carrocel/SGF_1586.jpg", alt: "Bruna e Victor Hugo - Foto 7" },
  { src: "/images/carrocel/SGF_1915.jpg", alt: "Bruna e Victor Hugo - Foto 8" },
  { src: "/images/carrocel/SGF_1925.jpg", alt: "Bruna e Victor Hugo - Foto 9" },
  { src: "/images/carrocel/SGF_1944.jpg", alt: "Bruna e Victor Hugo - Foto 10" },
  { src: "/images/carrocel/SGF_2031.jpg", alt: "Bruna e Victor Hugo - Foto 11" },
  { src: "/images/carrocel/SGF_2057.jpg", alt: "Bruna e Victor Hugo - Foto 12" },
  { src: "/images/carrocel/SGF_2232.jpg", alt: "Bruna e Victor Hugo - Foto 13" },
]

const AUTOPLAY_MS = 4000
const SWIPE_THRESHOLD = 50

export function GallerySection() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

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
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-great-vibes)] text-5xl md:text-6xl text-primary mb-4">
            Galeria
          </h2>
          <p className="text-muted-foreground tracking-wide">
            Momentos especiais da nossa jornada
          </p>
        </div>

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
              <div key={index} className="relative w-full shrink-0 h-[60vh] md:h-[80vh]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority={index === 0}
                  draggable={false}
                  className="object-cover pointer-events-none"
                />
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
