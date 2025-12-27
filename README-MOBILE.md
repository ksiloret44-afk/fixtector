# 📱 Guide de génération de l'APK Android pour FixTector

Ce guide vous explique comment générer une application Android (APK) qui se connecte directement à votre site FixTector.

## 📋 Prérequis

1. **Node.js** (v18 ou supérieur)
2. **npm** ou **yarn**
3. **Android Studio** (pour générer l'APK final)
   - Téléchargez depuis: https://developer.android.com/studio
   - Installez le SDK Android et les outils de build

## 🚀 Installation

### 1. Installer les dépendances

```powershell
npm install
```

### 2. Installer Capacitor (si pas déjà fait)

```powershell
npm install @capacitor/cli @capacitor/core @capacitor/android
```

## 🔧 Configuration

### 1. Configurer l'URL du serveur

Éditez `capacitor.config.ts` et modifiez l'URL du serveur :

```typescript
server: {
  url: 'https://weqeep.com', // Votre URL de production
  cleartext: false,
}
```

### 2. Créer les icônes de l'application

Créez deux fichiers d'icônes dans `public/` :
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

Vous pouvez utiliser un générateur d'icônes en ligne comme:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

## 📦 Génération de l'APK

### Méthode 1: Script automatique (recommandé)

```powershell
npm run mobile:build
```

Le script va :
1. Builder l'application Next.js en mode statique
2. Synchroniser avec Capacitor
3. Vous proposer d'ouvrir Android Studio ou de générer l'APK via Gradle

### Méthode 2: Commandes manuelles

```powershell
# 1. Builder l'application
$env:MOBILE_BUILD = "true"
npm run build

# 2. Initialiser Capacitor Android (première fois uniquement)
npm run mobile:init

# 3. Synchroniser les fichiers
npm run mobile:sync

# 4. Ouvrir Android Studio
npm run mobile:open
```

## 🏗️ Génération de l'APK dans Android Studio

1. Ouvrez le projet dans Android Studio (via `npm run mobile:open`)
2. Attendez que Gradle synchronise le projet
3. Allez dans **Build > Build Bundle(s) / APK(s) > Build APK(s)**
4. L'APK sera généré dans : `android/app/build/outputs/apk/debug/app-debug.apk`

## 🔐 Signer l'APK pour la production

Pour publier sur le Play Store, vous devez signer l'APK :

1. Créez un keystore :
```powershell
keytool -genkey -v -keystore fixtector-release.keystore -alias fixtector -keyalg RSA -keysize 2048 -validity 10000
```

2. Configurez les variables d'environnement :
```powershell
$env:ANDROID_KEYSTORE_PATH = "fixtector-release.keystore"
$env:ANDROID_KEYSTORE_PASSWORD = "votre-mot-de-passe"
$env:ANDROID_KEYSTORE_ALIAS = "fixtector"
$env:ANDROID_KEYSTORE_ALIAS_PASSWORD = "votre-mot-de-passe"
```

3. Générez l'APK signé dans Android Studio :
   - **Build > Generate Signed Bundle / APK**
   - Sélectionnez **APK**
   - Choisissez votre keystore
   - L'APK signé sera dans : `android/app/release/app-release.apk`

## 📱 Installation sur un appareil Android

### Méthode 1: Via USB (ADB)

```powershell
# Activer le mode développeur sur votre téléphone
# Activer le débogage USB
# Connecter le téléphone via USB

adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Méthode 2: Transférer le fichier APK

1. Copiez l'APK sur votre téléphone
2. Ouvrez le fichier APK
3. Autorisez l'installation depuis des sources inconnues (si nécessaire)
4. Installez l'application

## 🔄 Mise à jour de l'application

Pour mettre à jour l'application :

1. Modifiez le code de l'application web
2. Rebuild l'application :
   ```powershell
   $env:MOBILE_BUILD = "true"
   npm run build
   ```
3. Synchronisez avec Capacitor :
   ```powershell
   npm run mobile:sync
   ```
4. Régénérez l'APK dans Android Studio

## ⚙️ Configuration avancée

### Changer l'ID de l'application

Éditez `capacitor.config.ts` :
```typescript
appId: 'com.votre-domaine.app',
```

### Changer le nom de l'application

Éditez `capacitor.config.ts` :
```typescript
appName: 'Votre Nom',
```

### Personnaliser l'écran de démarrage

Les fichiers de splash screen sont dans `android/app/src/main/res/`

## 🐛 Dépannage

### Erreur: "Gradle sync failed"

- Vérifiez que Android Studio est à jour
- Vérifiez que le SDK Android est installé
- Essayez: **File > Invalidate Caches / Restart**

### L'application ne se connecte pas au serveur

- Vérifiez l'URL dans `capacitor.config.ts`
- Vérifiez que le serveur accepte les connexions HTTPS
- Pour le développement local, utilisez `http://votre-ip-local:3001` (nécessite `cleartext: true`)

### L'APK est trop volumineux

- Utilisez `npm run build` avec les optimisations activées
- Vérifiez que les images sont optimisées
- Utilisez ProGuard pour réduire la taille (dans Android Studio)

## 📚 Ressources

- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Documentation Android](https://developer.android.com/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)

## 💡 Notes importantes

⚠️ **Important**: L'application mobile se connecte directement à votre serveur web. Assurez-vous que :
- Votre serveur est accessible depuis Internet (HTTPS recommandé)
- Les API routes fonctionnent correctement
- L'authentification fonctionne avec les cookies/sessions

🔒 **Sécurité**: Pour la production, utilisez toujours HTTPS et signez votre APK avec un keystore sécurisé.

