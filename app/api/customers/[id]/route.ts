import { NextResponse } from 'next/server'
import { getUserPrisma } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    const customer = await companyPrisma.customer.findUnique({
      where: { id: params.id },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

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
    const { firstName, lastName, phone, email, address, city, postalCode, notes } = body

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Le prénom, le nom et le téléphone sont requis' },
        { status: 400 }
      )
    }

    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    // Vérifier que le client existe
    const existingCustomer = await companyPrisma.customer.findUnique({
      where: { id: params.id },
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si un autre client avec le même téléphone existe déjà (sauf le client actuel)
    if (phone !== existingCustomer.phone) {
      const customerWithSamePhone = await companyPrisma.customer.findFirst({
        where: { 
          phone,
          id: { not: params.id },
        },
      })

      if (customerWithSamePhone) {
        return NextResponse.json(
          { error: 'Un autre client avec ce numéro de téléphone existe déjà' },
          { status: 400 }
        )
      }
    }

    // Mettre à jour le client
    const customer = await companyPrisma.customer.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        phone,
        email: email || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        notes: notes || null,
      },
    })

    return NextResponse.json(
      { 
        message: 'Client modifié avec succès',
        customer 
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Erreur lors de la modification du client:', error)
    
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





