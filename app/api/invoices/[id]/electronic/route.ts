import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma, getMainPrisma } from '@/lib/db-manager'
import { generateUBLInvoice, encodeInvoiceXML } from '@/lib/electronic-invoice'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/invoices/[id]/electronic
 * Génère et retourne la facture électronique au format UBL 2.1 (XML)
 * Conforme à la réforme française 2025-2027
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Récupérer la facture
    const invoice = await companyPrisma.invoice.findUnique({
      where: { id: params.id },
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

    if (!invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // Récupérer les informations de l'entreprise
    const mainPrisma = getMainPrisma()
    const user = await mainPrisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json(
        { error: 'Informations d\'entreprise manquantes' },
        { status: 404 }
      )
    }

    const company = user.company

    // Préparer les lignes de facture
    const lines = invoice.repair.parts.map((rp: any, index: number) => ({
      id: (index + 1).toString(),
      description: rp.part.name,
      quantity: rp.quantity,
      unitPrice: rp.unitPrice,
      totalAmount: rp.quantity * rp.unitPrice,
      taxRate: invoice.taxRate,
      taxAmount: (rp.quantity * rp.unitPrice * invoice.taxRate) / 100,
    }))

    // Ajouter la main d'œuvre
    if (invoice.laborCost > 0) {
      lines.unshift({
        id: '1',
        description: 'Main d\'œuvre',
        quantity: 1,
        unitPrice: invoice.laborCost,
        totalAmount: invoice.laborCost,
        taxRate: invoice.taxRate,
        taxAmount: (invoice.laborCost * invoice.taxRate) / 100,
      })
    }

    // Préparer les données pour la facture électronique
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: new Date(invoice.createdAt),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
      company: {
        name: company.name,
        siret: company.siret || undefined,
        siren: company.siren || undefined,
        vatNumber: company.vatNumber || undefined,
        address: company.address || undefined,
        city: company.city || undefined,
        postalCode: company.postalCode || undefined,
        country: company.country || 'France',
        email: company.email || undefined,
        phone: company.phone || undefined,
        rcs: company.rcs || undefined,
        rcsCity: company.rcsCity || undefined,
        legalForm: company.legalForm || undefined,
      },
      customer: {
        firstName: invoice.customer.firstName,
        lastName: invoice.customer.lastName,
        email: invoice.customer.email || undefined,
        phone: invoice.customer.phone,
        address: invoice.customer.address || undefined,
        city: invoice.customer.city || undefined,
        postalCode: invoice.customer.postalCode || undefined,
        country: 'France',
        siret: undefined, // À compléter si le client est une entreprise
        vatNumber: undefined,
      },
      lines,
      totalHT: invoice.totalCost,
      totalTVA: invoice.taxAmount,
      totalTTC: invoice.finalAmount,
      currency: 'EUR',
      paymentTerms: invoice.paymentTerms || undefined,
      paymentDeadline: invoice.paymentDeadline || undefined,
    }

    // Générer le XML UBL
    const xml = generateUBLInvoice(invoiceData)

    // Mettre à jour la facture avec les informations électroniques
    await companyPrisma.invoice.update({
      where: { id: params.id },
      data: {
        electronicFormat: 'UBL2.1',
        electronicSent: true,
        electronicSentAt: new Date(),
        xmlData: encodeInvoiceXML(xml),
      },
    })

    // Retourner le XML
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="facture-${invoice.invoiceNumber}.xml"`,
      },
    })
  } catch (error) {
    console.error('Erreur lors de la génération de la facture électronique:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la génération de la facture électronique' },
      { status: 500 }
    )
  }
}

