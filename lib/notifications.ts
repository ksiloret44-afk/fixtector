/**
 * Service de notifications par email et SMS
 */

import { getTrackingUrl as getTrackingUrlFromLib } from './tracking'
import crypto from 'crypto'
import OVH from 'ovh'

/**
 * Supprime les accents d'une chaîne de caractères
 * @param str - La chaîne à traiter
 * @returns La chaîne sans accents
 */
function removeAccents(str: string): string {
  if (!str) return str
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les diacritiques
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
}

/**
 * Normalise un numéro de téléphone en ajoutant +33 par défaut si nécessaire
 * @param phoneNumber - Le numéro de téléphone à normaliser
 * @returns Le numéro normalisé avec l'indicatif +33
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return phoneNumber
  
  // Nettoyer le numéro (enlever espaces, tirets, points, etc.)
  let cleaned = phoneNumber.replace(/[\s\-\.\(\)]/g, '')
  
  // Si le numéro commence déjà par +33, le retourner tel quel
  if (cleaned.startsWith('+33')) {
    return cleaned
  }
  
  // Si le numéro commence par 0033, remplacer par +33
  if (cleaned.startsWith('0033')) {
    return '+33' + cleaned.substring(4)
  }
  
  // Si le numéro commence par 0, remplacer par +33
  if (cleaned.startsWith('0')) {
    return '+33' + cleaned.substring(1)
  }
  
  // Si le numéro commence par 33 (sans le 0), ajouter le +
  if (cleaned.startsWith('33') && cleaned.length >= 10) {
    return '+' + cleaned
  }
  
  // Si le numéro n'a pas d'indicatif et fait 10 chiffres, ajouter +33
  if (/^\d{10}$/.test(cleaned)) {
    return '+33' + cleaned.substring(1) // Enlever le 0 initial et ajouter +33
  }
  
  // Si le numéro n'a pas d'indicatif et fait 9 chiffres, ajouter +33
  if (/^\d{9}$/.test(cleaned)) {
    return '+33' + cleaned
  }
  
  // Si le numéro commence déjà par +, le retourner tel quel
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  
  // Par défaut, ajouter +33 devant
  return '+33' + cleaned
}

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
  smsAuthToken?: string
  smsFrom?: string
  smsConsumerKey?: string // Pour OVH Consumer Key
  smsSender?: string // Pour OVH: sender différent du service name (peut être un numéro ou un nom d'expéditeur)
}

interface RepairNotificationData {
  customerName: string
  customerEmail?: string
  customerPhone: string
  repairId: string
  ticketNumber: string
  trackingToken?: string
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
          'smsAuthToken',
          'smsFrom',
          'smsConsumerKey', // Pour OVH Consumer Key
          'smsSender', // Pour OVH: sender différent du service name
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
    smsAuthToken: configMap.smsAuthToken,
    smsFrom: configMap.smsFrom,
    smsConsumerKey: configMap.smsConsumerKey,
    smsSender: configMap.smsSender, // Pour OVH: sender différent du service name
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
export async function sendSMS(
  config: NotificationConfig,
  to: string,
  message: string,
  throwOnError: boolean = false
): Promise<boolean> {
  // Normaliser le numéro de téléphone avec +33 par défaut
  const normalizedTo = normalizePhoneNumber(to)
  console.log(`[sendSMS] Normalisation du numéro: ${to} -> ${normalizedTo}`)
  
  if (!config.smsEnabled || !config.smsProvider || !config.smsApiKey) {
    const errorMsg = 'SMS non configuré ou désactivé'
    console.log(errorMsg)
    if (throwOnError) {
      throw new Error(errorMsg)
    }
    return false
  }

  try {
    // Support pour différents fournisseurs SMS
    if (config.smsProvider === 'twilio') {
      let twilio
      try {
        twilio = require('twilio')
      } catch (error) {
        const errorMsg = 'Twilio non installé. SMS désactivé. Installez-le avec: npm install twilio'
        console.warn(errorMsg)
        if (throwOnError) {
          throw new Error(errorMsg)
        }
        return false
      }
      
      if (!twilio) {
        const errorMsg = 'Twilio non disponible'
        console.warn(errorMsg)
        if (throwOnError) {
          throw new Error(errorMsg)
        }
        return false
      }
      
      // Vérifier que l'Auth Token est fourni (pas juste une chaîne vide)
      const authToken = process.env.TWILIO_AUTH_TOKEN || config.smsAuthToken
      if (!authToken || !authToken.trim()) {
        console.error('Auth Token Twilio manquant ou vide')
        throw new Error('Auth Token Twilio manquant ou vide')
      }

      const accountSid = process.env.TWILIO_ACCOUNT_SID || config.smsApiKey
      if (!accountSid || !accountSid.trim()) {
        console.error('Account SID Twilio manquant ou vide')
        throw new Error('Account SID Twilio manquant ou vide')
      }

      const fromNumber = config.smsFrom || process.env.TWILIO_PHONE_NUMBER
      if (!fromNumber || !fromNumber.trim()) {
        console.error('Numéro expéditeur Twilio manquant ou vide')
        throw new Error('Numéro expéditeur Twilio manquant ou vide')
      }

      try {
        const client = twilio(accountSid, authToken)

        const result = await client.messages.create({
          body: message,
          from: fromNumber,
          to: normalizedTo,
        })

        console.log(`SMS envoyé à ${normalizedTo} via Twilio (SID: ${result.sid})`)
        return true
      } catch (twilioError: any) {
        // Capturer les erreurs spécifiques de Twilio
        const errorDetails = {
          code: twilioError.code,
          message: twilioError.message,
          status: twilioError.status,
          moreInfo: twilioError.moreInfo,
        }
        
        console.error('Erreur Twilio:', errorDetails)
        console.error('Erreur Twilio complète:', JSON.stringify(twilioError, null, 2))
        
        // Re-lancer l'erreur avec plus de détails pour que l'API puisse les récupérer
        throw {
          ...twilioError,
          provider: 'twilio',
          details: errorDetails
        }
      }
    } else if (config.smsProvider === 'ovh') {
      // OVH SMS API
      if (!config.smsFrom) {
        const errorMsg = 'Service name OVH manquant (smsFrom). Le service name est le nom de votre compte SMS OVH (ex: sms-xxxxx-1)'
        console.error(errorMsg)
        if (throwOnError) {
          throw new Error(errorMsg)
        }
        return false
      }

      if (!config.smsApiKey) {
        const errorMsg = 'Clé API OVH manquante. Vous devez configurer votre Application Key OVH'
        console.error(errorMsg)
        if (throwOnError) {
          throw new Error(errorMsg)
        }
        return false
      }

      // Application Key (AK) - dans smsApiKey
      const applicationKey = config.smsApiKey || process.env.OVH_APPLICATION_KEY
      if (!applicationKey || !applicationKey.trim()) {
        const errorMsg = 'Application Key OVH manquante. Configurez-la dans "Clé API"'
        console.error(errorMsg)
        if (throwOnError) {
          throw new Error(errorMsg)
        }
        return false
      }

      // Application Secret (AS) - dans smsAuthToken
      const applicationSecret = config.smsAuthToken || process.env.OVH_APPLICATION_SECRET
      if (!applicationSecret || !applicationSecret.trim()) {
        const errorMsg = 'Application Secret OVH manquant. Configurez-le dans "Auth Token"'
        console.error(errorMsg)
        if (throwOnError) {
          throw new Error(errorMsg)
        }
        return false
      }

      // Consumer Key (CK) - depuis config ou variable d'environnement
      const consumerKey = config.smsConsumerKey || process.env.OVH_CONSUMER_KEY
      console.log('OVH Consumer Key check:', {
        fromConfig: !!config.smsConsumerKey,
        fromEnv: !!process.env.OVH_CONSUMER_KEY,
        consumerKeyLength: consumerKey ? consumerKey.length : 0,
        consumerKeyPrefix: consumerKey ? consumerKey.substring(0, 10) + '...' : 'MISSING',
      })
      if (!consumerKey || !consumerKey.trim()) {
        const errorMsg = 'Consumer Key OVH manquant. Configurez-le dans "Consumer Key OVH" ou dans OVH_CONSUMER_KEY (.env.local)'
        console.error(errorMsg)
        if (throwOnError) {
          throw new Error(errorMsg)
        }
        return false
      }

      const serviceName = config.smsFrom // Le service name OVH (ex: sms-xxxxx-1)
      
      // Pour OVH, le sender peut être :
      // 1. Un numéro de téléphone (format international, ex: +33612345678)
      // 2. Un nom d'expéditeur court (shortcode) créé dans l'interface OVH
      // 3. Le service name lui-même (mais il doit être créé comme sender)
      // Par défaut, on utilise le service name, mais l'utilisateur peut spécifier un sender différent
      // Si le sender n'est pas spécifié ou est identique au service name, on essaie d'abord avec le service name
      // Si ça échoue, on peut essayer avec un numéro de téléphone ou un sender personnalisé
      // Utiliser smsSender si spécifié, sinon utiliser le service name
      // ATTENTION: Si vous utilisez un numéro personnel, les SMS partiront de ce numéro
      const sender = config.smsSender || config.smsFrom || serviceName
      
      try {
        // Utiliser le package officiel OVH qui gère automatiquement la signature
        const ovhClient = new OVH({
          endpoint: 'ovh-eu', // ou 'ovh-us', 'ovh-ca' selon votre région
          appKey: applicationKey,
          appSecret: applicationSecret,
          consumerKey: consumerKey,
        })

        // Envoyer le SMS via l'API OVH
        // Note: Le sender doit être créé dans l'interface OVH ou être un numéro de téléphone vérifié
        const result = await ovhClient.requestPromised('POST', `/sms/${serviceName}/jobs`, {
          receivers: [normalizedTo],
          message: message,
          sender: sender, // Utiliser le sender spécifié (peut être un numéro ou un nom d'expéditeur)
        })

        console.log(`SMS envoyé à ${normalizedTo} via OVH (ID: ${result.id || result.totalCreditsRemoved || 'N/A'})`)
        console.log(`[sendSMS] Sender utilisé: ${sender}`)
        return true
      } catch (ovhError: any) {
        console.error('Erreur lors de l\'envoi SMS via OVH:', ovhError)
        if (throwOnError) {
          throw {
            provider: 'ovh',
            message: ovhError.message || ovhError.errorText || ovhError.error?.message || 'Erreur lors de l\'envoi du SMS via OVH',
            details: ovhError.error || ovhError,
            originalError: ovhError,
          }
        }
        return false
      }
    } else if (config.smsProvider === 'smsapi') {
      // SMSAPI - API REST avec authentification Bearer
      if (!config.smsApiKey) {
        console.error('Clé API SMSAPI manquante')
        return false
      }

      try {
        // SMSAPI utilise une API REST avec format form-data
        const formData = new URLSearchParams()
        formData.append('to', to)
        formData.append('message', message)
        if (config.smsFrom) {
          formData.append('from', config.smsFrom)
        }
        formData.append('format', 'json')

        const response = await fetch('https://api.smsapi.com/sms.do', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.smsApiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.error) {
            console.error('Erreur SMSAPI:', result.error, result.message)
            return false
          }
          console.log(`SMS envoyé à ${to} via SMSAPI`)
          return true
        } else {
          const errorText = await response.text()
          console.error('Erreur SMSAPI:', response.status, errorText)
          return false
        }
      } catch (error: any) {
        console.error('Erreur lors de l\'envoi SMS via SMSAPI:', error.message)
        return false
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

    const errorMsg = `Fournisseur SMS non supporté: ${config.smsProvider}`
    console.error(errorMsg)
    if (throwOnError) {
      throw new Error(errorMsg)
    }
    return false
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi du SMS:', error)
    console.error('Erreur complète:', JSON.stringify(error, null, 2))
    
    // Si l'erreur a déjà été formatée (avec provider et details), la re-lancer telle quelle
    if (error.provider && error.details) {
      if (throwOnError) {
        throw error
      }
      return false
    }
    
    // Si c'est une erreur Twilio mais pas encore formatée, la formater
    if (error.code && (error.code.toString().startsWith('2') || error.status)) {
      const formattedError = {
        ...error,
        provider: 'twilio',
        details: {
          code: error.code,
          message: error.message,
          status: error.status,
          moreInfo: error.moreInfo,
        }
      }
      if (throwOnError) {
        throw formattedError
      }
      return false
    }
    
    // Si throwOnError est true, lancer l'erreur, sinon retourner false
    if (throwOnError) {
      throw {
        message: error.message || 'Erreur lors de l\'envoi du SMS',
        provider: config.smsProvider,
        originalError: error,
      }
    }
    
    // Sinon, retourner false pour compatibilité avec le code existant
    return false
  }
}

/**
 * Génère le template d'email pour un changement de statut
 */
import { getBaseUrl } from './base-url'

async function getTrackingUrl(token: string): Promise<string> {
  const baseUrl = await getBaseUrl()
  const url = `${baseUrl}/track/${token}`
  console.log('[NOTIFICATIONS] Tracking URL générée:', url, 'pour token:', token)
  return url
}

async function getReviewUrl(token: string): Promise<string> {
  const baseUrl = await getBaseUrl()
  const url = `${baseUrl}/review/${token}`
  console.log('[NOTIFICATIONS] Review URL générée:', url, 'pour token:', token)
  return url
}

async function generateEmailTemplate(data: RepairNotificationData, statusLabel: string, reviewToken?: string, trackingUrl?: string | null, reviewUrl?: string | null): Promise<{ subject: string; html: string; text: string }> {
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

  // Utiliser les URLs passées en paramètre (générées une seule fois)
  // Si non fournies, les générer
  const finalTrackingUrl = trackingUrl !== undefined ? trackingUrl : (data.trackingToken ? await getTrackingUrl(data.trackingToken) : null)
  const finalReviewUrl = reviewUrl !== undefined ? reviewUrl : (reviewToken && data.status === 'completed' ? await getReviewUrl(reviewToken) : null)
  
  console.log('[EMAIL TEMPLATE] Tracking URL:', finalTrackingUrl)
  console.log('[EMAIL TEMPLATE] Review URL:', finalReviewUrl)

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
          ${finalTrackingUrl ? `
          <div class="info-box" style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #4F46E5;">Suivez votre réparation en temps réel</h3>
            <p>Consultez l'avancement de votre réparation à tout moment avec ce lien unique :</p>
            <p style="text-align: center; margin: 15px 0;">
              <a href="${finalTrackingUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Voir le suivi de ma réparation
              </a>
            </p>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
              Ou copiez ce lien : ${finalTrackingUrl}
            </p>
          </div>
          ` : ''}
          ${finalReviewUrl ? `
          <div class="info-box" style="background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #10B981;">Partagez votre expérience</h3>
            <p>Votre avis nous tient à cœur ! Prenez quelques instants pour nous laisser un avis sur votre réparation :</p>
            <p style="text-align: center; margin: 15px 0;">
              <a href="${finalReviewUrl}" style="display: inline-block; background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Laisser un avis
              </a>
            </p>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
              Ou copiez ce lien : ${finalReviewUrl}
            </p>
          </div>
          ` : ''}
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

${finalTrackingUrl ? `
Suivez votre réparation en temps réel :
${finalTrackingUrl}
` : ''}
${finalReviewUrl ? `
Partagez votre expérience en laissant un avis :
${finalReviewUrl}
` : ''}

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
 * Optimisé pour être court et sans accents
 * Utilise les mêmes URLs que les emails
 */
async function generateSMSTemplate(data: RepairNotificationData, statusLabel: string, reviewToken?: string, trackingUrl?: string | null, reviewUrl?: string | null): Promise<string> {
  const statusMessages: Record<string, string> = {
    pending: 'Reparation enregistree',
    in_progress: 'Reparation en cours',
    waiting_parts: 'En attente de pieces',
    completed: 'Reparation terminee et prete',
    cancelled: 'Reparation annulee',
  }

  // Message sans accents
  const message = statusMessages[data.status] || `Mise a jour: ${removeAccents(statusLabel)}`
  
  // Raccourcir les informations de coût
  const costInfo = data.finalCost
    ? ` ${data.finalCost.toFixed(0)}€`
    : data.estimatedCost
    ? ` ~${data.estimatedCost.toFixed(0)}€`
    : ''
  
  // Utiliser les mêmes URLs que les emails (passées en paramètre)
  // Si non fournies, les générer
  const finalTrackingUrl = trackingUrl !== undefined ? trackingUrl : (data.trackingToken ? await getTrackingUrl(data.trackingToken) : null)
  const finalReviewUrl = reviewUrl !== undefined ? reviewUrl : (reviewToken && data.status === 'completed' ? await getReviewUrl(reviewToken) : null)
  
  console.log('[SMS TEMPLATE] Tracking URL (identique aux emails):', finalTrackingUrl)
  console.log('[SMS TEMPLATE] Review URL (identique aux emails):', finalReviewUrl)
  
  let trackingLink = ''
  if (finalTrackingUrl) {
    trackingLink = ` Suivi: ${finalTrackingUrl}`
  }
  
  let reviewLink = ''
  if (finalReviewUrl) {
    reviewLink = ` Avis: ${finalReviewUrl}`
  }

  // Simplifier le message : Ticket, Appareil, Coût, Liens, Nom entreprise
  // Format: Message. T:XXX. Appareil. Coût. Liens. STOP CODE
  const deviceInfo = `${data.deviceType} ${data.brand} ${data.model}`.trim()
  const ticketShort = data.ticketNumber.substring(0, 8) // Utiliser seulement les 8 premiers caractères du ticket
  
  // Construire le message de manière optimisée
  let smsText = `${message}. T:${ticketShort}`
  
  if (deviceInfo) {
    smsText += ` ${deviceInfo}`
  }
  
  if (costInfo) {
    smsText += costInfo
  }
  
  if (trackingLink) {
    smsText += trackingLink
  }
  
  if (reviewLink) {
    smsText += reviewLink
  }
  
  // Ajouter le nom de l'entreprise et le code STOP
  const companyName = removeAccents(data.companyName || 'FixTector')
  smsText += ` ${companyName} STOP 36212`

  return smsText
}

/**
 * Envoie une notification pour un changement de statut de réparation
 */
export async function sendRepairStatusNotification(
  companyPrisma: any,
  data: RepairNotificationData,
  reviewToken?: string
): Promise<{ emailSent: boolean; smsSent: boolean }> {
  console.log('[NOTIFICATIONS] Envoi de notification pour réparation:', data.repairId, 'Tracking token:', data.trackingToken, 'Review token:', reviewToken)
  
  const config = await getNotificationConfig(companyPrisma)

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    in_progress: 'En cours',
    waiting_parts: 'En attente de pièces',
    completed: 'Terminée',
    cancelled: 'Annulée',
  }

  const statusLabel = statusLabels[data.status] || data.status

  // Générer les URLs UNE SEULE FOIS pour les utiliser dans les emails ET les SMS
  const trackingUrl = data.trackingToken ? await getTrackingUrl(data.trackingToken) : null
  const reviewUrl = reviewToken && data.status === 'completed' ? await getReviewUrl(reviewToken) : null
  
  console.log('[NOTIFICATIONS] URLs générées (utilisées pour emails ET SMS):')
  console.log('[NOTIFICATIONS] - Tracking URL:', trackingUrl)
  console.log('[NOTIFICATIONS] - Review URL:', reviewUrl)

  console.log('[NOTIFICATIONS] Génération des templates avec les mêmes URLs...')
  const emailTemplate = await generateEmailTemplate(data, statusLabel, reviewToken, trackingUrl, reviewUrl)
  const smsTemplate = await generateSMSTemplate(data, statusLabel, reviewToken, trackingUrl, reviewUrl)
  console.log('[NOTIFICATIONS] Templates générés, SMS contient:', smsTemplate.substring(0, 100) + '...')

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

