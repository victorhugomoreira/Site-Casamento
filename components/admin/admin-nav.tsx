"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Gift } from "lucide-react"

const links = [
  { href: "/admin/convidados", label: "Convidados", icon: Users },
  { href: "/admin/presentes", label: "Presentes", icon: Gift },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(link.href + "/")
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
