import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Version actuelle de l'application (à mettre à jour à chaque release)
const CURRENT_VERSION = '2.0.0'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les dernières releases depuis GitHub
    const githubRepo = process.env.GITHUB_REPO || 'ksiloret44-afk/fixtector'
    const githubToken = process.env.GITHUB_TOKEN // Optionnel, pour éviter les limites de rate

    let headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    }

    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`
    }

    console.log('=== Début de la vérification des mises à jour ===')
    console.log(`Repository: ${githubRepo}`)
    console.log(`Token présent: ${githubToken ? 'OUI' : 'NON'}`)

    // Essayer d'abord de récupérer la dernière release
    let latestRelease = null
    let latestVersion = CURRENT_VERSION
    let releaseNotes = ''
    let releaseUrl = ''
    let publishedAt = ''
    let releaseName = ''

    try {
      const releasesResponse = await fetch(
        `https://api.github.com/repos/${githubRepo}/releases/latest`,
        { headers }
      )

      if (releasesResponse.ok) {
        latestRelease = await releasesResponse.json()
        latestVersion = latestRelease.tag_name.replace(/^v/, '') // Enlever le préfixe 'v' si présent
        releaseNotes = latestRelease.body || ''
        releaseUrl = latestRelease.html_url
        publishedAt = latestRelease.published_at || ''
        releaseName = latestRelease.name || latestRelease.tag_name
        console.log(`Release trouvée: ${latestVersion}`)
      } else if (releasesResponse.status === 404) {
        // Pas de release, essayer de récupérer les tags
        console.log('Aucune release trouvée, recherche des tags...')
        const tagsResponse = await fetch(
          `https://api.github.com/repos/${githubRepo}/tags?per_page=10`,
          { headers }
        )

        if (tagsResponse.ok) {
          const tags = await tagsResponse.json()
          console.log(`Tags trouvés: ${tags.length}`)
          
          if (tags && tags.length > 0) {
            // Trier les tags par version (du plus récent au plus ancien)
            const sortedTags = tags
              .map((tag: any) => tag.name.replace(/^v/, ''))
              .sort((a: string, b: string) => compareVersions(b, a))
            
            console.log(`Tags triés: ${sortedTags.join(', ')}`)
            latestVersion = sortedTags[0]
            console.log(`Tag le plus récent trouvé: ${tags.find((t: any) => t.name.replace(/^v/, '') === latestVersion)?.name} (version: ${latestVersion})`)
            
            // Construire l'URL de la release à partir du tag
            releaseUrl = `https://github.com/${githubRepo}/releases/tag/${tags.find((t: any) => t.name.replace(/^v/, '') === latestVersion)?.name || `v${latestVersion}`}`
            releaseName = `v${latestVersion}`
          } else {
            console.log('Aucun tag trouvé')
            return NextResponse.json({
              currentVersion: CURRENT_VERSION,
              latestVersion: CURRENT_VERSION,
              updateAvailable: false,
              message: 'Aucune release ou tag disponible',
            })
          }
        } else {
          throw new Error(`GitHub API error (tags): ${tagsResponse.status}`)
        }
      } else {
        throw new Error(`GitHub API error (releases): ${releasesResponse.status}`)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des releases/tags:', error)
      // En cas d'erreur, essayer quand même les tags
      try {
        const tagsResponse = await fetch(
          `https://api.github.com/repos/${githubRepo}/tags?per_page=10`,
          { headers }
        )

        if (tagsResponse.ok) {
          const tags = await tagsResponse.json()
          if (tags && tags.length > 0) {
            const sortedTags = tags
              .map((tag: any) => tag.name.replace(/^v/, ''))
              .sort((a: string, b: string) => compareVersions(b, a))
            latestVersion = sortedTags[0]
            releaseUrl = `https://github.com/${githubRepo}/releases/tag/${tags.find((t: any) => t.name.replace(/^v/, '') === latestVersion)?.name || `v${latestVersion}`}`
            releaseName = `v${latestVersion}`
          }
        }
      } catch (tagError) {
        console.error('Erreur lors de la récupération des tags:', tagError)
      }
    }

    // Comparer les versions (format semver simple)
    const updateAvailable = compareVersions(latestVersion, CURRENT_VERSION) > 0
    console.log(`Version actuelle: ${CURRENT_VERSION}, Dernière version: ${latestVersion}, Mise à jour disponible: ${updateAvailable}`)
    console.log('=== Fin de la vérification des mises à jour (succès) ===')

    return NextResponse.json({
      currentVersion: CURRENT_VERSION,
      latestVersion: latestVersion,
      updateAvailable: updateAvailable,
      releaseNotes: releaseNotes,
      releaseUrl: releaseUrl,
      publishedAt: publishedAt,
      releaseName: releaseName,
    })
  } catch (error) {
    console.error('Erreur lors de la vérification des mises à jour:', error)
    return NextResponse.json(
      {
        currentVersion: CURRENT_VERSION,
        latestVersion: CURRENT_VERSION,
        updateAvailable: false,
        error: 'Impossible de vérifier les mises à jour',
      },
      { status: 500 }
    )
  }
}

// Fonction simple pour comparer les versions (format semver)
function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number)
  const v2Parts = version2.split('.').map(Number)

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0
    const v2Part = v2Parts[i] || 0

    if (v1Part > v2Part) return 1
    if (v1Part < v2Part) return -1
  }

  return 0
}

