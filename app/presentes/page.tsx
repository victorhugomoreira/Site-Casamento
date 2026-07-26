import { getGifts } from "@/lib/gifts"
import { GiftsView } from "@/components/gifts/gifts-view"

/** Página estática revalidada a cada 5 min (a lista muda raramente). */
export const revalidate = 300

export default async function GiftsPage() {
  const gifts = await getGifts()
  return <GiftsView gifts={gifts} />
}
