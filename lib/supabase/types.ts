export type RsvpStatus = "pending" | "confirmed" | "declined"

export interface Child {
  name: string
  age?: number | null
}

export interface Household {
  id: string
  host_name: string
  phone: string | null
  companions: string[]
  children: Child[]
  max_seats: number
  paying_count: number | null
  invite_token: string
  rsvp_status: RsvpStatus
  confirmed_seats: number | null
  rsvp_message: string | null
  responder_name: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string
}

export interface Gift {
  id: string
  name: string
  description: string | null
  price: number
  category: string | null
  image_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface GalleryPhoto {
  id: string
  image_url: string
  caption: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

/** Uma cobrança PIX gerada no checkout. Escrita só pelas Edge Functions. */
export interface Payment {
  id: string
  gift_id: string | null
  gift_name: string | null
  mp_payment_id: string | null
  status: string
  status_detail: string | null
  amount: number
  payer_name: string | null
  payer_email: string | null
  message: string | null
  expires_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

/** Dados mínimos expostos publicamente no fluxo de RSVP (sem telefone, sem lista completa). */
export interface PublicHousehold {
  id: string
  host_name: string
  companions: string[]
  children: Child[]
  max_seats: number
  rsvp_status: RsvpStatus
  confirmed_seats: number | null
}
