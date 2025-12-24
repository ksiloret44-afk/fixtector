import { NextResponse } from 'next/server'
import { getMainPrisma, getCompanyPrisma } from '@/lib/db-manager'
import { getNotificationConfig } from '@/lib/notifications'
import { randomBytes } from 'crypto'
import nodemailer from 'nodemailer'
import { getBaseUrl } from '@/lib/base-url'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Adresse email valide requise' },
        { status: 400 }
      )
    }

    const mainPrisma = getMainPrisma()

    // Vérifier si l'utilisateur existe
    const user = await mainPrisma.user.findUnique({
      where: { email },
    })

    // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
    // On retourne toujours un succès, même si l'utilisateur n'existe pas
    if (!user) {
      // Attendre un peu pour éviter le timing attack
      await new Promise(resolve => setTimeout(resolve, 500))
      return NextResponse.json({
        message: 'Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation.',
      })
    }

    // Vérifier que le compte est approuvé
    if (!user.approved) {
      return NextResponse.json({
        message: 'Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation.',
      })
    }

    // Vérifier que le compte n'est pas suspendu
    if (user.suspended) {
      return NextResponse.json({
        message: 'Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation.',
      })
    }

    // Générer un token sécurisé
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Expire dans 1 heure

    // Supprimer les anciens tokens expirés ou utilisés pour cet utilisateur
    await mainPrisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        OR: [
          { used: true },
          { expiresAt: { lt: new Date() } },
        ],
      },
    })

    // Créer le token de réinitialisation
    await mainPrisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    // Récupérer la configuration email depuis les paramètres de l'application
    // Essayer d'abord depuis la base de données (paramètres de l'application)
    let smtpHost: string | undefined
    let smtpPort: number = 587
    let smtpUser: string | undefined
    let smtpPassword: string | undefined
    let smtpFrom: string | undefined
    let emailEnabled = false
    let configSource = 'env' // 'db' ou 'env'

    try {
      // Récupérer la compagnie de l'utilisateur, ou la première compagnie disponible
      let companyId: string | null = user.companyId || null
      
      if (!companyId) {
        // Si l'utilisateur n'a pas de compagnie, prendre la première disponible
        const firstCompany = await mainPrisma.company.findFirst({
          select: { id: true },
        })
        companyId = firstCompany?.id || null
      }

      if (companyId) {
        const companyPrisma = getCompanyPrisma(companyId)
        const emailConfig = await getNotificationConfig(companyPrisma)
        
        if (emailConfig.emailEnabled && emailConfig.smtpHost && emailConfig.smtpUser && emailConfig.smtpPassword) {
          smtpHost = emailConfig.smtpHost
          smtpPort = emailConfig.smtpPort || 587
          smtpUser = emailConfig.smtpUser
          smtpPassword = emailConfig.smtpPassword
          smtpFrom = emailConfig.smtpFrom || emailConfig.smtpUser
          emailEnabled = emailConfig.emailEnabled
          configSource = 'db'
          console.log('[FORGOT-PASSWORD] ✓ Configuration SMTP récupérée depuis les paramètres de l\'application')
        }
      }
    } catch (error) {
      console.warn('[FORGOT-PASSWORD] Impossible de récupérer la config depuis la DB:', error)
    }

    // Fallback sur les variables d'environnement si la config DB n'est pas disponible
    if (!smtpHost || !smtpUser || !smtpPassword) {
      smtpHost = process.env.SMTP_HOST
      smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
      smtpUser = process.env.SMTP_USER
      smtpPassword = process.env.SMTP_PASSWORD
      smtpFrom = process.env.SMTP_FROM || smtpUser
      configSource = 'env'
      if (smtpHost || smtpUser || smtpPassword) {
        console.log('[FORGOT-PASSWORD] Utilisation de la configuration SMTP depuis les variables d\'environnement')
      }
    }

    // Construire l'URL de réinitialisation
          const baseUrl = await getBaseUrl()
          const resetUrl = `${baseUrl}/reset-password/${token}`

    // Vérifier la configuration SMTP
    const smtpConfigured = !!(smtpHost && smtpUser && smtpPassword)
    
    console.log('[FORGOT-PASSWORD] Configuration SMTP:', {
      source: configSource,
      smtpHost: smtpHost ? '✓ Configuré' : '✗ Manquant',
      smtpUser: smtpUser ? '✓ Configuré' : '✗ Manquant',
      smtpPassword: smtpPassword ? '✓ Configuré' : '✗ Manquant',
      smtpPort: smtpPort,
      smtpFrom: smtpFrom || 'Non défini',
      emailEnabled: emailEnabled,
      configured: smtpConfigured,
    })

    // Envoyer l'email
    let emailSent = false
    try {
      if (smtpConfigured && emailEnabled) {
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
              .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .button:hover { background-color: #4338CA; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Réinitialisation de votre mot de passe</h2>
              <p>Bonjour ${user.name},</p>
              <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte FixTector.</p>
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
              <p>Ou copiez et collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
              <p><strong>Ce lien expire dans 1 heure.</strong></p>
              <p>Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.</p>
              <div class="footer">
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              </div>
            </div>
          </body>
          </html>
        `

        const emailText = `
Réinitialisation de votre mot de passe

Bonjour ${user.name},

Vous avez demandé à réinitialiser votre mot de passe pour votre compte FixTector.

Cliquez sur le lien suivant pour créer un nouveau mot de passe :
${resetUrl}

Ce lien expire dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.

Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        `

        const emailResult = await transporter.sendMail({
          from: smtpFrom,
          to: user.email,
          subject: 'Réinitialisation de votre mot de passe - FixTector',
          text: emailText,
          html: emailHtml,
        })

        emailSent = true
        console.log(`[FORGOT-PASSWORD] ✓ Email de réinitialisation envoyé à ${user.email}`)
        console.log(`[FORGOT-PASSWORD] Message ID: ${emailResult.messageId}`)
      } else {
        console.error('[FORGOT-PASSWORD] ✗ Email non configuré - impossible d\'envoyer l\'email de réinitialisation')
        if (configSource === 'db') {
          console.error('[FORGOT-PASSWORD] Configuration trouvée dans les paramètres mais:')
          console.error('  - emailEnabled:', emailEnabled ? '✓ Activé' : '✗ DÉSACTIVÉ')
          console.error('  - SMTP_HOST:', smtpHost ? '✓' : '✗ MANQUANT')
          console.error('  - SMTP_USER:', smtpUser ? '✓' : '✗ MANQUANT')
          console.error('  - SMTP_PASSWORD:', smtpPassword ? '✓' : '✗ MANQUANT')
          console.error('[FORGOT-PASSWORD] Activez et configurez l\'email dans Paramètres > Notifications')
        } else {
          console.error('[FORGOT-PASSWORD] Variables SMTP manquantes dans .env.local:')
          console.error('  - SMTP_HOST:', smtpHost ? '✓' : '✗ MANQUANT')
          console.error('  - SMTP_USER:', smtpUser ? '✓' : '✗ MANQUANT')
          console.error('  - SMTP_PASSWORD:', smtpPassword ? '✓' : '✗ MANQUANT')
          console.error('[FORGOT-PASSWORD] Ou configurez l\'email dans Paramètres > Notifications de l\'application')
        }
        
        // En développement, on peut retourner le token dans la réponse
        if (process.env.NODE_ENV === 'development') {
          return NextResponse.json({
            message: 'Email non configuré. Token de réinitialisation (DEV ONLY):',
            token: token,
            resetUrl: resetUrl,
            warning: 'Configurez SMTP_HOST, SMTP_USER et SMTP_PASSWORD dans .env.local',
          })
        }
        
        // En production, on retourne quand même un succès pour la sécurité, mais on log l'erreur
        // L'admin devra vérifier les logs pour voir que SMTP n'est pas configuré
      }
    } catch (emailError: any) {
      emailSent = false
      console.error('[FORGOT-PASSWORD] ✗ Erreur lors de l\'envoi de l\'email:', emailError)
      console.error('[FORGOT-PASSWORD] Détails de l\'erreur:', {
        message: emailError?.message,
        code: emailError?.code,
        command: emailError?.command,
        response: emailError?.response,
        responseCode: emailError?.responseCode,
        stack: emailError?.stack,
      })
      
      // En développement, on peut retourner plus d'informations
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json(
          { 
            error: 'Erreur lors de l\'envoi de l\'email',
            details: emailError?.message || 'Erreur inconnue',
            code: emailError?.code,
            token: token, // En dev seulement
            resetUrl: resetUrl, // En dev seulement
          },
          { status: 500 }
        )
      }
      // En production, on continue pour ne pas révéler si l'email existe
      // Mais on log l'erreur pour que l'admin puisse la voir
    }

    // Log final pour le débogage
    if (emailSent) {
      console.log(`[FORGOT-PASSWORD] ✓ Processus terminé avec succès pour ${user.email}`)
    } else {
      console.warn(`[FORGOT-PASSWORD] ⚠ Processus terminé mais email NON envoyé pour ${user.email}`)
    }

    return NextResponse.json({
      message: 'Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation.',
    })
  } catch (error: any) {
    console.error('Erreur lors de la demande de réinitialisation:', error)
    console.error('Stack trace:', error?.stack)
    // En développement, retourner plus de détails
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: 'Une erreur est survenue',
          details: error?.message || 'Erreur inconnue',
          stack: error?.stack,
        },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}


