import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma, getMainPrisma } from '@/lib/db-manager'
import { generateQuotePDF } from '@/lib/pdf-export'
const archiver = require('archiver')

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/quotes/export
 * Exporte plusieurs devis en PDF dans un fichier ZIP
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

    const mainPrisma = getMainPrisma()
    const user = await mainPrisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 })
    }

    const body = await request.json()
    const { quoteIds } = body

    if (!quoteIds || !Array.isArray(quoteIds) || quoteIds.length === 0) {
      return NextResponse.json({ error: 'Aucun devis sélectionné' }, { status: 400 })
    }

    // Récupérer les devis avec toutes les informations nécessaires
    const quotes = await companyPrisma.quote.findMany({
      where: {
        id: { in: quoteIds },
      },
      include: {
        customer: true,
        repair: {
          include: {
            parts: {
              include: {
                part: true,
              },
            },
          },
        },
      },
    })

    if (quotes.length === 0) {
      return NextResponse.json({ error: 'Aucun devis trouvé' }, { status: 404 })
    }

    // Créer l'archive ZIP
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []

    archive.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    // Générer les PDFs et les ajouter à l'archive
    for (const quote of quotes) {
      try {
        const quoteData = {
          quoteNumber: quote.quoteNumber,
          createdAt: quote.createdAt,
          validUntil: quote.validUntil,
          customer: {
            firstName: quote.customer.firstName,
            lastName: quote.customer.lastName,
            email: quote.customer.email || undefined,
            phone: quote.customer.phone,
            address: quote.customer.address || undefined,
            city: quote.customer.city || undefined,
            postalCode: quote.customer.postalCode || undefined,
          },
          repair: quote.repair ? {
            ticketNumber: quote.repair.ticketNumber,
            deviceType: quote.repair.deviceType,
            brand: quote.repair.brand,
            model: quote.repair.model,
            issue: quote.repair.issue || '',
          } : undefined,
          laborCost: quote.laborCost || 0,
          partsCost: quote.partsCost || 0,
          totalCost: quote.totalCost,
          status: quote.status,
          paymentTerms: quote.paymentTerms || undefined,
          paymentDeadline: quote.paymentDeadline || undefined,
          latePaymentPenalty: quote.latePaymentPenalty || undefined,
          warrantyInfo: quote.warrantyInfo || undefined,
          notes: quote.notes || undefined,
        }

        const parts = quote.repair?.parts?.map(rp => ({
          name: rp.part.name,
          quantity: rp.quantity,
          unitPrice: rp.unitPrice,
          total: rp.quantity * rp.unitPrice,
        })) || []

        // Convertir null en undefined pour correspondre à CompanyInfo
        const companyInfo = {
          name: user.company.name,
          email: user.company.email || undefined,
          phone: user.company.phone || undefined,
          address: user.company.address || undefined,
          city: user.company.city || undefined,
          postalCode: user.company.postalCode || undefined,
          country: user.company.country || undefined,
          siret: user.company.siret || undefined,
          siren: user.company.siren || undefined,
          rcs: user.company.rcs || undefined,
          rcsCity: user.company.rcsCity || undefined,
          vatNumber: user.company.vatNumber || undefined,
          legalForm: user.company.legalForm || undefined,
          capital: user.company.capital || undefined,
          director: user.company.director || undefined,
          logoUrl: user.company.logoUrl || undefined,
        }
        const pdfDoc = await generateQuotePDF(quoteData, companyInfo, parts)
        const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'))
        
        archive.append(pdfBuffer, {
          name: `Devis-${quote.quoteNumber}.pdf`,
        })
      } catch (err) {
        console.error(`Erreur lors de la génération du PDF pour le devis ${quote.id}:`, err)
      }
    }

    await archive.finalize()

    // Attendre que l'archive soit complète
    return new Promise<NextResponse>((resolve) => {
      archive.on('end', () => {
        const zipBuffer = Buffer.concat(chunks)
        resolve(
          new NextResponse(zipBuffer, {
            headers: {
              'Content-Type': 'application/zip',
              'Content-Disposition': `attachment; filename="devis-${new Date().toISOString().split('T')[0]}.zip"`,
            },
          })
        )
      })
    })
  } catch (error: any) {
    console.error('Erreur lors de l\'export des devis:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'export' },
      { status: 500 }
    )
  }
}

