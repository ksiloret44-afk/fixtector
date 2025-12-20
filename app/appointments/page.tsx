import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import AppointmentsCalendar from '@/components/AppointmentsCalendar'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AppointmentsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const companyPrisma = await getUserPrisma()
  if (!companyPrisma) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Calendrier des rendez-vous</h1>
          <AppointmentsCalendar />
        </div>
      </main>
    </div>
  )
}

