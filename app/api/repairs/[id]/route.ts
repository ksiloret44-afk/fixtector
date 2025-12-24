import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getUserPrisma } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendRepairStatusNotification } from '@/lib/notifications'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      status, 
      finalCost, 
      internalNotes,
      deviceType,
      brand,
      model,
      serialNumber,
      issue,
      estimatedCost,
      estimatedTime,
      notes,
    } = body

    console.log('[REPAIR API] Données reçues:', JSON.stringify(body, null, 2))
    
    const updateData: any = {}
    if (status !== undefined && status !== null && status !== '') {
      updateData.status = status
      console.log('[REPAIR API] ✅ Statut à mettre à jour:', status)
    } else {
      console.log('[REPAIR API] ⚠️ Aucun statut fourni dans la requête (status =', status, ')')
    }
    if (deviceType) updateData.deviceType = deviceType
    if (brand) updateData.brand = brand
    if (model) updateData.model = model
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber || null
    if (issue) updateData.issue = issue
    if (finalCost !== undefined) updateData.finalCost = finalCost ? parseFloat(finalCost) : null
    if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost ? parseFloat(estimatedCost) : null
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime || null
    if (notes !== undefined) updateData.notes = notes || null
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes || null
    if (status === 'completed') {
      updateData.completedAt = new Date()
      console.log('[REPAIR API] Date de completion ajoutée')
    }
    
    console.log('[REPAIR API] Données de mise à jour:', JSON.stringify(updateData, null, 2))

    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    // Récupérer la réparation avant mise à jour pour comparer le statut
    const oldRepair = await companyPrisma.repair.findUnique({
      where: { id: params.id },
      select: { status: true, trackingToken: true },
    })
    
    console.log('[REPAIR API] Statut actuel avant mise à jour:', oldRepair?.status)
    console.log('[REPAIR API] Nouveau statut demandé:', status)
    console.log('[REPAIR API] updateData contient:', updateData)

    console.log('[REPAIR API] Exécution de la mise à jour avec updateData:', JSON.stringify(updateData, null, 2))
    
    const repair = await companyPrisma.repair.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        ticketNumber: true,
        trackingToken: true,
        deviceType: true,
        brand: true,
        model: true,
        status: true,
        completedAt: true,
        estimatedCost: true,
        finalCost: true,
        estimatedTime: true,
        notes: true,
        customerId: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    })
    
    console.log('[REPAIR API] ✅ Réparation mise à jour avec succès')
    console.log('[REPAIR API] ✅ Statut dans la base de données:', repair.status)
    console.log('[REPAIR API] ✅ CompletedAt:', repair.completedAt)
    console.log('[REPAIR API] ✅ TrackingToken:', repair.trackingToken)

    // Créer automatiquement un devis si la réparation est terminée et qu'il n'y en a pas déjà un
    let createdQuoteId: string | null = null
    if (status === 'completed') {
      try {
        // Récupérer la réparation complète avec les pièces pour calculer les coûts
        const fullRepair = await companyPrisma.repair.findUnique({
          where: { id: repair.id },
          include: {
            parts: {
              include: {
                part: true,
              },
            },
            quote: true,
          },
        })

        // Vérifier si un devis existe déjà
        if (fullRepair && !fullRepair.quote) {
          // Calculer le coût des pièces
          const partsCost = fullRepair.parts?.reduce((sum: number, rp: any) => {
            return sum + (rp.unitPrice * rp.quantity)
          }, 0) || 0

          // Utiliser le coût final si disponible, sinon le coût estimé
          const laborCost = fullRepair.finalCost || fullRepair.estimatedCost || 0
          const totalCost = laborCost + partsCost

          // Date de validité : 30 jours à partir d'aujourd'hui
          const validUntil = new Date()
          validUntil.setDate(validUntil.getDate() + 30)

          // Créer le devis
          const newQuote = await companyPrisma.quote.create({
            data: {
              repairId: fullRepair.id,
              customerId: fullRepair.customerId,
              userId: fullRepair.userId,
              laborCost: laborCost,
              partsCost: partsCost,
              totalCost: totalCost,
              validUntil: validUntil, // DateTime dans Prisma, donc passer directement l'objet Date
              notes: fullRepair.notes || null,
            },
          })

          createdQuoteId = newQuote.id
          console.log('[REPAIR API] ✅ Devis créé automatiquement:', newQuote.id)
        } else if (fullRepair?.quote) {
          createdQuoteId = fullRepair.quote.id
          console.log('[REPAIR API] ℹ️ Un devis existe déjà pour cette réparation:', fullRepair.quote.id)
        }
      } catch (error) {
        // Ne pas faire échouer la requête si la création du devis échoue
        console.error('[REPAIR API] Erreur lors de la création automatique du devis:', error)
      }
    }

    // Envoyer une notification si le statut a changé
    if (status && oldRepair && status !== oldRepair.status) {
      try {
        // Récupérer le nom de l'entreprise depuis la base principale
        const { getMainPrisma } = await import('@/lib/db-manager')
        const mainPrisma = getMainPrisma()
        const session = await getServerSession(authOptions)
        
        let reviewToken: string | undefined
        
        // Si la réparation est terminée, créer un token d'avis
        if (status === 'completed') {
          // Vérifier si un avis existe déjà pour cette réparation
          const existingReview = await companyPrisma.review.findFirst({
            where: { repairId: repair.id },
          })
          
          if (!existingReview) {
            // Créer un token unique pour l'avis
            reviewToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
            
            // Créer l'entrée Review avec le token
            await companyPrisma.review.create({
              data: {
                repairId: repair.id,
                customerId: repair.customerId,
                reviewToken: reviewToken,
                rating: 0, // Pas encore noté
              },
            })
          } else {
            reviewToken = existingReview.reviewToken
          }
        }
        
        if (session) {
          const user = await mainPrisma.user.findUnique({
            where: { id: (session.user as any).id },
            include: { company: true },
          })

          // S'assurer que le trackingToken est bien récupéré
          const repairWithToken = await companyPrisma.repair.findUnique({
            where: { id: repair.id },
            select: { trackingToken: true },
          })

          console.log('[REPAIR NOTIFICATION] Tracking token:', repairWithToken?.trackingToken)
          console.log('[REPAIR NOTIFICATION] Review token:', reviewToken)
          console.log('[REPAIR NOTIFICATION] Repair ID:', repair.id)

          await sendRepairStatusNotification(companyPrisma, {
            customerName: `${repair.customer.firstName} ${repair.customer.lastName}`,
            customerEmail: repair.customer.email || undefined,
            customerPhone: repair.customer.phone,
            repairId: repair.id,
            ticketNumber: repair.ticketNumber,
            trackingToken: repairWithToken?.trackingToken || repair.trackingToken || undefined,
            deviceType: repair.deviceType,
            brand: repair.brand,
            model: repair.model,
            status: status,
            estimatedCost: repair.estimatedCost || undefined,
            finalCost: repair.finalCost || undefined,
            estimatedTime: repair.estimatedTime || undefined,
            notes: repair.notes || undefined,
            companyName: user?.company?.name,
          }, reviewToken)
        }
      } catch (error) {
        // Ne pas faire échouer la requête si la notification échoue
        console.error('Erreur lors de l\'envoi de la notification:', error)
      }
    }

    console.log('[REPAIR API] Réparation mise à jour, statut:', repair.status)
    console.log('[REPAIR API] Réparation retournée:', JSON.stringify(repair, null, 2))
    
    // Revalider les pages concernées
    try {
      // Revalider la page de détail de réparation
      revalidatePath(`/repairs/${repair.id}`)
      console.log('[REPAIR API] Page de détail revalidée pour:', repair.id)
      
      // Revalider la page de suivi si un trackingToken existe
      if (repair.trackingToken) {
        revalidatePath(`/track/${repair.trackingToken}`)
        console.log('[REPAIR API] Page de suivi revalidée pour:', repair.trackingToken)
      }
      
      // Revalider la liste des réparations
      revalidatePath('/repairs')
      console.log('[REPAIR API] Liste des réparations revalidée')
    } catch (error: any) {
      console.error('[REPAIR API] Erreur lors de la revalidation:', error.message)
    }
    
    return NextResponse.json({ repair, createdQuoteId })
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

