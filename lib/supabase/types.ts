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
