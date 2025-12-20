import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const mainPrisma = getMainPrisma()
    const user = await mainPrisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Aucune entreprise associée' }, { status: 404 })
    }

    return NextResponse.json({ company: user.company })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const mainPrisma = getMainPrisma()
    const user = await mainPrisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Aucune entreprise associée' }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      siret,
      siren,
      rcs,
      rcsCity,
      vatNumber,
      legalForm,
      capital,
      director,
    } = body

    const company = await mainPrisma.company.update({
      where: { id: user.company.id },
      data: {
        name: name || user.company.name,
        email: email !== undefined ? email : user.company.email,
        phone: phone !== undefined ? phone : user.company.phone,
        address: address !== undefined ? address : user.company.address,
        city: city !== undefined ? city : user.company.city,
        postalCode: postalCode !== undefined ? postalCode : user.company.postalCode,
        country: country !== undefined ? country : user.company.country,
        siret: siret !== undefined ? siret : user.company.siret,
        siren: siren !== undefined ? siren : user.company.siren,
        rcs: rcs !== undefined ? rcs : user.company.rcs,
        rcsCity: rcsCity !== undefined ? rcsCity : user.company.rcsCity,
        vatNumber: vatNumber !== undefined ? vatNumber : user.company.vatNumber,
        legalForm: legalForm !== undefined ? legalForm : user.company.legalForm,
        capital: capital !== undefined ? capital : user.company.capital,
        director: director !== undefined ? director : user.company.director,
      },
    })

    return NextResponse.json({ company })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

