import { NextResponse } from 'next/server'
import { getUserPrisma } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
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

    const body = await request.json()
    const { status } = body

    // Récupérer le devis avec toutes les informations nécessaires
    const quote = await companyPrisma.quote.findUnique({
      where: { id: params.id },
      include: {
        repair: true,
      },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Si le devis est accepté, créer automatiquement une facture
    if (status === 'accepted') {
      // Vérifier si une facture existe déjà pour cette réparation
      const existingInvoice = await companyPrisma.invoice.findUnique({
        where: { repairId: quote.repairId },
      })

      if (existingInvoice) {
        // Mettre à jour le statut du devis même si la facture existe déjà
        const updatedQuote = await companyPrisma.quote.update({
          where: { id: params.id },
          data: { status },
        })
        return NextResponse.json({ 
          quote: updatedQuote,
          invoice: existingInvoice,
          message: 'Devis accepté. Une facture existe déjà pour cette réparation.'
        })
      }

      // Calculer la TVA (20% par défaut)
      const taxRate = 20.0
      const taxAmount = (quote.totalCost * taxRate) / 100
      const finalAmount = quote.totalCost + taxAmount

      // Créer la facture dans une transaction
      try {
        const invoice = await companyPrisma.invoice.create({
          data: {
            repairId: quote.repairId,
            customerId: quote.customerId,
            userId: quote.userId,
            laborCost: quote.laborCost,
            partsCost: quote.partsCost,
            totalCost: quote.totalCost,
            taxRate,
            taxAmount,
            finalAmount,
            paymentStatus: 'unpaid',
            notes: quote.notes || null,
          },
        })

        // Mettre à jour le statut du devis
        const updatedQuote = await companyPrisma.quote.update({
          where: { id: params.id },
          data: { status },
        })

        console.log('✅ Facture créée avec succès:', invoice.id)
        return NextResponse.json({ 
          quote: updatedQuote,
          invoice,
          message: 'Devis accepté et facture créée avec succès'
        })
      } catch (invoiceError: any) {
        console.error('❌ Erreur lors de la création de la facture:', invoiceError)
        
        // Si l'erreur est que la facture existe déjà, mettre quand même à jour le devis
        if (invoiceError.code === 'P2002') {
          const existingInvoice = await companyPrisma.invoice.findUnique({
            where: { repairId: quote.repairId },
          })
          
          const updatedQuote = await companyPrisma.quote.update({
            where: { id: params.id },
            data: { status },
          })
          
          return NextResponse.json({ 
            quote: updatedQuote,
            invoice: existingInvoice,
            message: 'Devis accepté. Une facture existe déjà pour cette réparation.'
          })
        }
        
        throw invoiceError
      }
    }

    // Pour les autres statuts (rejected, etc.), juste mettre à jour le statut
    const updatedQuote = await companyPrisma.quote.update({
      where: { id: params.id },
      data: { status },
    })

    return NextResponse.json({ quote: updatedQuote })
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour:', error)
    
    // Gérer les erreurs spécifiques
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Une facture existe déjà pour cette réparation' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Récupérer le devis avec la réparation avant de le supprimer
    const quote = await companyPrisma.quote.findUnique({
      where: { id: params.id },
      include: {
        repair: true,
      },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Supprimer le devis
    await companyPrisma.quote.delete({
      where: { id: params.id },
    })

    // Remettre la réparation en statut "en cours"
    await companyPrisma.repair.update({
      where: { id: quote.repairId },
      data: { status: 'in_progress' },
    })

    return NextResponse.json({ message: 'Devis supprimé' })
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
