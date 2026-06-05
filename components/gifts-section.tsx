"use client"

import { Gift, Copy, Check } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

const featuredGifts = [
  {
    id: 1,
    name: "Jogo de Panelas",
    image: "/images/gifts/jogo-panelas.png",
    price: 890,
  },
  {
    id: 2,
    name: "Jogo de Cama",
    image: "/images/gifts/jogo-cama.png",
    price: 450,
  },
  {
    id: 3,
    name: "Cafeteira Expresso",
    image: "/images/gifts/cafeteira.png",
    price: 1200,
  },
]

export function GiftsSection() {
  const [copied, setCopied] = useState(false)
  
  const pixKey = "exemplo@pix.com" // Replace with actual PIX key
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="presentes" className="py-20 md:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-great-vibes)] text-5xl md:text-6xl text-primary mb-4">
            Lista de Presentes
          </h2>
          <p className="text-muted-foreground tracking-wide max-w-2xl mx-auto">
            Sua presença é o nosso maior presente! Mas se desejar nos presentear, 
            reunimos algumas sugestões que nos ajudarão a começar nossa nova vida juntos.
          </p>
        </div>

        {/* Featured Gifts */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {featuredGifts.map((gift) => (
            <div
              key={gift.id}
              className="bg-card rounded-lg overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow"
            >
              <div className="aspect-square relative bg-secondary">
                <Image
                  src={gift.image}
                  alt={gift.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-foreground mb-1">{gift.name}</h3>
                <p className="text-primary font-semibold text-xl mb-4">
                  R$ {gift.price.toLocaleString('pt-BR')}
                </p>
                <button className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-md hover:bg-accent transition-colors font-medium">
                  Presentear
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Ver Mais Button */}
        <div className="text-center mb-16">
          <Link
            href="/presentes"
            className="inline-block bg-primary text-primary-foreground py-3 px-8 rounded-md hover:bg-accent transition-colors font-medium"
          >
            Ver todos os presentes
          </Link>
        </div>

        {/* PIX Section */}
        <div className="bg-card rounded-lg p-8 text-center shadow-sm border border-border max-w-xl mx-auto">
          <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-medium text-foreground mb-4">PIX</h3>
          <p className="text-muted-foreground mb-6">
            Se preferir, você pode fazer uma transferência via PIX
          </p>
          
          <div className="flex items-center justify-center gap-3 bg-secondary rounded-lg p-4">
            <code className="text-foreground text-sm md:text-base flex-1 truncate">
              {pixKey}
            </code>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-background rounded-md transition-colors"
              aria-label="Copiar chave PIX"
            >
              {copied ? (
                <Check className="w-5 h-5 text-primary" />
              ) : (
                <Copy className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
          
          {copied && (
            <p className="text-primary text-sm mt-2">Chave PIX copiada!</p>
          )}
        </div>
      </div>
    </section>
  )
}
