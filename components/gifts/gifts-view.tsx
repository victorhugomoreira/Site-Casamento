"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Gift as GiftIcon, Copy, Check } from "lucide-react"
import { useMemo, useState } from "react"
import type { Gift } from "@/lib/supabase/types"

function formatPrice(price: number) {
  return Number(price).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function GiftsView({ gifts }: { gifts: Gift[] }) {
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [copied, setCopied] = useState(false)

  const pixKey = "7f25dbc2-5f36-4e71-ba8f-d2796d09e787"

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const g of gifts) if (g.category) set.add(g.category)
    return ["Todos", ...Array.from(set)]
  }, [gifts])

  const filteredGifts =
    selectedCategory === "Todos"
      ? gifts
      : gifts.filter((gift) => gift.category === selectedCategory)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/#presentes"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Link>
            <h1 className="font-[family-name:var(--font-great-vibes)] text-3xl text-primary">
              Bruna & Victor Hugo
            </h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h2 className="font-[family-name:var(--font-great-vibes)] text-5xl md:text-6xl text-primary mb-4">
            Lista de Presentes
          </h2>
          <p className="text-muted-foreground tracking-wide max-w-2xl mx-auto">
            Já construímos nosso lar com muito carinho e, felizmente, temos a maior parte do que
            precisamos. Por isso, nossa lista foi pensada de uma forma um pouco diferente! Reunimos
            alguns presentes divertidos, que representam sonhos, experiências e projetos do casal,
            além de algumas sugestões para quem prefere presentear de forma mais tradicional.
            Independentemente da sua escolha, o mais importante para nós é celebrar esse momento ao
            seu lado. 🤍
          </p>
        </div>

        {gifts.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <GiftIcon className="w-12 h-12 mx-auto mb-4 text-primary/60" />
            <p>Nenhum presente cadastrado ainda. Volte em breve!</p>
          </div>
        ) : (
          <>
            {/* Category Filter */}
            {categories.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-primary/20"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            {/* Gifts Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
              {filteredGifts.map((gift) => (
                <div
                  key={gift.id}
                  className="bg-card rounded-lg overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="aspect-square relative bg-secondary">
                    {gift.image_url ? (
                      <Image
                        src={gift.image_url}
                        alt={gift.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <GiftIcon className="w-12 h-12 text-primary/40" />
                      </div>
                    )}
                    {gift.category && (
                      <span className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded">
                        {gift.category}
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-lg font-medium text-foreground mb-2">{gift.name}</h3>
                    {gift.description && (
                      <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-2">
                        {gift.description}
                      </p>
                    )}
                    <div className="mt-auto">
                      <p className="text-primary font-semibold text-xl mb-4">
                        R$ {formatPrice(gift.price)}
                      </p>
                      <Link
                        href={`/presentes/${gift.id}`}
                        className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-md hover:bg-accent transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <GiftIcon className="w-4 h-4" />
                        Presentear
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* PIX Section */}
        <div className="bg-card rounded-lg p-8 text-center shadow-sm border border-border max-w-xl mx-auto">
          <GiftIcon className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-medium text-foreground mb-4">PIX</h3>
          <p className="text-muted-foreground mb-6">
            Se preferir, você também pode fazer uma transferência via PIX
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

          {copied && <p className="text-primary text-sm mt-2">Chave PIX copiada!</p>}

          <div className="mt-6 text-sm text-muted-foreground">
            <p className="text-foreground font-medium">Bruna Rejane Andrea da Silva</p>
            <p>Mercado Pago</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-[family-name:var(--font-great-vibes)] text-2xl text-primary mb-2">
            Bruna & Victor Hugo
          </p>
          <p className="text-muted-foreground text-sm">10 de Outubro de 2026</p>
        </div>
      </footer>
    </main>
  )
}
