import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma, getCompanyDbPath, getCompanyPrisma } from '@/lib/db-manager'
import path from 'path'
import fs from 'fs'

const ABSOLUTE_ADMIN_EMAIL = 'rpphone@ik.me'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/admin/reset-data
 * Supprime toutes les données : clients, réparations, devis, factures
 * de toutes les entreprises
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== 'admin' || user.email !== ABSOLUTE_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Seul l\'administrateur absolu peut effectuer cette action' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { password, confirmation } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Mot de passe requis' },
        { status: 400 }
      )
    }

    if (confirmation !== 'DELETE') {
      return NextResponse.json(
        { error: 'Vous devez écrire DELETE pour confirmer' },
        { status: 400 }
      )
    }

    // Vérifier le mot de passe de l'admin absolu
    const mainPrisma = getMainPrisma()
    const adminUser = await mainPrisma.user.findUnique({
      where: { email: ABSOLUTE_ADMIN_EMAIL },
      select: { password: true },
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Administrateur absolu non trouvé' },
        { status: 404 }
      )
    }

    const bcrypt = require('bcryptjs')
    const isValidPassword = await bcrypt.compare(password, adminUser.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Récupérer toutes les entreprises
    const companies = await mainPrisma.company.findMany({
      select: { id: true },
    })

    let totalDeleted = {
      customers: 0,
      repairs: 0,
      quotes: 0,
      invoices: 0,
    }

    // Pour chaque entreprise, supprimer les données
    for (const company of companies) {
      const companyDbPath = getCompanyDbPath(company.id)
      
      if (!fs.existsSync(companyDbPath)) {
        continue
      }

      // Utiliser Prisma pour supprimer les données
      const companyPrisma = getCompanyPrisma(company.id)

      try {
        // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
        // Supprimer les factures
        const invoicesCount = await companyPrisma.invoice.deleteMany({})
        totalDeleted.invoices += invoicesCount.count

        // Supprimer les devis
        const quotesCount = await companyPrisma.quote.deleteMany({})
        totalDeleted.quotes += quotesCount.count

        // Supprimer les réparations (cela supprimera aussi les relations)
        const repairsCount = await companyPrisma.repair.deleteMany({})
        totalDeleted.repairs += repairsCount.count

        // Supprimer les clients
        const customersCount = await companyPrisma.customer.deleteMany({})
        totalDeleted.customers += customersCount.count

        await companyPrisma.$disconnect()
      } catch (error: any) {
        console.error(`Erreur lors de la suppression pour l'entreprise ${company.id}:`, error)
        await companyPrisma.$disconnect()
        // Continuer avec les autres entreprises
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Données supprimées avec succès',
      deleted: totalDeleted,
    })
  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error)
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue lors de la suppression' },
      { status: 500 }
    )
  }
}

