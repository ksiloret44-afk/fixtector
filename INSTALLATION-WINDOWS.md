# Guide d'installation FixTector v1.4.0 pour Windows

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

1. **Node.js** (version 18 ou supérieure)
   - Télécharger depuis : https://nodejs.org/
   - Vérifier l'installation : `node --version`
   - npm est inclus avec Node.js

2. **Git** (optionnel, pour cloner le dépôt)
   - Télécharger depuis : https://git-scm.com/download/win
   - Ou télécharger directement le ZIP depuis GitHub

## Méthode 1 : Installation automatique complète (Recommandé)

### Étape 1 : Télécharger le projet

**Option A - Avec Git :**
```powershell
# Cloner le dépôt
git clone https://github.com/ksiloret44-afk/fixtector.git

# Aller dans le dossier
cd fixtector

# Basculer sur la version 1.4.0
git checkout v1.4.0
```

**Option B - Sans Git (ZIP) :**
1. Allez sur : https://github.com/ksiloret44-afk/fixtector/releases/tag/v1.4.0
2. Téléchargez "Source code (zip)"
3. Extrayez le ZIP dans un dossier
4. Ouvrez PowerShell dans ce dossier

### Étape 2 : Installer les prérequis (Node.js, Git)

**Important :** Exécutez PowerShell en tant qu'administrateur (clic droit > Exécuter en tant qu'administrateur)

```powershell
# Installer automatiquement Node.js et Git
.\install-prerequisites-windows.ps1
```

Ce script va :
- ✅ Vérifier si Node.js est installé, sinon l'installer automatiquement
- ✅ Vérifier si Git est installé, sinon proposer de l'installer
- ✅ Utiliser winget si disponible, sinon télécharger depuis les sites officiels

**Note :** Si Node.js ou Git viennent d'être installés, **redémarrez PowerShell** avant de continuer.

### Étape 3 : Exécuter le script d'installation

```powershell
# Exécuter le script d'installation automatique
.\install-windows.ps1
```

Le script va automatiquement :
- ✅ Vérifier Node.js et npm
- ✅ Installer toutes les dépendances
- ✅ Générer les clients Prisma
- ✅ Initialiser les bases de données
- ✅ Créer le fichier `.env.local` avec les variables d'environnement
- ✅ Construire l'application en mode production

### Étape 3 : Configurer les variables d'environnement

Éditez le fichier `.env.local` créé et configurez :

```env
# Base de données principale (déjà configuré)
DATABASE_URL=file:./prisma/main.db
DATABASE_URL_MAIN=file:./prisma/main.db

# NextAuth (déjà généré automatiquement)
NEXTAUTH_SECRET=<généré automatiquement>
NEXTAUTH_URL=http://localhost:3001

# URL publique
NEXT_PUBLIC_BASE_URL=http://localhost:3001

# SMTP pour les emails (optionnel mais recommandé)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM=votre-email@gmail.com

# Twilio pour les SMS (optionnel)
TWILIO_ACCOUNT_SID=votre-account-sid
TWILIO_AUTH_TOKEN=votre-auth-token
TWILIO_PHONE_NUMBER=votre-numero-twilio
```

### Étape 4 : Créer le compte administrateur

```powershell
# Créer le compte admin par défaut
npm run db:init
```

### Étape 5 : Démarrer le serveur

```powershell
# Démarrer en mode production (recommandé - plus rapide)
npm start
```

Le serveur sera accessible sur : **http://localhost:3001**

---

## Méthode 2 : Installation manuelle (sans scripts automatiques)

### Étape 1 : Télécharger le ZIP

1. Allez sur : https://github.com/ksiloret44-afk/fixtector/releases/tag/v1.4.0
2. Cliquez sur **"Source code (zip)"** pour télécharger
3. Extrayez le fichier ZIP dans un dossier (ex: `C:\fixtector`)

### Étape 2 : Ouvrir PowerShell dans le dossier

1. Ouvrez PowerShell
2. Naviguez vers le dossier extrait :
   ```powershell
   cd C:\fixtector\fixtector-1.4.0
   ```

### Étape 3 : Exécuter les commandes manuellement

```powershell
# 1. Installer les dépendances
npm install

# 2. Générer les clients Prisma
npm run db:generate

# 3. Initialiser les bases de données
npm run db:push

# 4. Créer le fichier .env.local
# Copiez le contenu ci-dessous dans un nouveau fichier .env.local
```

Créez un fichier `.env.local` avec ce contenu :

```env
DATABASE_URL=file:./prisma/main.db
DATABASE_URL_MAIN=file:./prisma/main.db
NEXTAUTH_SECRET=<générez-un-secret-aleatoire>
NEXTAUTH_URL=http://localhost:3001
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

Pour générer un `NEXTAUTH_SECRET` aléatoire dans PowerShell :
```powershell
[System.Web.Security.Membership]::GeneratePassword(32, 0)
```

```powershell
# 5. Créer le compte administrateur
npm run db:init

# 6. Construire l'application en mode production
npm run build

# 7. Démarrer le serveur
npm start
```

---

## Commandes utiles

### Démarrer le serveur

```powershell
# Mode production (recommandé - plus rapide)
npm start

# Mode développement (pour le développement uniquement)
npm run dev
```

### Arrêter le serveur

Appuyez sur `Ctrl + C` dans le terminal où le serveur tourne.

### Vérifier si le serveur tourne

```powershell
# Vérifier le port 3001
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
```

### Arrêter un processus sur le port 3001

```powershell
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

### Mettre à jour l'application

```powershell
# Arrêter le serveur (Ctrl+C)
# Puis :
git pull origin main
npm install
npm run db:generate
npm run build
npm start
```

---

## Dépannage

### Erreur : "Cannot find module"

```powershell
# Réinstaller les dépendances
rm -r node_modules
npm install
```

### Erreur : "Port already in use"

```powershell
# Arrêter le processus sur le port 3001
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

### Erreur : "Could not find a production build"

```powershell
# Reconstruire l'application
npm run build
```

### Le site est lent

Assurez-vous d'utiliser le mode production :
```powershell
npm start  # Pas npm run dev
```

---

## Configuration avancée

### Changer le port

Modifiez `package.json` :
```json
{
  "scripts": {
    "start": "next start -p 3000"  // Changez 3001 en 3000
  }
}
```

Et mettez à jour `.env.local` :
```env
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Démarrer automatiquement au démarrage de Windows

Utilisez **NSSM** (Non-Sucking Service Manager) ou créez une tâche planifiée Windows.

---

## Support

En cas de problème, vérifiez :
1. ✅ Node.js est installé (`node --version`)
2. ✅ npm est installé (`npm --version`)
3. ✅ Le fichier `.env.local` existe et est correctement configuré
4. ✅ Les bases de données Prisma sont initialisées
5. ✅ Le build de production a réussi (`npm run build`)

