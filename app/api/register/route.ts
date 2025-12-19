import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

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

    // Vérifier si un Customer existe déjà avec cet email
    let customerId: string | undefined = undefined
    const existingCustomer = await prisma.customer.findFirst({
      where: { email: email },
    })

    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      // Créer un Customer automatiquement si l'email n'existe pas
      const nameParts = name.split(' ')
      const firstName = nameParts[0] || name
      const lastName = nameParts.slice(1).join(' ') || name
      
      const newCustomer = await prisma.customer.create({
        data: {
          firstName,
          lastName,
          email: email,
          phone: '', // Le client pourra compléter plus tard
        },
      })
      customerId = newCustomer.id
    }

    // Créer l'utilisateur (non approuvé par défaut, rôle client)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'client', // Par défaut, les nouveaux utilisateurs sont des clients
        approved: false, // Nécessite l'approbation d'un admin
        customerId: customerId,
      },
    })

    return NextResponse.json(
      { 
        message: 'Compte créé avec succès. En attente d\'approbation par un administrateur.',
        userId: user.id,
        requiresApproval: true
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erreur lors de la création du compte:', error)
    
    // Messages d'erreur plus spécifiques
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

