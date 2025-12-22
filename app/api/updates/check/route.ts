import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Version actuelle de l'application (à mettre à jour à chaque release)
const CURRENT_VERSION = '1.1.4'

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

    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/releases/latest`,
      { headers }
    )

    if (!response.ok) {
      // Si erreur 404, pas de release disponible
      if (response.status === 404) {
        return NextResponse.json({
          currentVersion: CURRENT_VERSION,
          latestVersion: CURRENT_VERSION,
          updateAvailable: false,
          message: 'Aucune release disponible',
        })
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const latestRelease = await response.json()
    const latestVersion = latestRelease.tag_name.replace(/^v/, '') // Enlever le préfixe 'v' si présent

    // Comparer les versions (format semver simple)
    const updateAvailable = compareVersions(latestVersion, CURRENT_VERSION) > 0

    return NextResponse.json({
      currentVersion: CURRENT_VERSION,
      latestVersion: latestVersion,
      updateAvailable: updateAvailable,
      releaseNotes: latestRelease.body || '',
      releaseUrl: latestRelease.html_url,
      publishedAt: latestRelease.published_at,
      releaseName: latestRelease.name || latestRelease.tag_name,
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

