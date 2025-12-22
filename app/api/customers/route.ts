import { NextResponse } from 'next/server'
import { getUserPrisma } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
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

    const customers = await companyPrisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, phone, email, address, city, postalCode } = body

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Le prénom, le nom et le téléphone sont requis' },
        { status: 400 }
      )
    }

    // Récupérer la connexion Prisma de l'entreprise de l'utilisateur
    // Les admins ne peuvent pas créer de clients (ils gèrent depuis la base principale)
    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Seuls les utilisateurs avec une entreprise peuvent créer des clients. Les administrateurs gèrent les utilisateurs et entreprises depuis la base principale.' },
        { status: 403 }
      )
    }

    // Vérifier si un client avec le même téléphone existe déjà dans cette entreprise
    const existingCustomer = await companyPrisma.customer.findFirst({
      where: { 
        phone,
      },
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Un client avec ce numéro de téléphone existe déjà' },
        { status: 400 }
      )
    }

    // Créer le client dans la base de données de l'entreprise
    const customer = await companyPrisma.customer.create({
      data: {
        firstName,
        lastName,
        phone,
        email: email || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
      },
    })

    return NextResponse.json(
      { 
        message: 'Client créé avec succès',
        customer 
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erreur lors de la création du client:', error)
    
    let errorMessage = 'Une erreur est survenue'
    
    if (error.code === 'P2002') {
      errorMessage = 'Un client avec ces informations existe déjà'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
