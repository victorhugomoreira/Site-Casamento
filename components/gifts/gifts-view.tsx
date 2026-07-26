"use client"

import Link from "next/link"
import { ArrowLeft, Gift as GiftIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { GiftCard } from "@/components/gifts/gift-card"
import { PixBox } from "@/components/gifts/pix-box"
import { SectionHeader } from "@/components/ui/section-header"
import { WEDDING, GIFTS_INTRO } from "@/lib/event"
import type { Gift } from "@/lib/supabase/types"

export function GiftsView({ gifts }: { gifts: Gift[] }) {
  const [selectedCategory, setSelectedCategory] = useState("Todos")

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
              {WEDDING.couple}
            </h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SectionHeader title="Lista de Presentes" subtitle={GIFTS_INTRO} className="mb-12" />

        {gifts.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <GiftIcon className="w-12 h-12 mx-auto mb-4 text-primary/60" />
            <p>Nenhum presente cadastrado ainda. Volte em breve!</p>
          </div>
        ) : (
          <>
            {/* Filtro por categoria */}
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

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
              {filteredGifts.map((gift) => (
                <GiftCard key={gift.id} gift={gift} showDetails />
              ))}
            </div>
          </>
        )}

        <PixBox />
      </div>

      <footer className="bg-card border-t border-border py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-[family-name:var(--font-great-vibes)] text-2xl text-primary mb-2">
            {WEDDING.couple}
          </p>
          <p className="text-muted-foreground text-sm">{WEDDING.dateShort}</p>
        </div>
      </footer>
    </main>
  )
}
