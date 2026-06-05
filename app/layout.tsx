import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Cormorant_Garamond, Great_Vibes } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({ 
  variable: '--font-cormorant', 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700']
})

const greatVibes = Great_Vibes({
  variable: '--font-great-vibes',
  subsets: ['latin'],
  weight: '400'
})

export const metadata: Metadata = {
  title: 'Bruna & Victor | 10.10.2026',
  description: 'Celebre conosco o nosso casamento em Campo Grande - MS',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${greatVibes.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
