import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { testEmail } = body

    if (!testEmail || !testEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Adresse email valide requise' },
        { status: 400 }
      )
    }

    // Récupérer la configuration email depuis les variables d'environnement
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD
    const smtpFrom = process.env.SMTP_FROM || smtpUser

    // Vérifier la configuration
    const config = {
      smtpHost: smtpHost || 'NON CONFIGURÉ',
      smtpPort: smtpPort,
      smtpUser: smtpUser || 'NON CONFIGURÉ',
      smtpPassword: smtpPassword ? '***' : 'NON CONFIGURÉ',
      smtpFrom: smtpFrom || 'NON CONFIGURÉ',
      configured: !!(smtpHost && smtpUser && smtpPassword),
    }

    console.log('[TEST-SMTP] Configuration:', config)

    if (!config.configured) {
      return NextResponse.json({
        success: false,
        error: 'SMTP non configuré',
        config: config,
        message: 'Configurez SMTP_HOST, SMTP_USER et SMTP_PASSWORD dans .env.local',
      })
    }

    // Tester la connexion SMTP
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

      // Vérifier la connexion
      await transporter.verify()
      console.log('[TEST-SMTP] ✓ Connexion SMTP vérifiée')

      // Envoyer un email de test
      const testResult = await transporter.sendMail({
        from: smtpFrom,
        to: testEmail,
        subject: 'Test SMTP - FixTector',
        text: `Ceci est un email de test pour vérifier la configuration SMTP de FixTector.
        
Si vous recevez cet email, la configuration SMTP fonctionne correctement !`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">Test SMTP - FixTector</h2>
            <p>Ceci est un email de test pour vérifier la configuration SMTP de FixTector.</p>
            <p>Si vous recevez cet email, la configuration SMTP fonctionne correctement !</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Email envoyé depuis: ${smtpFrom}</p>
          </div>
        `,
      })

      console.log('[TEST-SMTP] ✓ Email de test envoyé:', testResult.messageId)

      return NextResponse.json({
        success: true,
        message: 'Email de test envoyé avec succès',
        messageId: testResult.messageId,
        config: {
          ...config,
          smtpPassword: '***',
        },
      })
    } catch (smtpError: any) {
      console.error('[TEST-SMTP] ✗ Erreur SMTP:', smtpError)
      
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de l\'envoi de l\'email',
        details: {
          message: smtpError?.message,
          code: smtpError?.code,
          command: smtpError?.command,
          response: smtpError?.response,
          responseCode: smtpError?.responseCode,
        },
        config: config,
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[TEST-SMTP] Erreur:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Une erreur est survenue',
        details: error?.message,
      },
      { status: 500 }
    )
  }
}

