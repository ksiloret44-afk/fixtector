import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    // Vérifier si un client avec le même téléphone existe déjà
    const existingCustomer = await prisma.customer.findFirst({
      where: { phone },
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Un client avec ce numéro de téléphone existe déjà' },
        { status: 400 }
      )
    }

    // Créer le client
    const customer = await prisma.customer.create({
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

