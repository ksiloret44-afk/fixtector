import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const config = await request.json()

    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Validation de base
    if (!config.domain) {
      errors.push('Le nom de domaine est requis')
    } else {
      const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
      if (!domainRegex.test(config.domain)) {
        errors.push('Format de domaine invalide')
      }
    }

    if (!config.documentRoot) {
      errors.push('Le Document Root est requis')
    } else {
      // Vérifier que le chemin commence par /
      if (!config.documentRoot.startsWith('/')) {
        errors.push('Le Document Root doit être un chemin absolu (commencer par /)')
      }
    }

    if (!config.serverType) {
      errors.push('Le type de serveur est requis')
    }

    // Vérifications SSL
    if (config.sslEnabled) {
      if (config.port !== 443) {
        warnings.push('Le port devrait être 443 pour SSL')
      }

      if (!config.sslCertPath) {
        warnings.push('Le chemin du certificat SSL n\'est pas défini')
      } else if (!config.sslCertPath.endsWith('.pem') && !config.sslCertPath.endsWith('.crt')) {
        warnings.push('Le chemin du certificat SSL semble invalide')
      }

      if (!config.sslKeyPath) {
        warnings.push('Le chemin de la clé privée SSL n\'est pas défini')
      } else if (!config.sslKeyPath.endsWith('.key') && !config.sslKeyPath.endsWith('.pem')) {
        warnings.push('Le chemin de la clé privée SSL semble invalide')
      }

      if (!config.redirectHttp) {
        suggestions.push('Il est recommandé d\'activer la redirection HTTP vers HTTPS pour la sécurité')
      }
    } else {
      if (config.port === 443) {
        warnings.push('Le port 443 est généralement utilisé pour HTTPS. Activez SSL ou utilisez le port 80')
      }
    }

    // Vérifications spécifiques Apache
    if (config.serverType === 'apache') {
      if (!config.phpVersion) {
        warnings.push('La version PHP n\'est pas définie pour Apache')
      }
    }

    // Suggestions générales
    if (!config.serverAlias || config.serverAlias.length === 0) {
      suggestions.push('Considérez ajouter www.' + config.domain + ' comme alias')
    }

    if (config.documentRoot && !config.documentRoot.includes(config.domain)) {
      suggestions.push('Le Document Root pourrait inclure le nom de domaine pour une meilleure organisation')
    }

    const valid = errors.length === 0

    return NextResponse.json({
      valid,
      errors,
      warnings,
      suggestions,
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue', valid: false, errors: ['Erreur lors de la validation'] },
      { status: 500 }
    )
  }
}














