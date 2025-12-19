import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navigation from '@/components/Navigation'
import NewInvoiceForm from '@/components/NewInvoiceForm'
import { notFound } from 'next/navigation'

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: { repairId?: string; duplicate?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Si on duplique une facture existante
  if (searchParams.duplicate) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: searchParams.duplicate },
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
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Nouvelle facture (depuis facture existante)
            </h1>
            <NewInvoiceForm
              repair={invoice.repair}
              userId={(session.user as any).id}
              initialData={{
                laborCost: invoice.laborCost,
                partsCost: invoice.partsCost,
                totalCost: invoice.totalCost,
                taxRate: invoice.taxRate,
                notes: invoice.notes,
              }}
            />
          </div>
        </main>
      </div>
    )
  }

  // Création depuis une réparation
  if (!searchParams.repairId) {
    redirect('/repairs')
  }

  const repair = await prisma.repair.findUnique({
    where: { id: searchParams.repairId },
    include: {
      customer: true,
      parts: {
        include: {
          part: true,
        },
      },
      quote: true,
    },
  })

  if (!repair) {
    notFound()
  }

  // Si une facture existe déjà, rediriger vers elle
  const existingInvoice = await prisma.invoice.findUnique({
    where: { repairId: repair.id },
  })

  if (existingInvoice) {
    redirect(`/invoices/${existingInvoice.id}`)
  }

  // Utiliser les données du devis si disponible
  const initialData = repair.quote ? {
    laborCost: repair.quote.laborCost,
    partsCost: repair.quote.partsCost,
    totalCost: repair.quote.totalCost,
    taxRate: 20.0,
    notes: repair.quote.notes,
  } : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Nouvelle facture
          </h1>
          <NewInvoiceForm
            repair={repair}
            userId={(session.user as any).id}
            initialData={initialData}
          />
        </div>
      </main>
    </div>
  )
}

