import type { Metadata } from "next"
import { WEDDING } from "@/lib/event"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: `Convite | ${WEDDING.couple}`,
  description: `Você está convidado para o casamento de ${WEDDING.couple} — ${WEDDING.dateLong}, ${WEDDING.city}.`,
  openGraph: {
    title: `Casamento de ${WEDDING.couple}`,
    description: `${WEDDING.dateLong} · ${WEDDING.city}. Confirme sua presença!`,
    images: ["/images/hero-wedding.png"],
    type: "website",
  },
}

export default function ConviteLayout({ children }: { children: React.ReactNode }) {
  return children
}
