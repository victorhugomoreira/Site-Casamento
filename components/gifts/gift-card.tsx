import Image from "next/image"
import Link from "next/link"
import { Gift as GiftIcon } from "lucide-react"
import { formatPrice } from "@/lib/format"
import type { Gift } from "@/lib/supabase/types"

/**
 * Card de presente usado na home (3 destaques) e na lista completa.
 * `showDetails` liga categoria + descrição, que só aparecem na lista.
 */
export function GiftCard({ gift, showDetails = false }: { gift: Gift; showDetails?: boolean }) {
  return (
    <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow flex flex-col">
      <div className="aspect-square relative bg-secondary">
        {gift.image_url ? (
          <Image
            src={gift.image_url}
            alt={gift.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 300px"
            loading="lazy"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <GiftIcon className="w-12 h-12 text-primary/40" />
          </div>
        )}
        {showDetails && gift.category && (
          <span className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded">
            {gift.category}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-medium text-foreground mb-2">{gift.name}</h3>
        {showDetails && gift.description && (
          <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-2">
            {gift.description}
          </p>
        )}
        <div className="mt-auto">
          <p className="text-primary font-semibold text-xl mb-4">R$ {formatPrice(gift.price)}</p>
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
  )
}
