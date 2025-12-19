import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
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

  const repair = await prisma.repair.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      user: true,
      parts: {
        include: {
          part: true,
        },
      },
      quote: true,
      invoice: true,
    },
  })

  if (!repair) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <RepairDetails repair={repair} />
        </div>
      </main>
    </div>
  )
}

