"use client"

import { Gift, Home, Plane, CreditCard, Copy, Check } from "lucide-react"
import { useState } from "react"

const giftCategories = [
  {
    icon: Home,
    title: "Nosso Lar",
    description: "Ajude-nos a construir nosso novo lar com itens para casa",
  },
  {
    icon: Plane,
    title: "Lua de Mel",
    description: "Contribua para a viagem dos nossos sonhos",
  },
  {
    icon: CreditCard,
    title: "Presente em Dinheiro",
    description: "Sua contribuição será muito bem-vinda",
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* Gift Categories */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {giftCategories.map((category) => (
            <div
              key={category.title}
              className="bg-card rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <category.icon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">{category.title}</h3>
              <p className="text-muted-foreground text-sm">{category.description}</p>
            </div>
          ))}
        </div>

        {/* PIX Section */}
        <div className="bg-card rounded-lg p-8 text-center shadow-sm">
          <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-medium text-foreground mb-4">PIX</h3>
          <p className="text-muted-foreground mb-6">
            Se preferir, você pode fazer uma transferência via PIX
          </p>
          
          <div className="flex items-center justify-center gap-3 bg-secondary rounded-lg p-4 max-w-md mx-auto">
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

        {/* Note */}
        <p className="text-center text-muted-foreground mt-8 text-sm">
          * Em breve disponibilizaremos nossa lista completa de presentes
        </p>
      </div>
    </section>
  )
}
