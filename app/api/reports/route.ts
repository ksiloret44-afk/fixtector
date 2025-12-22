import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma } from '@/lib/db-manager'
import { subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, format, eachDayOfInterval } from 'date-fns'
import { fr } from 'date-fns/locale'

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
    const period = searchParams.get('period') || 'month'

    // Définir les dates selon la période
    let startDate: Date
    let endDate: Date = new Date()
    let previousStartDate: Date
    let previousEndDate: Date

    if (period === 'week') {
      endDate = new Date()
      startDate = subDays(endDate, 7)
      previousEndDate = subDays(startDate, 1)
      previousStartDate = subDays(previousEndDate, 7)
    } else if (period === 'year') {
      endDate = endOfYear(new Date())
      startDate = startOfYear(new Date())
      const lastYear = new Date(new Date().getFullYear() - 1, 0, 1)
      previousStartDate = startOfYear(lastYear)
      previousEndDate = endOfYear(lastYear)
    } else {
      // month (par défaut)
      endDate = endOfMonth(new Date())
      startDate = startOfMonth(new Date())
      const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
      previousStartDate = startOfMonth(lastMonth)
      previousEndDate = endOfMonth(lastMonth)
    }

    // Revenus
    const [currentRevenue, previousRevenue, totalRevenue] = await Promise.all([
      companyPrisma.invoice.aggregate({
        _sum: { finalAmount: true },
        where: {
          paymentStatus: 'paid',
          paidAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      companyPrisma.invoice.aggregate({
        _sum: { finalAmount: true },
        where: {
          paymentStatus: 'paid',
          paidAt: {
            gte: previousStartDate,
            lte: previousEndDate,
          },
        },
      }),
      companyPrisma.invoice.aggregate({
        _sum: { finalAmount: true },
        where: { paymentStatus: 'paid' },
      }),
    ])

    const currentRevenueAmount = currentRevenue._sum.finalAmount || 0
    const previousRevenueAmount = previousRevenue._sum.finalAmount || 0
    const growth = previousRevenueAmount > 0
      ? ((currentRevenueAmount - previousRevenueAmount) / previousRevenueAmount) * 100
      : 0

    // Réparations
    const [totalRepairs, completedRepairs, pendingRepairs, inProgressRepairs] = await Promise.all([
      companyPrisma.repair.count(),
      companyPrisma.repair.count({ where: { status: 'completed' } }),
      companyPrisma.repair.count({ where: { status: 'pending' } }),
      companyPrisma.repair.count({ where: { status: 'in_progress' } }),
    ])

    // Clients
    const [totalCustomers, newCustomersThisMonth] = await Promise.all([
      companyPrisma.customer.count(),
      companyPrisma.customer.count({
        where: {
          createdAt: {
            gte: startOfMonth(new Date()),
            lte: endOfMonth(new Date()),
          },
        },
      }),
    ])

    // Revenus quotidiens
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const dailyRevenue = await Promise.all(
      days.map(async (day) => {
        const dayStart = new Date(day.setHours(0, 0, 0, 0))
        const dayEnd = new Date(day.setHours(23, 59, 59, 999))
        const revenue = await companyPrisma.invoice.aggregate({
          _sum: { finalAmount: true },
          where: {
            paymentStatus: 'paid',
            paidAt: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        })
        return {
          date: format(day, 'dd/MM'),
          revenue: revenue._sum.finalAmount || 0,
        }
      })
    )

    // Revenus mensuels (12 derniers mois)
    const monthlyRevenue = await Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const month = new Date()
        month.setMonth(month.getMonth() - i)
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)
        return { monthStart, monthEnd, monthName: format(month, 'MMM yyyy', { locale: fr }) }
      }).reverse().map(async ({ monthStart, monthEnd, monthName }) => {
        const revenue = await companyPrisma.invoice.aggregate({
          _sum: { finalAmount: true },
          where: {
            paymentStatus: 'paid',
            paidAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        })
        return {
          month: monthName,
          revenue: revenue._sum.finalAmount || 0,
        }
      })
    )

    // Réparations par statut
    const repairsByStatus = [
      { name: 'Terminées', value: completedRepairs },
      { name: 'En cours', value: inProgressRepairs },
      { name: 'En attente', value: pendingRepairs },
    ].filter(item => item.value > 0)

    // Top 5 clients par revenus
    const allInvoices = await companyPrisma.invoice.findMany({
      where: { paymentStatus: 'paid' },
      include: { customer: true },
    })

    const customerRevenue = new Map<string, { name: string; revenue: number }>()
    allInvoices.forEach((invoice) => {
      const customerId = invoice.customerId
      const customerName = `${invoice.customer.firstName} ${invoice.customer.lastName}`
      const current = customerRevenue.get(customerId) || { name: customerName, revenue: 0 }
      customerRevenue.set(customerId, {
        name: customerName,
        revenue: current.revenue + invoice.finalAmount,
      })
    })

    const topCustomers = Array.from(customerRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return NextResponse.json({
      revenue: {
        total: totalRevenue._sum.finalAmount || 0,
        thisMonth: currentRevenueAmount,
        lastMonth: previousRevenueAmount,
        growth,
      },
      repairs: {
        total: totalRepairs,
        completed: completedRepairs,
        pending: pendingRepairs,
        inProgress: inProgressRepairs,
      },
      customers: {
        total: totalCustomers,
        newThisMonth: newCustomersThisMonth,
      },
      dailyRevenue,
      monthlyRevenue,
      repairsByStatus,
      topCustomers,
    })
  } catch (error) {
    console.error('Erreur:', error)
    // Retourner une structure vide plutôt qu'une erreur pour éviter les crashes
    return NextResponse.json({
      revenue: {
        total: 0,
        thisMonth: 0,
        lastMonth: 0,
        growth: 0,
      },
      repairs: {
        total: 0,
        completed: 0,
        pending: 0,
        inProgress: 0,
      },
      customers: {
        total: 0,
        newThisMonth: 0,
      },
      dailyRevenue: [],
      monthlyRevenue: [],
      repairsByStatus: [],
      topCustomers: [],
    })
  }
}

