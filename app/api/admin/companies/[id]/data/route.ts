import { NextResponse } from 'next/server'
import { getMainPrisma, getCompanyPrismaById, isUserAdmin } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/admin/companies/[id]/data
 * Récupère toutes les données d'une entreprise (pour les admins)
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(await isUserAdmin())) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'entreprise existe
    const mainPrisma = getMainPrisma()
    const company = await mainPrisma.company.findUnique({
      where: { id: params.id },
    })

    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 })
    }

    // Récupérer toutes les données de l'entreprise
    const companyPrisma = getCompanyPrismaById(params.id)

    const [customers, repairs, quotes, invoices, parts] = await Promise.all([
      companyPrisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      companyPrisma.repair.findMany({
        include: {
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      companyPrisma.quote.findMany({
        include: {
          customer: true,
          repair: {
            select: {
              id: true,
              ticketNumber: true,
              deviceType: true,
              brand: true,
              model: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      companyPrisma.invoice.findMany({
        include: {
          customer: true,
          repair: {
            select: {
              id: true,
              ticketNumber: true,
              deviceType: true,
              brand: true,
              model: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      companyPrisma.part.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      company,
      data: {
        customers,
        repairs,
        quotes,
        invoices,
        parts,
      },
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

