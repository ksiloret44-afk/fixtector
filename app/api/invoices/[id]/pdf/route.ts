import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma, getMainPrisma } from '@/lib/db-manager'
import { generateInvoicePDF } from '@/lib/pdf-export'
import { generateUBLInvoice, encodeInvoiceXML } from '@/lib/electronic-invoice'

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

    // Récupérer la facture avec toutes les informations nécessaires
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

    const company = user?.company || {
      name: 'FixTector',
      email: user?.email,
    }

    // Préparer les données pour le PDF
    const parts = invoice.repair.parts.map((rp: any) => ({
      name: rp.part.name,
      quantity: rp.quantity,
      unitPrice: rp.unitPrice,
      total: rp.quantity * rp.unitPrice,
    }))

    // Générer le PDF
    const pdf = await generateInvoicePDF(
      {
        invoiceNumber: invoice.invoiceNumber,
        createdAt: invoice.createdAt,
        customer: {
          firstName: invoice.customer.firstName,
          lastName: invoice.customer.lastName,
          email: invoice.customer.email || undefined,
          phone: invoice.customer.phone,
          address: invoice.customer.address || undefined,
          city: invoice.customer.city || undefined,
          postalCode: invoice.customer.postalCode || undefined,
        },
        repair: {
          ticketNumber: invoice.repair.ticketNumber,
          deviceType: invoice.repair.deviceType,
          brand: invoice.repair.brand,
          model: invoice.repair.model,
          issue: invoice.repair.issue,
        },
        laborCost: invoice.laborCost,
        partsCost: invoice.partsCost,
        totalCost: invoice.totalCost,
        taxRate: invoice.taxRate,
        taxAmount: invoice.taxAmount,
        finalAmount: invoice.finalAmount,
        paymentStatus: invoice.paymentStatus,
        dueDate: invoice.dueDate || undefined,
        paymentTerms: invoice.paymentTerms || undefined,
        paymentDeadline: invoice.paymentDeadline || undefined,
        latePaymentPenalty: invoice.latePaymentPenalty || undefined,
        legalMentions: invoice.legalMentions || undefined,
        warrantyInfo: invoice.warrantyInfo || undefined,
        notes: invoice.notes || undefined,
      },
      {
        name: company.name,
        email: company.email || undefined,
        phone: company.phone || undefined,
        address: company.address || undefined,
        city: company.city || undefined,
        postalCode: company.postalCode || undefined,
        country: company.country || undefined,
        siret: company.siret || undefined,
        siren: company.siren || undefined,
        rcs: company.rcs || undefined,
        rcsCity: company.rcsCity || undefined,
        vatNumber: company.vatNumber || undefined,
        legalForm: company.legalForm || undefined,
        capital: company.capital || undefined,
        director: company.director || undefined,
        logoUrl: company.logoUrl || undefined,
      },
      parts
    )

    // Convertir en buffer
    const pdfBlob = pdf.output('blob')
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Retourner le PDF
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la génération du PDF' },
      { status: 500 }
    )
  }
}

