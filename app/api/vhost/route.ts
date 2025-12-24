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

    // Récupérer la configuration vhost
    const vhostConfig = await companyPrisma.settings.findUnique({
      where: { key: 'vhost_config' },
    })

    if (vhostConfig) {
      try {
        const config = JSON.parse(vhostConfig.value)
        return NextResponse.json({ config })
      } catch (parseError) {
        console.error('[VHOST API] Erreur lors du parsing de la config:', parseError)
        return NextResponse.json({ config: null })
      }
    }

    return NextResponse.json({ config: null })
  } catch (error) {
    console.error('[VHOST API] Erreur GET:', error)
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

    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('[VHOST API] POST - Configuration reçue:', {
      domain: body.domain,
      serverType: body.serverType,
      useReverseProxy: body.useReverseProxy,
      documentRoot: body.documentRoot,
    })

    // Valider la configuration de base
    if (!body.domain || typeof body.domain !== 'string' || body.domain.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom de domaine est requis' },
        { status: 400 }
      )
    }

    if (!body.serverType || !['apache', 'nginx'].includes(body.serverType)) {
      return NextResponse.json(
        { error: 'Type de serveur invalide (apache ou nginx)' },
        { status: 400 }
      )
    }

    // Si reverse proxy est activé, documentRoot n'est pas requis
    // Sinon, documentRoot est requis
    if (!body.useReverseProxy) {
      if (!body.documentRoot || typeof body.documentRoot !== 'string' || body.documentRoot.trim() === '') {
        return NextResponse.json(
          { error: 'Le document root est requis quand le reverse proxy n\'est pas activé' },
          { status: 400 }
        )
      }
    }

    // Normaliser la configuration
    const normalizedConfig = {
      domain: body.domain.trim(),
      serverType: body.serverType,
      documentRoot: body.documentRoot?.trim() || '',
      port: body.port || (body.sslEnabled ? 443 : 80),
      sslEnabled: body.sslEnabled || false,
      sslCertPath: body.sslCertPath?.trim() || '',
      sslKeyPath: body.sslKeyPath?.trim() || '',
      redirectHttp: body.redirectHttp !== undefined ? body.redirectHttp : true,
      phpVersion: body.phpVersion || '8.1',
      serverAlias: Array.isArray(body.serverAlias) ? body.serverAlias.filter((a: string) => a && a.trim()) : [],
      customConfig: body.customConfig?.trim() || '',
      useReverseProxy: body.useReverseProxy !== undefined ? body.useReverseProxy : true,
      proxyTarget: body.proxyTarget?.trim() || 'http://localhost:3001',
      useCloudflare: body.useCloudflare || false,
      cloudflareTunnelId: body.cloudflareTunnelId?.trim() || '',
      cloudflareTunnelName: body.cloudflareTunnelName?.trim() || 'fixtector',
    }

    console.log('[VHOST API] Configuration normalisée:', normalizedConfig)

    // Sauvegarder la configuration
    const result = await companyPrisma.settings.upsert({
      where: { key: 'vhost_config' },
      update: {
        value: JSON.stringify(normalizedConfig),
        description: `Configuration Virtual Host pour ${normalizedConfig.domain}`,
      },
      create: {
        key: 'vhost_config',
        value: JSON.stringify(normalizedConfig),
        description: `Configuration Virtual Host pour ${normalizedConfig.domain}`,
      },
    })

    console.log('[VHOST API] Configuration sauvegardée avec succès:', result)

    return NextResponse.json({ 
      success: true,
      message: 'Configuration Virtual Host sauvegardée avec succès',
      config: normalizedConfig
    })
  } catch (error: any) {
    console.error('[VHOST API] Erreur POST:', error)
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue lors de la sauvegarde' },
      { status: 500 }
    )
  }
}
