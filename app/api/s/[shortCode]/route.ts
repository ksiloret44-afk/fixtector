import { NextResponse } from 'next/server'
import { getMainPrisma, getCompanyPrisma } from '@/lib/db-manager'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shortCode: string }> | { shortCode: string } }
) {
  try {
    // Gérer les paramètres synchrones et asynchrones (Next.js 14+)
    const resolvedParams = await Promise.resolve(params)
    let { shortCode } = resolvedParams

    // Nettoyer le code (enlever les espaces, etc.)
    if (shortCode) {
      shortCode = shortCode.trim()
    }

    console.log('[Short URL] Code reçu (raw):', JSON.stringify(shortCode), 'Type:', typeof shortCode, 'Longueur:', shortCode?.length)

    if (!shortCode || shortCode.length < 4 || shortCode.length > 12) {
      console.log('[Short URL] Code invalide:', shortCode, 'Longueur:', shortCode?.length)
      return NextResponse.json({ error: 'Code invalide' }, { status: 400 })
    }

    console.log('[Short URL] Recherche du code:', shortCode, 'Type:', typeof shortCode)

    // Chercher dans toutes les entreprises
    const mainPrisma = getMainPrisma()
    const companies = await mainPrisma.company.findMany({
      select: { id: true },
      take: 50, // Limiter la recherche
    })

    console.log('[Short URL] Nombre d\'entreprises à vérifier:', companies.length)

    for (const company of companies) {
      try {
        const companyPrisma = getCompanyPrisma(company.id)
        const searchKey = `short_url_${shortCode}`
        console.log('[Short URL] Recherche dans l\'entreprise', company.id, 'avec la clé:', searchKey)
        
        // Essayer d'abord avec findUnique
        let setting = await companyPrisma.settings.findUnique({
          where: { key: searchKey },
        })

        // Si pas trouvé, essayer avec findFirst (au cas où il y aurait un problème avec la clé)
        if (!setting) {
          const allSettings = await companyPrisma.settings.findMany({
            where: {
              key: { startsWith: 'short_url_' },
            },
          })
          setting = allSettings.find(s => s.key === searchKey) || null
          if (setting) {
            console.log('[Short URL] Trouvé via findMany pour la clé:', searchKey)
          }
        }

        if (setting?.value) {
          console.log('[Short URL] ✓ URL trouvée pour le code:', shortCode, 'URL:', setting.value, 'dans l\'entreprise:', company.id)
          // Rediriger vers l'URL originale
          return NextResponse.redirect(setting.value)
        } else {
          console.log('[Short URL] - Pas de setting trouvé pour la clé:', searchKey, 'dans l\'entreprise:', company.id)
        }
      } catch (error: any) {
        console.error('[Short URL] Erreur lors de la recherche dans l\'entreprise', company.id, ':', error.message, error.stack)
        // Continuer avec la prochaine entreprise
        continue
      }
    }

    // Si pas trouvé, essayer de chercher toutes les clés qui commencent par short_url_ pour déboguer
    console.log('[Short URL] Code non trouvé:', shortCode, '- Recherche de toutes les clés short_url_ pour déboguer')
    try {
      const firstCompany = companies[0]
      if (firstCompany) {
        const companyPrisma = getCompanyPrisma(firstCompany.id)
        const allShortUrls = await companyPrisma.settings.findMany({
          where: {
            key: { startsWith: 'short_url_' },
          },
          take: 10,
        })
        console.log('[Short URL] Exemples de clés trouvées:', allShortUrls.map(s => s.key))
      }
    } catch (error) {
      console.error('[Short URL] Erreur lors de la recherche de débogage:', error)
    }

    // Si pas trouvé, retourner une erreur 404
    return NextResponse.json({ error: 'URL non trouvée' }, { status: 404 })
  } catch (error: any) {
    console.error('[Short URL] Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

