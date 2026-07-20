import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import type { PublicHousehold } from "@/lib/supabase/types"
import { InviteCard } from "@/components/invite-card"
import { RsvpConfirmForm } from "@/components/rsvp-confirm-form"

export const dynamic = "force-dynamic"

export default async function ConviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  let household: PublicHousehold | null = null
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("households")
      .select("id, host_name, companions, children, max_seats, rsvp_status, confirmed_seats")
      .eq("invite_token", token)
      .maybeSingle()
    household = (data as PublicHousehold) ?? null
  } catch {
    household = null
  }

  if (!household) notFound()

  const firstName = household.host_name.split(/[\s-]/)[0]

  return (
    <InviteCard
      greeting={
        <>
          <p className="text-muted-foreground tracking-wide mb-1">Olá, {firstName}!</p>
          <p className="font-[family-name:var(--font-great-vibes)] text-3xl text-primary">
            Este convite é especialmente para você
          </p>
        </>
      }
    >
      <div id="rsvp">
        <RsvpConfirmForm household={household} token={token} />
      </div>
    </InviteCard>
  )
}
