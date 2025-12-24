import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TrackingRedirectPage({
  params,
}: {
  params: { token: string }
}) {
  // Rediriger vers la vraie page de suivi
  redirect(`/track/${params.token}`)
}












