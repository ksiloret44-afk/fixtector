import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Seuls les admins peuvent voir les logs
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const count = parseInt(searchParams.get('count') || '100')
    const level = searchParams.get('level') as 'info' | 'warn' | 'error' | 'debug' | null

    let logs = logger.getRecentLogs(count)

    // Filtrer par niveau si spécifié
    if (level) {
      logs = logs.filter(log => log.level === level)
    }

    return NextResponse.json({
      logs: logs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        data: log.data,
      })),
      total: logger.getLogs().length,
    })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des logs:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Seuls les admins peuvent vider les logs
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    logger.clearLogs()

    return NextResponse.json({ success: true, message: 'Logs vidés avec succès' })
  } catch (error: any) {
    console.error('Erreur lors du vidage des logs:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}











