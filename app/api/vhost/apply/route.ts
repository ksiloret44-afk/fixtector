import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { configContent, serverType, domain } = await request.json()

    if (!configContent || !serverType || !domain) {
      return NextResponse.json(
        { error: 'Configuration incomplète' },
        { status: 400 }
      )
    }

    // IMPORTANT: Cette fonction nécessite des privilèges root
    // En production, cette fonction devrait être exécutée via un script séparé avec sudo
    // ou via un système de queue avec des permissions appropriées

    const configPath = serverType === 'apache'
      ? `/etc/apache2/sites-available/${domain}.conf`
      : `/etc/nginx/sites-available/${domain}.conf`

    // Note: En production, vous devriez:
    // 1. Sauvegarder le fichier dans un dossier accessible
    // 2. Fournir des instructions pour l'application manuelle
    // 3. Ou utiliser un système avec permissions sudo configuré

    // Pour l'instant, on sauvegarde dans un dossier accessible
    const outputDir = path.join(process.cwd(), 'vhost-configs')
    await fs.mkdir(outputDir, { recursive: true })
    
    const outputPath = path.join(outputDir, `${domain}.conf`)
    await fs.writeFile(outputPath, configContent, 'utf-8')

    // Générer un script d'installation
    const installScript = serverType === 'apache'
      ? generateApacheInstallScript(domain, outputPath)
      : generateNginxInstallScript(domain, outputPath)

    const scriptPath = path.join(outputDir, `install-${domain}.sh`)
    await fs.writeFile(scriptPath, installScript, 'utf-8')
    await fs.chmod(scriptPath, '755')

    return NextResponse.json({
      success: true,
      message: 'Configuration générée. Utilisez le script d\'installation fourni.',
      configPath: outputPath,
      scriptPath: scriptPath,
      instructions: serverType === 'apache'
        ? [
            `1. Copiez le fichier: sudo cp ${outputPath} ${configPath}`,
            `2. Activez le site: sudo a2ensite ${domain}.conf`,
            `3. Testez: sudo apache2ctl configtest`,
            `4. Rechargez: sudo systemctl reload apache2`,
            `Ou exécutez: sudo bash ${scriptPath}`,
          ]
        : [
            `1. Copiez le fichier: sudo cp ${outputPath} ${configPath}`,
            `2. Créez le lien: sudo ln -s ${configPath} /etc/nginx/sites-enabled/${domain}.conf`,
            `3. Testez: sudo nginx -t`,
            `4. Rechargez: sudo systemctl reload nginx`,
            `Ou exécutez: sudo bash ${scriptPath}`,
          ],
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue: ' + error.message },
      { status: 500 }
    )
  }
}

function generateApacheInstallScript(domain: string, configPath: string): string {
  return `#!/bin/bash
# Script d'installation Virtual Host Apache pour ${domain}
# Exécuter avec: sudo bash install-${domain}.sh

set -e

CONFIG_FILE="${configPath}"
TARGET_FILE="/etc/apache2/sites-available/${domain}.conf"

echo "Installation de la configuration Virtual Host pour ${domain}..."

# Copier le fichier de configuration
sudo cp "$CONFIG_FILE" "$TARGET_FILE"

# Activer le site
sudo a2ensite ${domain}.conf

# Tester la configuration
echo "Test de la configuration Apache..."
if sudo apache2ctl configtest; then
    echo "Configuration valide!"
    echo "Rechargement d'Apache..."
    sudo systemctl reload apache2
    echo "Virtual Host ${domain} installé avec succès!"
    echo "Accédez à: http://${domain}"
else
    echo "ERREUR: La configuration Apache est invalide!"
    exit 1
fi
`
}

function generateNginxInstallScript(domain: string, configPath: string): string {
  return `#!/bin/bash
# Script d'installation Virtual Host Nginx pour ${domain}
# Exécuter avec: sudo bash install-${domain}.sh

set -e

CONFIG_FILE="${configPath}"
TARGET_FILE="/etc/nginx/sites-available/${domain}.conf"
ENABLED_FILE="/etc/nginx/sites-enabled/${domain}.conf"

echo "Installation de la configuration Virtual Host pour ${domain}..."

# Copier le fichier de configuration
sudo cp "$CONFIG_FILE" "$TARGET_FILE"

# Créer le lien symbolique
if [ -L "$ENABLED_FILE" ]; then
    sudo rm "$ENABLED_FILE"
fi
sudo ln -s "$TARGET_FILE" "$ENABLED_FILE"

# Tester la configuration
echo "Test de la configuration Nginx..."
if sudo nginx -t; then
    echo "Configuration valide!"
    echo "Rechargement de Nginx..."
    sudo systemctl reload nginx
    echo "Virtual Host ${domain} installé avec succès!"
    echo "Accédez à: http://${domain}"
else
    echo "ERREUR: La configuration Nginx est invalide!"
    exit 1
fi
`
}















