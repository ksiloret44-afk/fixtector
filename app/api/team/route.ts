import { NextResponse } from 'next/server'
import { getMainPrisma, getUserPrisma, isUserAdmin } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

/**
 * GET /api/team
 * Liste les collaborateurs de l'entreprise de l'utilisateur
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const mainPrisma = getMainPrisma()
    const currentUser = await mainPrisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { companyId: true, role: true },
    })

    if (!currentUser?.companyId) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    // Récupérer tous les utilisateurs de la même entreprise
    const teamMembers = await mainPrisma.user.findMany({
      where: {
        companyId: currentUser.companyId,
        id: { not: (session.user as any).id }, // Exclure l'utilisateur actuel
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ teamMembers })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/team
 * Crée un nouveau collaborateur dans l'entreprise de l'utilisateur
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Le nom, l\'email et le mot de passe sont requis' },
        { status: 400 }
      )
    }

    const mainPrisma = getMainPrisma()
    const currentUser = await mainPrisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { companyId: true, role: true },
    })

    if (!currentUser?.companyId) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise pour créer un collaborateur' },
        { status: 403 }
      )
    }

    // Seuls les admins peuvent créer des admins
    if (role === 'admin' && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent créer des administrateurs' },
        { status: 403 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingUser = await mainPrisma.user.findUnique({
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

    // Créer le collaborateur dans la même entreprise
    // Le rôle par défaut est "user" (pas "admin" pour éviter les abus)
    const finalRole = role || 'user'
    // S'assurer qu'un utilisateur normal ne peut pas créer un admin
    const safeRole = (finalRole === 'admin' && currentUser.role !== 'admin') ? 'user' : finalRole

    const newUser = await mainPrisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: safeRole,
        companyId: currentUser.companyId,
        approved: true, // Approuvé automatiquement car créé par un membre de l'entreprise
        approvedBy: (session.user as any).id,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      { 
        message: 'Collaborateur créé avec succès',
        user: newUser 
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erreur lors de la création:', error)
    
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

