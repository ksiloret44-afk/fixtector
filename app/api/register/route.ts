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

    // Pour les utilisateurs avec le rôle "client", on ne crée pas de Customer ici
    // Le Customer sera créé par l'entreprise lors de l'ajout du client
    // Pour les autres rôles (user, admin), ils auront une entreprise lors de l'approbation
    let customerId: string | undefined = undefined

    // Créer l'utilisateur (non approuvé par défaut, rôle user par défaut)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'user', // Par défaut, les nouveaux utilisateurs sont des "user" (pas "client")
        approved: false, // Nécessite l'approbation d'un admin
        customerId: customerId, // null par défaut, sera lié lors de l'approbation si nécessaire
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

