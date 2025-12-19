import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navigation from '@/components/Navigation'
import EditRepairForm from '@/components/EditRepairForm'

export default async function EditRepairPage({
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
    },
  })

  if (!repair) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Modifier la réparation
          </h1>
          <EditRepairForm repair={repair} userId={(session.user as any).id} />
        </div>
      </main>
    </div>
  )
}

