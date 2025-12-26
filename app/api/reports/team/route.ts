import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma, getMainPrisma } from '@/lib/db-manager'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const companyPrisma = await getUserPrisma()
    const mainPrisma = getMainPrisma()
    
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    // Définir les dates selon la période
    let startDate: Date
    let endDate: Date = new Date()

    if (period === 'week') {
      endDate = new Date()
      startDate = subDays(endDate, 7)
    } else if (period === 'year') {
      endDate = endOfYear(new Date())
      startDate = startOfYear(new Date())
    } else {
      // month (par défaut)
      endDate = endOfMonth(new Date())
      startDate = startOfMonth(new Date())
    }

    // Récupérer l'entreprise de l'utilisateur
    const currentUser = await mainPrisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { companyId: true },
    })

    if (!currentUser?.companyId) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    // Récupérer tous les collaborateurs de l'entreprise (y compris l'utilisateur actuel)
    const teamMembers = await mainPrisma.user.findMany({
      where: {
        companyId: currentUser.companyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: 'asc' },
    })

    // Pour chaque collaborateur, calculer les statistiques
    const teamStats = await Promise.all(
      teamMembers.map(async (member) => {
        // Réparations du collaborateur dans la période
        const repairs = await companyPrisma.repair.findMany({
          where: {
            userId: member.id,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            invoice: true, // Invoice est une relation 1-1 avec Repair
          },
        })

        // Statistiques des réparations
        const totalRepairs = repairs.length
        const completedRepairs = repairs.filter(r => r.status === 'completed').length
        const pendingRepairs = repairs.filter(r => r.status === 'pending').length
        const inProgressRepairs = repairs.filter(r => r.status === 'in_progress').length

        // Chiffre d'affaires généré (somme des factures payées liées aux réparations)
        const revenue = repairs.reduce((sum, repair) => {
          if (repair.invoice && repair.invoice.paymentStatus === 'paid') {
            return sum + repair.invoice.finalAmount
          }
          return sum
        }, 0)

        // Réparations terminées avec factures payées
        const completedWithPayment = repairs.filter(
          r => r.status === 'completed' && r.invoice && r.invoice.paymentStatus === 'paid'
        ).length

        return {
          userId: member.id,
          name: member.name,
          email: member.email,
          totalRepairs,
          completedRepairs,
          pendingRepairs,
          inProgressRepairs,
          revenue,
          completedWithPayment,
        }
      })
    )

    // Trier par chiffre d'affaires décroissant
    teamStats.sort((a, b) => b.revenue - a.revenue)

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      teamStats,
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des données' },
      { status: 500 }
    )
  }
}

