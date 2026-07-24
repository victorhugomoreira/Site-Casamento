import { Gift as GiftIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import type { Gift } from "@/lib/supabase/types"
import { PixBox } from "@/components/gifts/pix-box"

function formatPrice(price: number) {
  return Number(price).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export async function GiftsSection() {
  let gifts: Gift[] = []

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("gifts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(3)
    gifts = (data ?? []) as Gift[]
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
            Já construímos nosso lar com muito carinho e, felizmente, temos a maior parte do que
            precisamos. Por isso, nossa lista foi pensada de uma forma um pouco diferente! Reunimos
            alguns presentes divertidos, que representam sonhos, experiências e projetos do casal,
            além de algumas sugestões para quem prefere presentear de forma mais tradicional.
            Independentemente da sua escolha, o mais importante para nós é celebrar esse momento ao
            seu lado. 🤍
          </p>
        </div>

        {gifts.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 mb-16">
            <GiftIcon className="w-12 h-12 mx-auto mb-4 text-primary/60" />
            <p>Ainda não há presentes.</p>
          </div>
        ) : (
          <>
            {/* Presentes (do banco) */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {gifts.map((gift) => (
                <div
                  key={gift.id}
                  className="bg-card rounded-lg overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="aspect-square relative bg-secondary">
                    {gift.image_url ? (
                      <Image src={gift.image_url} alt={gift.name} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <GiftIcon className="w-12 h-12 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-lg font-medium text-foreground mb-1">{gift.name}</h3>
                    <p className="text-primary font-semibold text-xl mb-4 mt-auto">
                      R$ {formatPrice(gift.price)}
                    </p>
                    <Link
                      href={`/presentes/${gift.id}`}
                      className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-md hover:bg-accent transition-colors font-medium text-center"
                    >
                      Presentear
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Ver todos */}
            <div className="text-center mb-16">
              <Link
                href="/presentes"
                className="inline-block bg-primary text-primary-foreground py-3 px-8 rounded-md hover:bg-accent transition-colors font-medium"
              >
                Ver todos os presentes
              </Link>
            </div>
          </>
        )}

        {/* PIX */}
        <PixBox />
      </div>
    </section>
  )
}
