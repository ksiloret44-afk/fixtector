import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma, getMainPrisma } from '@/lib/db-manager'
import { generateQuotePDF } from '@/lib/pdf-export'

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

    // Récupérer le devis avec toutes les informations nécessaires
    const quote = await companyPrisma.quote.findUnique({
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

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Récupérer les informations de l'entreprise
    const mainPrisma = getMainPrisma()
    const user = await mainPrisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    const company = user?.company || {
      name: 'FixTector',
      email: user?.email || undefined,
      phone: null,
      address: null,
      city: null,
      postalCode: null,
      country: null,
      siret: null,
      siren: null,
      rcs: null,
      rcsCity: null,
      vatNumber: null,
      legalForm: null,
      capital: null,
      director: null,
      logoUrl: null,
    }

    // Préparer les données pour le PDF
    const parts = quote.repair.parts.map((rp: any) => ({
      name: rp.part.name,
      quantity: rp.quantity,
      unitPrice: rp.unitPrice,
      total: rp.quantity * rp.unitPrice,
    }))

    // Générer le PDF
    const pdf = await generateQuotePDF(
      {
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
        repair: {
          ticketNumber: quote.repair.ticketNumber,
          deviceType: quote.repair.deviceType,
          brand: quote.repair.brand,
          model: quote.repair.model,
          issue: quote.repair.issue,
        },
        laborCost: quote.laborCost,
        partsCost: quote.partsCost,
        totalCost: quote.totalCost,
        status: quote.status,
        paymentTerms: quote.paymentTerms || undefined,
        paymentDeadline: quote.paymentDeadline || undefined,
        latePaymentPenalty: quote.latePaymentPenalty || undefined,
        warrantyInfo: quote.warrantyInfo || undefined,
        notes: quote.notes || undefined,
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
        'Content-Disposition': `attachment; filename="devis-${quote.quoteNumber}.pdf"`,
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

