import { NextResponse } from 'next/server'
import { getMainPrisma, initCompanyDatabase } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const mainPrisma = getMainPrisma()

    // Récupérer l'utilisateur avant modification
    const existingUser = await mainPrisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Si l'utilisateur n'a pas encore d'entreprise et qu'il est approuvé pour la première fois
    let companyId = existingUser.companyId
    if (!companyId && !existingUser.approved) {
      // Créer une entreprise pour cet utilisateur
      const company = await mainPrisma.company.create({
        data: {
          name: `${existingUser.name} - Entreprise`,
          email: existingUser.email,
        },
      })
      companyId = company.id

      // Initialiser la base de données de l'entreprise
      try {
        await initCompanyDatabase(companyId)
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error)
        // On continue quand même, la base sera créée à la première utilisation
      }
    }

    const user = await mainPrisma.user.update({
      where: { id: params.id },
      data: {
        approved: true,
        approvedBy: (session.user as any).id,
        approvedAt: new Date(),
        companyId: companyId,
      },
      include: {
        company: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('Erreur lors de l\'approbation:', error)
    
    // Retourner un message d'erreur plus détaillé
    let errorMessage = 'Une erreur est survenue lors de l\'approbation'
    
    if (error.code === 'P2002') {
      errorMessage = 'Une contrainte unique a été violée'
    } else if (error.code === 'P2025') {
      errorMessage = 'Utilisateur non trouvé'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

