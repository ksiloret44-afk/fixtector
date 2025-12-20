import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma } from '@/lib/db-manager'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const formatType = searchParams.get('format') || 'csv'
    const period = searchParams.get('period') || 'month'

    // Récupérer les données
    const [repairs, invoices, customers] = await Promise.all([
      companyPrisma.repair.findMany({
        include: {
          customer: true,
          parts: {
            include: {
              part: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      companyPrisma.invoice.findMany({
        include: {
          customer: true,
          repair: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      companyPrisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    ])

    if (formatType === 'csv') {
      // Générer CSV
      let csv = 'Type,ID,Date,Client,Appareil,Statut,Montant\n'

      // Réparations
      repairs.forEach((repair) => {
        csv += `Réparation,${repair.ticketNumber},${format(new Date(repair.createdAt), 'dd/MM/yyyy')},${repair.customer.firstName} ${repair.customer.lastName},${repair.deviceType} ${repair.brand} ${repair.model},${repair.status},${repair.finalCost || repair.estimatedCost || 0}\n`
      })

      // Factures
      invoices.forEach((invoice) => {
        csv += `Facture,${invoice.invoiceNumber},${format(new Date(invoice.createdAt), 'dd/MM/yyyy')},${invoice.customer.firstName} ${invoice.customer.lastName},${invoice.repair.deviceType} ${invoice.repair.brand} ${invoice.repair.model},${invoice.paymentStatus},${invoice.finalAmount}\n`
      })

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="rapport-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
        },
      })
    } else {
      // Pour Excel, on retourne un CSV amélioré (pour l'instant)
      // TODO: Implémenter avec xlsx ou exceljs
      return NextResponse.json(
        { error: 'Export Excel à venir. Utilisez CSV pour l\'instant.' },
        { status: 501 }
      )
    }
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

