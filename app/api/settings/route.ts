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

    const settings = await companyPrisma.settings.findMany()
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
      smsFrom,
      sslEnabled,
      forceHttps,
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
    }

    // Mettre à jour le type d'entreprise
    if (companyType) {
      await companyPrisma.settings.upsert({
        where: { key: 'companyType' },
        update: { value: companyType },
        create: {
          key: 'companyType',
          value: companyType,
          description: 'Type d\'entreprise française',
        },
      })
    }

    // Mettre à jour les paramètres de notifications
    const notificationSettings = [
      { key: 'emailEnabled', value: emailEnabled !== undefined ? (emailEnabled ? 'true' : 'false') : undefined },
      { key: 'smsEnabled', value: smsEnabled !== undefined ? (smsEnabled ? 'true' : 'false') : undefined },
      { key: 'smtpHost', value: smtpHost },
      { key: 'smtpPort', value: smtpPort?.toString() },
      { key: 'smtpUser', value: smtpUser },
      { key: 'smtpPassword', value: smtpPassword },
      { key: 'smtpFrom', value: smtpFrom },
      { key: 'smsProvider', value: smsProvider },
      { key: 'smsApiKey', value: smsApiKey },
      { key: 'smsFrom', value: smsFrom },
    ]

    for (const setting of notificationSettings) {
      if (setting.value !== undefined) {
        await companyPrisma.settings.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: {
            key: setting.key,
            value: setting.value,
            description: `Paramètre de notification: ${setting.key}`,
          },
        })
      }
    }

    // Mettre à jour les paramètres SSL
    if (sslEnabled !== undefined) {
      await companyPrisma.settings.upsert({
        where: { key: 'sslEnabled' },
        update: { value: sslEnabled.toString() },
        create: {
          key: 'sslEnabled',
          value: sslEnabled.toString(),
          description: 'Activation SSL/HTTPS',
        },
      })
    }

    if (forceHttps !== undefined) {
      await companyPrisma.settings.upsert({
        where: { key: 'forceHttps' },
        update: { value: forceHttps.toString() },
        create: {
          key: 'forceHttps',
          value: forceHttps.toString(),
          description: 'Forcer la redirection HTTP vers HTTPS',
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

