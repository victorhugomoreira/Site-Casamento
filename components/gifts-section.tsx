import { Gift as GiftIcon } from "lucide-react"
import Link from "next/link"
import { getGifts } from "@/lib/gifts"
import { GiftCard } from "@/components/gifts/gift-card"
import { PixBox } from "@/components/gifts/pix-box"
import { SectionHeader } from "@/components/ui/section-header"
import { GIFTS_INTRO } from "@/lib/event"

export async function GiftsSection() {
  const gifts = await getGifts(3)

  return (
    <section id="presentes" className="py-20 md:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Lista de Presentes" subtitle={GIFTS_INTRO} />

        {gifts.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 mb-16">
            <GiftIcon className="w-12 h-12 mx-auto mb-4 text-primary/60" />
            <p>Ainda não há presentes.</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {gifts.map((gift) => (
                <GiftCard key={gift.id} gift={gift} />
              ))}
            </div>

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

        <PixBox />
      </div>
    </section>
  )
}
