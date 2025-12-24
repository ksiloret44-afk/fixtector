import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma } from '@/lib/db-manager'
import { sendSMS } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { phoneNumber, provider, apiKey, authToken, from, consumerKey, sender } = body

    if (!phoneNumber || !phoneNumber.trim()) {
      return NextResponse.json(
        { error: 'Numéro de téléphone requis' },
        { status: 400 }
      )
    }

    // Récupérer la connexion Prisma de l'entreprise
    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      )
    }

    // Créer une configuration de test avec les paramètres fournis
    const testConfig = {
      emailEnabled: false,
      smsEnabled: true,
      smsProvider: provider,
      smsApiKey: apiKey,
      smsAuthToken: authToken,
      smsFrom: from,
      smsConsumerKey: consumerKey,
      smsSender: sender,
    }

    // Message de test
    const testMessage = `Test SMS FixTector - Votre configuration SMS fonctionne correctement ! 🎉`

    // Envoyer le SMS de test avec throwOnError=true pour capturer toutes les erreurs
    try {
      const success = await sendSMS(testConfig, phoneNumber.trim(), testMessage, true)
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'SMS de test envoyé avec succès',
        })
      } else {
        // Ne devrait jamais arriver ici si throwOnError=true
        throw new Error('sendSMS a retourné false')
      }
    } catch (smsError: any) {
      // Capturer les erreurs spécifiques de Twilio
      let errorMessage = 'Échec de l\'envoi du SMS. Vérifiez votre configuration.'
      let errorDetails: any = undefined

      console.error('Erreur SMS complète:', {
        error: smsError,
        provider: smsError.provider,
        details: smsError.details,
        message: smsError.message,
        code: smsError.code,
        status: smsError.status,
      })

      if (smsError.provider === 'twilio' && smsError.details) {
        const twilioError = smsError.details
        errorDetails = twilioError
        
        // Codes d'erreur Twilio courants
        const errorCodes: Record<string, string> = {
          '20003': 'Account SID invalide. Vérifiez votre Account SID dans la console Twilio.',
          '20004': 'Auth Token invalide. Vérifiez votre Auth Token dans la console Twilio.',
          '21211': 'Numéro de téléphone invalide. Vérifiez le format du numéro (ex: +33612345678).',
          '21608': 'Le numéro expéditeur n\'est pas vérifié dans votre compte Twilio. Vérifiez-le dans la console Twilio.',
          '21610': 'Le numéro expéditeur n\'est pas autorisé pour ce type de message.',
          '21614': 'Le numéro de destination n\'est pas valide pour ce type de message.',
        }
        
        if (twilioError.code && errorCodes[twilioError.code]) {
          errorMessage = errorCodes[twilioError.code]
        } else {
          errorMessage = `Erreur Twilio (${twilioError.code || 'inconnu'}): ${twilioError.message || 'Erreur inconnue'}`
        }
      } else if (smsError.message) {
        errorMessage = smsError.message
      }

      // Toujours inclure les détails en développement, et aussi en production si c'est une erreur Twilio
      const includeDetails = process.env.NODE_ENV === 'development' || (smsError.provider === 'twilio' && errorDetails)

      // Vérifier si les valeurs sont vraiment présentes (pas juste des chaînes vides)
      const apiKeyStatus = apiKey && apiKey.trim() ? 'présent' : 'manquant ou vide'
      const authTokenStatus = authToken && authToken.trim() ? 'présent' : 'manquant ou vide'
      const fromStatus = from && from.trim() ? from : 'manquant ou vide'
      const consumerKeyStatus = consumerKey && consumerKey.trim() ? 'présent' : 'manquant ou vide'

      return NextResponse.json(
        { 
          error: errorMessage,
          details: includeDetails
            ? {
                provider,
                apiKey: apiKeyStatus,
                authToken: authTokenStatus,
                from: fromStatus,
                consumerKey: provider === 'ovh' ? consumerKeyStatus : undefined,
                twilioError: errorDetails || undefined,
                originalError: smsError.message || undefined,
                fullError: process.env.NODE_ENV === 'development' ? JSON.stringify(smsError, null, 2) : undefined,
              }
            : {
                provider,
                apiKey: apiKeyStatus,
                authToken: authTokenStatus,
                from: fromStatus,
                consumerKey: provider === 'ovh' ? consumerKeyStatus : undefined,
                twilioError: errorDetails || undefined,
              }
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi du SMS de test:', error)
    return NextResponse.json(
      {
        error: 'Une erreur est survenue lors de l\'envoi du SMS de test',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
