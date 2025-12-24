import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import InvoiceDetails from '@/components/InvoiceDetails'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function InvoiceDetailPage({
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
    notFound()
  }

  const invoice = await companyPrisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      repair: {
        include: {
          customer: true,
          parts: {
            include: {
              part: true,
            },
          },
        },
      },
      customer: true,
    },
  })

  if (!invoice) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <InvoiceDetails invoice={invoice} />
        </div>
      </main>
    </div>
  )
}

