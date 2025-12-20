import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserPrisma, getMainPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import RepairDetails from '@/components/RepairDetails'
import { notFound } from 'next/navigation'

export default async function RepairDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const companyPrisma = await getUserPrisma()
  if (!companyPrisma) {
    redirect('/')
  }

  const repair = await companyPrisma.repair.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      parts: {
        include: {
          part: true,
        },
      },
      quote: true,
      invoice: true,
    },
  })

  // Récupérer les informations de l'utilisateur depuis la base principale si nécessaire
  let userInfo = null
  if (repair?.userId) {
    const mainPrisma = getMainPrisma()
    userInfo = await mainPrisma.user.findUnique({
      where: { id: repair.userId },
      select: { id: true, name: true, email: true },
    })
  }

  if (!repair) {
    notFound()
  }

  // Ajouter userInfo à repair pour compatibilité avec le composant
  const repairWithUser = repair ? { ...repair, user: userInfo } : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {repairWithUser && <RepairDetails repair={repairWithUser} />}
        </div>
      </main>
    </div>
  )
}

