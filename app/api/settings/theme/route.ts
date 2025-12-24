import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { theme } = body

    if (theme !== 'light' && theme !== 'dark') {
      return NextResponse.json(
        { error: 'Thème invalide. Utilisez "light" ou "dark"' },
        { status: 400 }
      )
    }

    const userId = (session.user as any).id
    const prisma = getMainPrisma()

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { theme },
      })
    } catch (dbError: any) {
      // Si le champ n'existe pas encore dans la base de données
      if (dbError.code === 'P2009' || dbError.code === 'P2011' || dbError.message?.includes('Unknown field') || dbError.message?.includes('Unknown arg')) {
        console.error('Erreur Prisma:', dbError.code, dbError.message)
        // Essayer de créer le champ avec une migration manuelle ou retourner une erreur explicite
        return NextResponse.json(
          { 
            error: 'Le champ theme n\'existe pas encore dans la base de données.',
            details: process.env.NODE_ENV === 'development' ? `Code: ${dbError.code}, Message: ${dbError.message}` : undefined,
            solution: 'Exécutez: npx prisma db push --schema=prisma/schema-main.prisma'
          },
          { status: 500 }
        )
      }
      // Autre erreur Prisma
      console.error('Erreur Prisma lors de la mise à jour:', dbError)
      throw dbError
    }

    return NextResponse.json({ success: true, theme })
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du thème:', error)
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ theme: 'light' }) // Par défaut
    }

    const userId = (session.user as any).id
    const prisma = getMainPrisma()

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { theme: true },
    })

    return NextResponse.json({ theme: user?.theme || 'light' })
  } catch (error) {
    console.error('Erreur lors de la récupération du thème:', error)
    return NextResponse.json({ theme: 'light' })
  }
}

