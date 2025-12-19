import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json([])
    }

    const queryTrimmed = query.trim()
    const queryLower = queryTrimmed.toLowerCase()
    
    // Récupérer tous les clients (limité à 50 pour les performances)
    const allCustomers = await prisma.customer.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    })

    // Filtrer en JavaScript pour la casse insensible (nécessaire pour SQLite)
    const filteredCustomers = allCustomers.filter(customer => {
      const firstName = (customer.firstName || '').toLowerCase()
      const lastName = (customer.lastName || '').toLowerCase()
      const phone = (customer.phone || '').toLowerCase()
      const email = (customer.email || '').toLowerCase()
      const fullName = `${firstName} ${lastName}`
      
      return firstName.includes(queryLower) ||
             lastName.includes(queryLower) ||
             fullName.includes(queryLower) ||
             phone.includes(queryLower) ||
             (email && email.includes(queryLower))
    }).slice(0, 10) // Limiter à 10 résultats

    console.log(`Recherche "${queryTrimmed}": ${filteredCustomers.length} résultats trouvés`)
    
    return NextResponse.json(filteredCustomers)
  } catch (error) {
    console.error('Erreur lors de la recherche:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

