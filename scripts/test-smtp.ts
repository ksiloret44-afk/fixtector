/**
 * Script de test pour vérifier la configuration SMTP
 */

import nodemailer from 'nodemailer'
import * as fs from 'fs'
import * as path from 'path'

// Charger les variables d'environnement depuis .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach((line) => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        process.env[key.trim()] = value
      }
    }
  })
}

async function testSMTP() {
  console.log('=== TEST DE CONFIGURATION SMTP ===\n')

  // Récupérer les variables d'environnement
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
  const smtpUser = process.env.SMTP_USER
  const smtpPassword = process.env.SMTP_PASSWORD
  const smtpFrom = process.env.SMTP_FROM || smtpUser

  console.log('Configuration SMTP:')
  console.log(`  SMTP_HOST: ${smtpHost || '❌ NON DÉFINI'}`)
  console.log(`  SMTP_PORT: ${smtpPort}`)
  console.log(`  SMTP_USER: ${smtpUser || '❌ NON DÉFINI'}`)
  console.log(`  SMTP_PASSWORD: ${smtpPassword ? '✓ Défini (' + smtpPassword.length + ' caractères)' : '❌ NON DÉFINI'}`)
  console.log(`  SMTP_FROM: ${smtpFrom || 'Non défini (utilisera SMTP_USER)'}`)
  console.log('')

  // Vérifier si toutes les variables sont définies
  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.error('❌ ERREUR: Variables SMTP manquantes!')
    console.error('')
    console.error('Ajoutez ces variables dans votre fichier .env.local:')
    console.error('  SMTP_HOST=smtp.gmail.com')
    console.error('  SMTP_PORT=587')
    console.error('  SMTP_USER=votre-email@gmail.com')
    console.error('  SMTP_PASSWORD=votre-mot-de-passe-app')
    console.error('  SMTP_FROM=votre-email@gmail.com (optionnel)')
    process.exit(1)
  }

  console.log('✓ Toutes les variables SMTP sont définies')
  console.log('')

  // Créer le transporteur
  console.log('Création du transporteur SMTP...')
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  })

  // Tester la connexion
  console.log('Test de connexion au serveur SMTP...')
  try {
    await transporter.verify()
    console.log('✓ Connexion SMTP réussie!')
    console.log('')
  } catch (error: any) {
    console.error('❌ ERREUR: Impossible de se connecter au serveur SMTP')
    console.error('')
    console.error('Détails de l\'erreur:')
    console.error(`  Message: ${error.message}`)
    console.error(`  Code: ${error.code || 'N/A'}`)
    if (error.response) {
      console.error(`  Réponse: ${error.response}`)
    }
    console.error('')
    console.error('Vérifiez:')
    console.error('  1. Que SMTP_HOST est correct')
    console.error('  2. Que SMTP_PORT est correct (587 pour TLS, 465 pour SSL)')
    console.error('  3. Que SMTP_USER et SMTP_PASSWORD sont corrects')
    console.error('  4. Que votre pare-feu/autorisation permet la connexion')
    if (smtpHost?.includes('gmail')) {
      console.error('  5. Pour Gmail: utilisez un "Mot de passe d\'application" (pas votre mot de passe normal)')
      console.error('     - Activez l\'authentification à 2 facteurs')
      console.error('     - Générez un mot de passe d\'application dans les paramètres Google')
    }
    process.exit(1)
  }

  // Demander l'adresse email de test
  const testEmail = process.argv[2] || smtpUser
  console.log(`Envoi d'un email de test à: ${testEmail}`)
  console.log('')

  // Envoyer un email de test
  try {
    const info = await transporter.sendMail({
      from: smtpFrom,
      to: testEmail,
      subject: 'Test SMTP - FixTector',
      text: `
Ceci est un email de test pour vérifier la configuration SMTP.

Si vous recevez cet email, la configuration SMTP fonctionne correctement!

Date: ${new Date().toLocaleString('fr-FR')}
      `.trim(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Test SMTP - FixTector</h2>
          <p>Ceci est un email de test pour vérifier la configuration SMTP.</p>
          <p><strong>Si vous recevez cet email, la configuration SMTP fonctionne correctement!</strong></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Date: ${new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      `,
    })

    console.log('✓ Email envoyé avec succès!')
    console.log('')
    console.log('Détails:')
    console.log(`  Message ID: ${info.messageId}`)
    console.log(`  De: ${smtpFrom}`)
    console.log(`  À: ${testEmail}`)
    console.log(`  Réponse: ${info.response || 'N/A'}`)
    console.log('')
    console.log('Vérifiez votre boîte de réception (et les spams) pour confirmer la réception.')
  } catch (error: any) {
    console.error('❌ ERREUR: Impossible d\'envoyer l\'email')
    console.error('')
    console.error('Détails de l\'erreur:')
    console.error(`  Message: ${error.message}`)
    console.error(`  Code: ${error.code || 'N/A'}`)
    if (error.response) {
      console.error(`  Réponse: ${error.response}`)
    }
    if (error.responseCode) {
      console.error(`  Code de réponse: ${error.responseCode}`)
    }
    console.error('')
    process.exit(1)
  }
}

testSMTP().catch((error) => {
  console.error('Erreur inattendue:', error)
  process.exit(1)
})

