import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma, getMainPrisma } from '@/lib/db-manager'
import { generateInvoicePDF } from '@/lib/pdf-export'
const archiver = require('archiver')

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/invoices/export
 * Exporte plusieurs factures en PDF dans un fichier ZIP
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
    const { invoiceIds } = body

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: 'Aucune facture sélectionnée' }, { status: 400 })
    }

    // Récupérer les factures avec toutes les informations nécessaires
    const invoices = await companyPrisma.invoice.findMany({
      where: {
        id: { in: invoiceIds },
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

    if (invoices.length === 0) {
      return NextResponse.json({ error: 'Aucune facture trouvée' }, { status: 404 })
    }

    // Créer l'archive ZIP
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []

    archive.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    // Générer les PDFs et les ajouter à l'archive
    for (const invoice of invoices) {
      try {
        const invoiceData = {
          invoiceNumber: invoice.invoiceNumber,
          createdAt: invoice.createdAt,
          dueDate: invoice.dueDate || undefined,
          customer: {
            firstName: invoice.customer.firstName,
            lastName: invoice.customer.lastName,
            email: invoice.customer.email || undefined,
            phone: invoice.customer.phone,
            address: invoice.customer.address || undefined,
            city: invoice.customer.city || undefined,
            postalCode: invoice.customer.postalCode || undefined,
          },
          repair: invoice.repair ? {
            ticketNumber: invoice.repair.ticketNumber,
            deviceType: invoice.repair.deviceType,
            brand: invoice.repair.brand,
            model: invoice.repair.model,
            issue: invoice.repair.issue || '',
          } : undefined,
          laborCost: invoice.laborCost || 0,
          partsCost: invoice.partsCost || 0,
          totalCost: invoice.totalCost,
          taxRate: invoice.taxRate || 20,
          taxAmount: invoice.taxAmount || 0,
          finalAmount: invoice.finalAmount,
          paymentStatus: invoice.paymentStatus,
          paymentTerms: invoice.paymentTerms || undefined,
          paymentDeadline: invoice.paymentDeadline || undefined,
          latePaymentPenalty: invoice.latePaymentPenalty || undefined,
          legalMentions: invoice.legalMentions || undefined,
          warrantyInfo: invoice.warrantyInfo || undefined,
          notes: invoice.notes || undefined,
        }

        const parts = invoice.repair?.parts?.map(rp => ({
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
        const pdfDoc = await generateInvoicePDF(invoiceData, companyInfo, parts)
        const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'))
        
        archive.append(pdfBuffer, {
          name: `Facture-${invoice.invoiceNumber}.pdf`,
        })
      } catch (err) {
        console.error(`Erreur lors de la génération du PDF pour la facture ${invoice.id}:`, err)
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
              'Content-Disposition': `attachment; filename="factures-${new Date().toISOString().split('T')[0]}.zip"`,
            },
          })
        )
      })
    })
  } catch (error: any) {
    console.error('Erreur lors de l\'export des factures:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'export' },
      { status: 500 }
    )
  }
}

