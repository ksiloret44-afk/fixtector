import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const settings = await prisma.settings.findMany()
    const settingsMap: Record<string, string> = {}
    
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value
    })

    return NextResponse.json({ settings: settingsMap })
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
    const { taxRate, companyType } = body

    if (taxRate === undefined || isNaN(parseFloat(taxRate))) {
      return NextResponse.json(
        { error: 'Taux de TVA invalide' },
        { status: 400 }
      )
    }

    // Créer ou mettre à jour le paramètre TVA
    await prisma.settings.upsert({
      where: { key: 'taxRate' },
      update: { value: taxRate.toString() },
      create: {
        key: 'taxRate',
        value: taxRate.toString(),
        description: 'Taux de TVA en pourcentage',
      },
    })

    // Créer ou mettre à jour le type d'entreprise
    if (companyType) {
      await prisma.settings.upsert({
        where: { key: 'companyType' },
        update: { value: companyType },
        create: {
          key: 'companyType',
          value: companyType,
          description: 'Type d\'entreprise française',
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

