import { NextResponse } from 'next/server'
import { getMainPrisma } from '@/lib/db-manager'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, isTrial = false } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    const prisma = getMainPrisma()

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur avec approbation automatique et abonnement actif par défaut
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'user',
        approved: true, // Auto-approuvé automatiquement
        approvedAt: new Date(),
        subscription: {
          create: {
            status: 'active',
            plan: 'standard',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
            lastPaymentStatus: 'succeeded',
            lastPaymentDate: new Date(),
          },
        },
      },
    })

    return NextResponse.json(
      { 
        message: 'Compte créé avec succès ! Votre compte est actif.',
        userId: user.id,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erreur lors de la création du compte:', error)
    
    let errorMessage = 'Une erreur est survenue'
    
    if (error.code === 'P2002') {
      errorMessage = 'Cet email est déjà utilisé'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

