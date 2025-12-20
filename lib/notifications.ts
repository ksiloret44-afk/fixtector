/**
 * Service de notifications par email et SMS
 */

interface NotificationConfig {
  emailEnabled: boolean
  smsEnabled: boolean
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPassword?: string
  smtpFrom?: string
  smsProvider?: string
  smsApiKey?: string
  smsFrom?: string
}

interface RepairNotificationData {
  customerName: string
  customerEmail?: string
  customerPhone: string
  repairId: string
  ticketNumber: string
  deviceType: string
  brand: string
  model: string
  status: string
  estimatedCost?: number
  finalCost?: number
  estimatedTime?: string
  notes?: string
  companyName?: string
}

/**
 * Récupère la configuration des notifications depuis la base de données
 */
export async function getNotificationConfig(companyPrisma: any): Promise<NotificationConfig> {
  const settings = await companyPrisma.settings.findMany({
    where: {
      key: {
        in: [
          'emailEnabled',
          'smsEnabled',
          'smtpHost',
          'smtpPort',
          'smtpUser',
          'smtpPassword',
          'smtpFrom',
          'smsProvider',
          'smsApiKey',
          'smsFrom',
        ],
      },
    },
  })

  const configMap: Record<string, string> = {}
  settings.forEach((setting: any) => {
    configMap[setting.key] = setting.value
  })

  return {
    emailEnabled: configMap.emailEnabled === 'true',
    smsEnabled: configMap.smsEnabled === 'true',
    smtpHost: configMap.smtpHost,
    smtpPort: configMap.smtpPort ? parseInt(configMap.smtpPort) : undefined,
    smtpUser: configMap.smtpUser,
    smtpPassword: configMap.smtpPassword,
    smtpFrom: configMap.smtpFrom,
    smsProvider: configMap.smsProvider,
    smsApiKey: configMap.smsApiKey,
    smsFrom: configMap.smsFrom,
  }
}

/**
 * Envoie un email de notification
 */
async function sendEmail(
  config: NotificationConfig,
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<boolean> {
  if (!config.emailEnabled || !config.smtpHost || !config.smtpUser || !config.smtpPassword) {
    console.log('Email non configuré ou désactivé')
    return false
  }

  try {
    // Utiliser nodemailer pour envoyer l'email
    const nodemailer = require('nodemailer')

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort || 587,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    })

    await transporter.sendMail({
      from: config.smtpFrom || config.smtpUser,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    })

    console.log(`Email envoyé à ${to}`)
    return true
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error)
    return false
  }
}

/**
 * Envoie un SMS de notification
 */
async function sendSMS(
  config: NotificationConfig,
  to: string,
  message: string
): Promise<boolean> {
  if (!config.smsEnabled || !config.smsProvider || !config.smsApiKey) {
    console.log('SMS non configuré ou désactivé')
    return false
  }

  try {
    // Support pour différents fournisseurs SMS
    if (config.smsProvider === 'twilio') {
      const twilio = require('twilio')
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID || config.smsApiKey,
        process.env.TWILIO_AUTH_TOKEN
      )

      await client.messages.create({
        body: message,
        from: config.smsFrom || process.env.TWILIO_PHONE_NUMBER,
        to: to,
      })

      console.log(`SMS envoyé à ${to}`)
      return true
    } else if (config.smsProvider === 'ovh') {
      // OVH SMS API
      const response = await fetch('https://api.ovh.com/1.0/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ovh-Application-Key': config.smsApiKey,
        },
        body: JSON.stringify({
          serviceName: config.smsFrom,
          to: to,
          message: message,
        }),
      })

      if (response.ok) {
        console.log(`SMS envoyé à ${to}`)
        return true
      }
    } else if (config.smsProvider === 'custom') {
      // API personnalisée - format attendu: URL dans smsApiKey
      if (!config.smsApiKey) {
        console.error('URL de l\'API SMS personnalisée manquante')
        return false
      }

      try {
        const response = await fetch(config.smsApiKey, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: to,
            message: message,
            from: config.smsFrom,
          }),
        })

        if (response.ok) {
          console.log(`SMS envoyé à ${to}`)
          return true
        } else {
          const errorText = await response.text()
          console.error('Erreur API SMS personnalisée:', errorText)
          return false
        }
      } catch (error: any) {
        console.error('Erreur lors de l\'appel API SMS:', error.message)
        return false
      }
    }

    console.error('Fournisseur SMS non supporté:', config.smsProvider)
    return false
  } catch (error) {
    console.error('Erreur lors de l\'envoi du SMS:', error)
    return false
  }
}

/**
 * Génère le template d'email pour un changement de statut
 */
function generateEmailTemplate(data: RepairNotificationData, statusLabel: string): { subject: string; html: string; text: string } {
  const statusMessages: Record<string, { subject: string; message: string }> = {
    pending: {
      subject: 'Votre réparation a été enregistrée',
      message: 'Votre réparation a été enregistrée et est en attente de traitement.',
    },
    in_progress: {
      subject: 'Votre réparation est en cours',
      message: 'Votre réparation est maintenant en cours de traitement.',
    },
    waiting_parts: {
      subject: 'En attente de pièces pour votre réparation',
      message: 'Votre réparation est en attente de pièces détachées.',
    },
    completed: {
      subject: 'Votre réparation est terminée',
      message: 'Votre réparation est terminée et prête à être récupérée.',
    },
    cancelled: {
      subject: 'Réparation annulée',
      message: 'Votre réparation a été annulée.',
    },
  }

  const statusInfo = statusMessages[data.status] || {
    subject: 'Mise à jour de votre réparation',
    message: `Le statut de votre réparation a été mis à jour: ${statusLabel}`,
  }

  const costInfo = data.finalCost
    ? `<p><strong>Coût final:</strong> ${data.finalCost.toFixed(2)} €</p>`
    : data.estimatedCost
    ? `<p><strong>Coût estimé:</strong> ${data.estimatedCost.toFixed(2)} €</p>`
    : ''

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .info-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.companyName || 'FixTector'}</h1>
        </div>
        <div class="content">
          <h2>${statusInfo.subject}</h2>
          <p>Bonjour ${data.customerName},</p>
          <p>${statusInfo.message}</p>
          <div class="info-box">
            <h3>Détails de la réparation</h3>
            <p><strong>Numéro de ticket:</strong> ${data.ticketNumber}</p>
            <p><strong>Appareil:</strong> ${data.deviceType} - ${data.brand} ${data.model}</p>
            <p><strong>Statut:</strong> ${statusLabel}</p>
            ${costInfo}
            ${data.estimatedTime ? `<p><strong>Durée estimée:</strong> ${data.estimatedTime}</p>` : ''}
            ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
          </div>
          <p>Pour toute question, n'hésitez pas à nous contacter.</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par ${data.companyName || 'FixTector'}</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
${data.companyName || 'FixTector'}

${statusInfo.subject}

Bonjour ${data.customerName},

${statusInfo.message}

Détails de la réparation:
- Numéro de ticket: ${data.ticketNumber}
- Appareil: ${data.deviceType} - ${data.brand} ${data.model}
- Statut: ${statusLabel}
${data.finalCost ? `- Coût final: ${data.finalCost.toFixed(2)} €` : data.estimatedCost ? `- Coût estimé: ${data.estimatedCost.toFixed(2)} €` : ''}
${data.estimatedTime ? `- Durée estimée: ${data.estimatedTime}` : ''}
${data.notes ? `- Notes: ${data.notes}` : ''}

Pour toute question, n'hésitez pas à nous contacter.

Cet email a été envoyé automatiquement.
  `

  return {
    subject: statusInfo.subject,
    html,
    text,
  }
}

/**
 * Génère le template SMS pour un changement de statut
 */
function generateSMSTemplate(data: RepairNotificationData, statusLabel: string): string {
  const statusMessages: Record<string, string> = {
    pending: 'Votre réparation a été enregistrée',
    in_progress: 'Votre réparation est en cours',
    waiting_parts: 'En attente de pièces pour votre réparation',
    completed: 'Votre réparation est terminée et prête à être récupérée',
    cancelled: 'Votre réparation a été annulée',
  }

  const message = statusMessages[data.status] || `Mise à jour: ${statusLabel}`
  const costInfo = data.finalCost
    ? ` Coût: ${data.finalCost.toFixed(2)}€`
    : data.estimatedCost
    ? ` Coût estimé: ${data.estimatedCost.toFixed(2)}€`
    : ''

  return `${message}. Ticket: ${data.ticketNumber}. ${data.deviceType} ${data.brand} ${data.model}.${costInfo} ${data.companyName || 'FixTector'}`
}

/**
 * Envoie une notification pour un changement de statut de réparation
 */
export async function sendRepairStatusNotification(
  companyPrisma: any,
  data: RepairNotificationData
): Promise<{ emailSent: boolean; smsSent: boolean }> {
  const config = await getNotificationConfig(companyPrisma)

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    in_progress: 'En cours',
    waiting_parts: 'En attente de pièces',
    completed: 'Terminée',
    cancelled: 'Annulée',
  }

  const statusLabel = statusLabels[data.status] || data.status

  const emailTemplate = generateEmailTemplate(data, statusLabel)
  const smsTemplate = generateSMSTemplate(data, statusLabel)

  const results = {
    emailSent: false,
    smsSent: false,
  }

  // Envoyer l'email si configuré et si le client a un email
  if (data.customerEmail && config.emailEnabled) {
    results.emailSent = await sendEmail(
      config,
      data.customerEmail,
      emailTemplate.subject,
      emailTemplate.html,
      emailTemplate.text
    )
  }

  // Envoyer le SMS si configuré et si le client a un téléphone
  if (data.customerPhone && config.smsEnabled) {
    results.smsSent = await sendSMS(config, data.customerPhone, smsTemplate)
  }

  return results
}

