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
    const { name, description, brand, partNumber, category, stock, unitPrice, supplier } = body

    if (!name || !category || unitPrice === undefined) {
      return NextResponse.json(
        { error: 'Le nom, la catégorie et le prix unitaire sont requis' },
        { status: 400 }
      )
    }

    if (unitPrice < 0) {
      return NextResponse.json(
        { error: 'Le prix unitaire doit être positif' },
        { status: 400 }
      )
    }

    if (stock < 0) {
      return NextResponse.json(
        { error: 'Le stock ne peut pas être négatif' },
        { status: 400 }
      )
    }

    // Créer la pièce
    const part = await prisma.part.create({
      data: {
        name,
        description: description || null,
        brand: brand || null,
        partNumber: partNumber || null,
        category,
        stock: stock || 0,
        unitPrice: parseFloat(unitPrice),
        supplier: supplier || null,
      },
    })

    return NextResponse.json(
      { 
        message: 'Pièce créée avec succès',
        part 
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erreur lors de la création de la pièce:', error)
    
    let errorMessage = 'Une erreur est survenue'
    
    if (error.code === 'P2002') {
      errorMessage = 'Une pièce avec ces informations existe déjà'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

