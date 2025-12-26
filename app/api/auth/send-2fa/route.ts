import { NextResponse } from 'next/server'
import { getMainPrisma, getCompanyPrisma } from '@/lib/db-manager'
import { getNotificationConfig } from '@/lib/notifications'
import { randomInt } from 'crypto'
import nodemailer from 'nodemailer'

// Stockage temporaire des codes 2FA (en mémoire)
// Format: { email: { code: string, expiresAt: Date, userId: string } }
declare global {
  var twoFactorCodes: Map<string, { code: string; expiresAt: Date; userId: string }> | undefined
}

// Utiliser une variable globale pour partager le Map entre les routes
if (!global.twoFactorCodes) {
  global.twoFactorCodes = new Map()
}
const twoFactorCodes = global.twoFactorCodes

// Nettoyer les codes expirés toutes les 5 minutes
setInterval(() => {
  const now = new Date()
  Array.from(twoFactorCodes.entries()).forEach(([email, data]) => {
    if (data.expiresAt < now) {
      twoFactorCodes.delete(email)
    }
  })
}, 5 * 60 * 1000)

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/auth/send-2fa
 * Génère et envoie un code 2FA par email
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    const mainPrisma = getMainPrisma()

    // Vérifier l'utilisateur et le mot de passe
    const user = await mainPrisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        approved: true,
        suspended: true,
        companyId: true,
      },
    })

    if (!user) {
      // Pour la sécurité, ne pas révéler si l'email existe
      await new Promise(resolve => setTimeout(resolve, 500))
      return NextResponse.json({
        message: 'Si un compte existe avec cette adresse email, vous recevrez un code de vérification.',
      })
    }

    // Vérifier le mot de passe
    const bcrypt = require('bcryptjs')
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return NextResponse.json({
        message: 'Si un compte existe avec cette adresse email, vous recevrez un code de vérification.',
      })
    }

    // Vérifier si l'utilisateur est approuvé
    if (!user.approved) {
      return NextResponse.json(
        { error: 'Compte en attente d\'approbation' },
        { status: 403 }
      )
    }

    // Vérifier si le compte est suspendu
    if (user.suspended) {
      return NextResponse.json(
        { error: 'COMPTE_SUSPENDU' },
        { status: 403 }
      )
    }

    // Générer un code à 6 chiffres
    const code = randomInt(100000, 999999).toString()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10) // Expire dans 10 minutes

    // Stocker le code
    twoFactorCodes.set(email, {
      code,
      expiresAt,
      userId: user.id,
    })

    // Récupérer la configuration email
    let smtpHost: string | undefined
    let smtpPort: number = 587
    let smtpUser: string | undefined
    let smtpPassword: string | undefined
    let smtpFrom: string | undefined
    let emailEnabled = false

    try {
      if (user.companyId) {
        const companyPrisma = getCompanyPrisma(user.companyId)
        const emailConfig = await getNotificationConfig(companyPrisma)
        
        if (emailConfig.emailEnabled && emailConfig.smtpHost && emailConfig.smtpUser && emailConfig.smtpPassword) {
          smtpHost = emailConfig.smtpHost
          smtpPort = emailConfig.smtpPort || 587
          smtpUser = emailConfig.smtpUser
          smtpPassword = emailConfig.smtpPassword
          smtpFrom = emailConfig.smtpFrom || emailConfig.smtpUser
          emailEnabled = emailConfig.emailEnabled
        }
      }
    } catch (error) {
      console.warn('Impossible de récupérer la config depuis la DB:', error)
    }

    // Fallback sur les variables d'environnement
    if (!smtpHost || !smtpUser || !smtpPassword) {
      smtpHost = process.env.SMTP_HOST
      smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
      smtpUser = process.env.SMTP_USER
      smtpPassword = process.env.SMTP_PASSWORD
      smtpFrom = process.env.SMTP_FROM || smtpUser
    }

    // Envoyer l'email avec le code
    const smtpConfigured = !!(smtpHost && smtpUser && smtpPassword)
    
    if (smtpConfigured) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
        })

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .code-box { background-color: #4F46E5; color: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Code de vérification - FixTector</h2>
              <p>Bonjour ${user.name},</p>
              <p>Vous avez demandé à vous connecter à votre compte FixTector.</p>
              <p>Utilisez le code suivant pour compléter votre connexion :</p>
              <div class="code-box">${code}</div>
              <p><strong>Ce code expire dans 10 minutes.</strong></p>
              <p>Si vous n'avez pas demandé cette connexion, ignorez simplement cet email.</p>
              <div class="footer">
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              </div>
            </div>
          </body>
          </html>
        `

        const emailText = `
Code de vérification - FixTector

Bonjour ${user.name},

Vous avez demandé à vous connecter à votre compte FixTector.

Utilisez le code suivant pour compléter votre connexion :
${code}

Ce code expire dans 10 minutes.

Si vous n'avez pas demandé cette connexion, ignorez simplement cet email.

Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        `

        await transporter.sendMail({
          from: smtpFrom,
          to: user.email,
          subject: 'Code de vérification - FixTector',
          text: emailText,
          html: emailHtml,
        })

        console.log(`[2FA] Code envoyé à ${user.email}`)
      } catch (emailError: any) {
        console.error('[2FA] Erreur lors de l\'envoi de l\'email:', emailError)
        // En développement, retourner le code
        if (process.env.NODE_ENV === 'development') {
          return NextResponse.json({
            message: 'Code généré (DEV ONLY - Email non envoyé)',
            code: code,
            warning: 'Configurez SMTP pour envoyer les codes par email',
          })
        }
        return NextResponse.json(
          { error: 'Erreur lors de l\'envoi du code. Veuillez réessayer.' },
          { status: 500 }
        )
      }
    } else {
      // En développement, retourner le code
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          message: 'Code généré (DEV ONLY - SMTP non configuré)',
          code: code,
          warning: 'Configurez SMTP pour envoyer les codes par email',
        })
      }
      return NextResponse.json(
        { error: 'Email non configuré. Veuillez contacter l\'administrateur.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Code de vérification envoyé par email',
    })
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi du code 2FA:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/send-2fa
 * Vérifie si un code 2FA existe pour un email (pour le frontend)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json(
      { error: 'Email requis' },
      { status: 400 }
    )
  }

  const codeData = twoFactorCodes.get(email)
  if (!codeData) {
    return NextResponse.json({ exists: false })
  }

  const now = new Date()
  if (codeData.expiresAt < now) {
    twoFactorCodes.delete(email)
    return NextResponse.json({ exists: false })
  }

  return NextResponse.json({ exists: true })
}

