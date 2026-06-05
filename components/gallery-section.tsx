"use client"

import Image from "next/image"
import { useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

const galleryImages = [
  { src: "/images/couple-1.png", alt: "Bruna e Victor - Foto 1" },
  { src: "/images/couple-2.png", alt: "Bruna e Victor - Foto 2" },
  { src: "/images/gallery-1.png", alt: "Decoração" },
  { src: "/images/gallery-2.png", alt: "Buquê" },
  { src: "/images/gallery-3.png", alt: "Convites" },
  { src: "/images/ceremony.png", alt: "Local da Cerimônia" },
]

export function GallerySection() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  const openLightbox = (index: number) => setSelectedImage(index)
  const closeLightbox = () => setSelectedImage(null)
  
  const goToPrevious = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === 0 ? galleryImages.length - 1 : selectedImage - 1)
    }
  }
  
  const goToNext = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === galleryImages.length - 1 ? 0 : selectedImage + 1)
    }
  }

  return (
    <section id="galeria" className="py-20 md:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-great-vibes)] text-5xl md:text-6xl text-primary mb-4">
            Galeria
          </h2>
          <p className="text-muted-foreground tracking-wide">
            Momentos especiais da nossa jornada
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryImages.map((image, index) => (
            <button
              key={index}
              onClick={() => openLightbox(index)}
              className={`relative overflow-hidden rounded-lg group cursor-pointer ${
                index === 0 ? "col-span-2 row-span-2" : ""
              }`}
            >
              <div className={`relative ${index === 0 ? "aspect-square" : "aspect-square"}`}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300" />
              </div>
            </button>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-muted-foreground mt-8 text-sm">
          * Fotos ilustrativas - Em breve compartilharemos nossas fotos oficiais
        </p>
      </div>

      {/* Lightbox */}
      {selectedImage !== null && (
        <div className="fixed inset-0 z-50 bg-foreground/95 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-card hover:text-card/80 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={goToPrevious}
            className="absolute left-4 text-card hover:text-card/80 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>

          <div className="relative w-full max-w-4xl aspect-[4/3] mx-4">
            <Image
              src={galleryImages[selectedImage].src}
              alt={galleryImages[selectedImage].alt}
              fill
              className="object-contain"
            />
          </div>

          <button
            onClick={goToNext}
            className="absolute right-4 text-card hover:text-card/80 transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>
      )}
    </section>
  )
}
