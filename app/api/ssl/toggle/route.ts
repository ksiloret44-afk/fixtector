import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma } from '@/lib/db-manager'

export async function POST(request: Request) {
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

    const body = await request.json()
    const { enabled, forceHttps } = body

    // Sauvegarder les préférences dans la base de données
    await companyPrisma.settings.upsert({
      where: { key: 'sslEnabled' },
      update: { value: enabled.toString() },
      create: { key: 'sslEnabled', value: enabled.toString() },
    })

    await companyPrisma.settings.upsert({
      where: { key: 'forceHttps' },
      update: { value: forceHttps.toString() },
      create: { key: 'forceHttps', value: forceHttps.toString() },
    })

    // Si on est sur un serveur Linux et qu'on veut activer/désactiver la redirection HTTPS
    // On peut modifier les fichiers de configuration Nginx/Apache
    // Mais pour des raisons de sécurité, on ne le fait que si on a les permissions
    // et si c'est explicitement demandé
    
    // Note: La modification des fichiers de configuration serveur nécessite des privilèges root
    // et devrait être fait manuellement ou via un script d'installation
    // Ici, on sauvegarde juste les préférences dans la base de données
    
    return NextResponse.json({
      success: true,
      message: enabled 
        ? 'SSL activé (assurez-vous que votre certificat SSL est configuré sur le serveur)'
        : 'SSL désactivé',
      sslEnabled: enabled,
      forceHttps: forceHttps,
    })
  } catch (error) {
    console.error('Erreur lors de la modification SSL:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la modification SSL' },
      { status: 500 }
    )
  }
}

