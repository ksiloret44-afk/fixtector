import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma } from '@/lib/db-manager'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/invoices/bulk-update
 * Met à jour plusieurs factures en une seule opération
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 })
    }

    const body = await request.json()
    const { invoiceIds, paymentStatus } = body

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: 'Aucune facture sélectionnée' }, { status: 400 })
    }

    if (!paymentStatus || !['paid', 'unpaid', 'partial'].includes(paymentStatus)) {
      return NextResponse.json({ error: 'Statut de paiement invalide' }, { status: 400 })
    }

    // Mettre à jour toutes les factures
    const result = await companyPrisma.invoice.updateMany({
      where: {
        id: { in: invoiceIds },
      },
      data: {
        paymentStatus,
        ...(paymentStatus === 'paid' && { paidAt: new Date() }),
      },
    })

    return NextResponse.json({
      success: true,
      updated: result.count,
      message: `${result.count} facture(s) mise(s) à jour avec succès`,
    })
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour en masse:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour' },
      { status: 500 }
    )
  }
}


