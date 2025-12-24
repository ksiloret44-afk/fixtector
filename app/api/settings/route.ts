import { NextResponse } from 'next/server'
import { getUserPrisma } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { invalidateBaseUrlCache } from '@/lib/base-url'
import { logger } from '@/lib/logger'

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

    const settings = await companyPrisma.settings.findMany()
    const settingsMap: Record<string, string> = {}
    
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value
    })

    console.log('[SETTINGS API GET] Nombre total de paramètres trouvés:', settings.length)
    console.log('[SETTINGS API GET] Paramètres retournés:', Object.keys(settingsMap))
    
    // Vérifier spécifiquement baseUrl dans la base de données
    const baseUrlSetting = await companyPrisma.settings.findUnique({
      where: { key: 'baseUrl' },
    })
    
    if (baseUrlSetting) {
      console.log('[SETTINGS API GET] baseUrl trouvé dans la DB:', baseUrlSetting.value)
      settingsMap.baseUrl = baseUrlSetting.value
    } else {
      console.log('[SETTINGS API GET] baseUrl non trouvé dans la base de données')
    }
    
    if (settingsMap.baseUrl) {
      console.log('[SETTINGS API GET] baseUrl final dans settingsMap:', settingsMap.baseUrl)
    } else {
      console.log('[SETTINGS API GET] baseUrl non trouvé dans les paramètres')
    }

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
    const { 
      taxRate, 
      companyType,
      emailEnabled,
      smsEnabled,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpFrom,
      smsProvider,
      smsApiKey,
      smsAuthToken,
      smsFrom,
      smsConsumerKey,
      smsSender,
      sslEnabled,
      forceHttps,
      baseUrl,
    } = body

    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    // Mettre à jour les paramètres TVA
    if (taxRate !== undefined) {
      logger.info('[SETTINGS API] Sauvegarde de taxRate:', taxRate)
      console.log('[SETTINGS API] Sauvegarde de taxRate:', taxRate)
      if (isNaN(parseFloat(taxRate))) {
        return NextResponse.json(
          { error: 'Taux de TVA invalide' },
          { status: 400 }
        )
      }
      await companyPrisma.settings.upsert({
        where: { key: 'taxRate' },
        update: { value: taxRate.toString() },
        create: {
          key: 'taxRate',
          value: taxRate.toString(),
          description: 'Taux de TVA en pourcentage',
        },
      })
      console.log('[SETTINGS API] ✓ taxRate sauvegardé')
    } else {
      console.log('[SETTINGS API] taxRate non modifié (undefined)')
    }

    // Mettre à jour le type d'entreprise
    if (companyType !== undefined) {
      console.log('[SETTINGS API] Sauvegarde de companyType:', companyType)
      await companyPrisma.settings.upsert({
        where: { key: 'companyType' },
        update: { value: companyType },
        create: {
          key: 'companyType',
          value: companyType,
          description: 'Type d\'entreprise française',
        },
      })
      console.log('[SETTINGS API] ✓ companyType sauvegardé')
    } else {
      console.log('[SETTINGS API] companyType non modifié (undefined)')
    }

    // Mettre à jour les paramètres de notifications
    const notificationSettings = [
      { key: 'emailEnabled', value: emailEnabled !== undefined ? (emailEnabled ? 'true' : 'false') : undefined },
      { key: 'smsEnabled', value: smsEnabled !== undefined ? (smsEnabled ? 'true' : 'false') : undefined },
      { key: 'smtpHost', value: smtpHost !== undefined ? smtpHost : undefined },
      { key: 'smtpPort', value: smtpPort !== undefined ? smtpPort.toString() : undefined },
      { key: 'smtpUser', value: smtpUser !== undefined ? smtpUser : undefined },
      { key: 'smtpPassword', value: smtpPassword !== undefined ? smtpPassword : undefined },
      { key: 'smtpFrom', value: smtpFrom !== undefined ? smtpFrom : undefined },
      { key: 'smsProvider', value: smsProvider !== undefined ? smsProvider : undefined },
      { key: 'smsApiKey', value: smsApiKey !== undefined ? smsApiKey : undefined },
      { key: 'smsAuthToken', value: smsAuthToken !== undefined ? smsAuthToken : undefined },
      { key: 'smsFrom', value: smsFrom !== undefined ? smsFrom : undefined },
      { key: 'smsConsumerKey', value: smsConsumerKey !== undefined ? smsConsumerKey : undefined },
      { key: 'smsSender', value: smsSender !== undefined ? smsSender : undefined },
    ]

    for (const setting of notificationSettings) {
      if (setting.value !== undefined) {
        console.log(`[SETTINGS API] Sauvegarde de ${setting.key}:`, setting.value ? '***' : '(vide)')
        await companyPrisma.settings.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: {
            key: setting.key,
            value: setting.value,
            description: `Paramètre de notification: ${setting.key}`,
          },
        })
      } else {
        console.log(`[SETTINGS API] ${setting.key} non modifié (undefined)`)
      }
    }

    // Mettre à jour les paramètres SSL
    if (sslEnabled !== undefined) {
      console.log('[SETTINGS API] Sauvegarde de sslEnabled:', sslEnabled)
      await companyPrisma.settings.upsert({
        where: { key: 'sslEnabled' },
        update: { value: sslEnabled.toString() },
        create: {
          key: 'sslEnabled',
          value: sslEnabled.toString(),
          description: 'Activation SSL/HTTPS',
        },
      })
      console.log('[SETTINGS API] ✓ sslEnabled sauvegardé')
    } else {
      console.log('[SETTINGS API] sslEnabled non modifié (undefined)')
    }

    if (forceHttps !== undefined) {
      console.log('[SETTINGS API] Sauvegarde de forceHttps:', forceHttps)
      await companyPrisma.settings.upsert({
        where: { key: 'forceHttps' },
        update: { value: forceHttps.toString() },
        create: {
          key: 'forceHttps',
          value: forceHttps.toString(),
          description: 'Forcer la redirection HTTP vers HTTPS',
        },
      })
      console.log('[SETTINGS API] ✓ forceHttps sauvegardé')
    } else {
      console.log('[SETTINGS API] forceHttps non modifié (undefined)')
    }

    // Mettre à jour l'URL de base
    let savedBaseUrl: string | null = null
    if (baseUrl !== undefined) {
      console.log('[SETTINGS API] ===== BASEURL RECU DANS LA REQUETE =====')
      console.log('[SETTINGS API] baseUrl reçu:', baseUrl ? `"${baseUrl}"` : 'vide/undefined')
      console.log('[SETTINGS API] Type:', typeof baseUrl)
      
      // Si baseUrl est explicitement envoyé comme chaîne vide, supprimer le paramètre
      // Mais ne pas supprimer si baseUrl est undefined (non envoyé dans la requête)
      if (baseUrl === '' || (typeof baseUrl === 'string' && baseUrl.trim() === '')) {
        console.log('[SETTINGS API] Suppression de baseUrl (explicitement vide)')
        await companyPrisma.settings.deleteMany({
          where: { key: 'baseUrl' },
        })
        // Invalider le cache de l'URL de base
        invalidateBaseUrlCache()
        savedBaseUrl = null
      } else if (baseUrl && typeof baseUrl === 'string') {
        console.log('[SETTINGS API] Sauvegarde de baseUrl:', baseUrl)
        // Normaliser l'URL : si c'est juste une IP ou un domaine sans http/https, ajouter http://
        let normalizedBaseUrl = baseUrl.trim()
        if (!normalizedBaseUrl.match(/^https?:\/\//i)) {
          normalizedBaseUrl = `http://${normalizedBaseUrl}`
          console.log('[SETTINGS API] URL normalisée:', normalizedBaseUrl)
        }

        // Valider l'URL
        try {
          const url = new URL(normalizedBaseUrl)
          // S'assurer que l'URL est valide (http ou https)
          if (!['http:', 'https:'].includes(url.protocol)) {
            console.error('[SETTINGS API] Protocole invalide:', url.protocol)
            return NextResponse.json(
              { error: 'L\'URL doit commencer par http:// ou https://' },
              { status: 400 }
            )
          }
          
          const finalUrl = normalizedBaseUrl.replace(/\/$/, '') // Enlever le slash final
          console.log('[SETTINGS API] Sauvegarde de baseUrl dans la base de données:', finalUrl)
          
          const result = await companyPrisma.settings.upsert({
            where: { key: 'baseUrl' },
            update: { value: finalUrl },
            create: {
              key: 'baseUrl',
              value: finalUrl,
              description: 'URL de base de l\'application (remplace localhost partout)',
            },
          })
          
          console.log('[SETTINGS API] baseUrl sauvegardé avec succès:', result)
          
          // Vérifier que la sauvegarde a bien fonctionné
          const verify = await companyPrisma.settings.findUnique({
            where: { key: 'baseUrl' },
          })
          console.log('[SETTINGS API] Vérification après sauvegarde:', verify)
          
          if (!verify || verify.value !== finalUrl) {
            console.error('[SETTINGS API] ERREUR: La vérification ne correspond pas à la valeur sauvegardée!')
            console.error('[SETTINGS API] Attendu:', finalUrl)
            console.error('[SETTINGS API] Trouvé:', verify?.value)
          } else {
            console.log('[SETTINGS API] ✓ Vérification réussie: URL correctement sauvegardée')
          }
          
          // Invalider le cache de l'URL de base
          invalidateBaseUrlCache()
          
          // Stocker l'URL sauvegardée pour la retourner dans la réponse finale
          savedBaseUrl = finalUrl
        } catch (error: any) {
          console.error('[SETTINGS API] Erreur lors de la validation de l\'URL:', error)
          return NextResponse.json(
            { error: `URL invalide: ${error.message}. Format attendu: http://example.com, https://example.com, ou une IP (ex: http://192.168.1.1:3001)` },
            { status: 400 }
          )
        }
      } else {
        console.log('[SETTINGS API] baseUrl non valide ou de type incorrect, ignoré')
      }
    } else {
      console.log('[SETTINGS API] baseUrl non envoyé dans la requête (undefined), conservation de la valeur existante')
    }

    // Vérifier que tous les paramètres ont bien été sauvegardés
    const savedSettings = await companyPrisma.settings.findMany({
      where: {
        key: {
          in: [
            'taxRate',
            'companyType',
            'emailEnabled',
            'smsEnabled',
            'smtpHost',
            'smtpPort',
            'smtpUser',
            'smtpFrom',
            'smsProvider',
            'sslEnabled',
            'forceHttps',
          ],
        },
      },
    })
    
    console.log('[SETTINGS API] Paramètres sauvegardés:', savedSettings.map(s => `${s.key}=${s.value}`).join(', '))
    console.log('[SETTINGS API] Tous les paramètres ont été sauvegardés avec succès')
    
    // Construire la réponse avec l'URL sauvegardée si disponible
    const response: any = {
      success: true,
      message: 'Paramètres sauvegardés avec succès',
    }
    
    // Si baseUrl a été sauvegardé, l'inclure dans la réponse
    if (savedBaseUrl !== null) {
      response.baseUrl = savedBaseUrl
      response.savedBaseUrl = savedBaseUrl
      console.log('[SETTINGS API] URL de base incluse dans la réponse:', savedBaseUrl)
    } else if (baseUrl === undefined) {
      // Si baseUrl n'a pas été modifié, récupérer l'URL actuelle depuis la base de données
      try {
        const currentBaseUrl = await companyPrisma.settings.findUnique({
          where: { key: 'baseUrl' },
        })
        if (currentBaseUrl?.value) {
          response.baseUrl = currentBaseUrl.value
          console.log('[SETTINGS API] URL de base actuelle récupérée:', currentBaseUrl.value)
        }
      } catch (err) {
        console.error('[SETTINGS API] Erreur lors de la récupération de baseUrl:', err)
      }
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

