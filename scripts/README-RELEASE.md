# Guide de création de release GitHub

## 📋 Prérequis

1. **Token GitHub** avec les permissions `repo` (pour créer des releases et uploader des fichiers)
2. **Git** installé et configuré
3. **Node.js** et **npm** installés
4. Le repository doit être à jour avec GitHub

## 🚀 Utilisation

### Méthode 1: Avec variable d'environnement

```powershell
# Définir le token GitHub
$env:GITHUB_TOKEN = "votre-token-github"

# Créer la release
.\scripts\create-release.ps1 -Version "2.0.0"
```

### Méthode 2: Avec paramètre

```powershell
.\scripts\create-release.ps1 -Version "2.0.0" -GitHubToken "votre-token-github"
```

### Méthode 3: Avec notes de release personnalisées

```powershell
$notes = @"
## Nouvelle version 2.0.0

### Nouvelles fonctionnalités
- Amélioration du système de mise à jour
- Support Cloudflare Tunnel
- Thème sombre amélioré

### Corrections
- Corrections de bugs
- Améliorations de performance
"@

.\scripts\create-release.ps1 -Version "2.0.0" -ReleaseNotes $notes
```

## 📦 Ce qui est inclus dans la release

Le script inclut automatiquement :

- ✅ Application compilée (`.next`)
- ✅ Fichiers publics (`public`)
- ✅ Schémas Prisma (`prisma`)
- ✅ Scripts d'installation et de démarrage
- ✅ Configuration Apache
- ✅ Fichiers de configuration (package.json, next.config.js, etc.)
- ✅ Documentation (README.md, INSTALLATION.md, etc.)

**Exclu** :
- ❌ `node_modules` (à installer après téléchargement)
- ❌ Fichiers `.env*` (sécurité)
- ❌ Cache (`.next/cache`)
- ❌ Fichiers temporaires
- ❌ Bases de données :
  - ❌ `prisma/main.db` (base de données principale)
  - ❌ `prisma/companies/*.db` (bases de données des entreprises)

⚠️ **Important** : Les bases de données ne doivent jamais être supprimées lors d'une mise à jour car elles contiennent toutes les données de l'application (utilisateurs, entreprises, réparations, factures, etc.).

## 🔧 Options disponibles

```powershell
.\scripts\create-release.ps1 `
    -Version "2.0.0" `                    # Version de la release (requis)
    -GitHubToken "token" `                # Token GitHub (optionnel si défini dans env)
    -GitHubRepo "user/repo" `            # Repository GitHub (défaut: ksiloret44-afk/fixtector)
    -ReleaseNotes "Notes..." `            # Notes de release (optionnel)
    -Draft `                              # Créer comme brouillon
    -Prerelease                           # Marquer comme pré-release
```

## 📝 Processus automatique

Le script effectue automatiquement :

1. **Installation des dépendances** (`npm install`)
2. **Génération Prisma Client** (`npx prisma generate`)
3. **Build de l'application** (`npm run build`)
4. **Préparation des fichiers** (copie dans un répertoire temporaire)
5. **Création de l'archive ZIP**
6. **Création du tag Git** (`v2.0.0`)
7. **Envoi du tag vers GitHub**
8. **Création de la release GitHub**
9. **Upload de l'archive ZIP**

## 🎯 Exemple complet

```powershell
# 1. Définir le token
$env:GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxx"

# 2. Créer la release
.\scripts\create-release.ps1 -Version "2.0.0" -ReleaseNotes "Release majeure 2.0.0"

# 3. Vérifier sur GitHub
# La release sera disponible sur: https://github.com/ksiloret44-afk/fixtector/releases/tag/v2.0.0
```

## ⚠️ Notes importantes

1. **Version** : Utilisez le format semver (ex: `2.0.0`, `2.0.1`, `2.1.0`)
2. **Tag** : Le tag sera créé automatiquement avec le préfixe `v` (ex: `v2.0.0`)
3. **Build** : Assurez-vous que le build fonctionne avant de créer la release
4. **Commit** : Tous les changements doivent être commités avant de créer la release
5. **Token** : Le token doit avoir les permissions `repo` pour créer des releases

## 🔍 Vérification

Après la création de la release, vérifiez :

1. Le tag sur GitHub : `https://github.com/ksiloret44-afk/fixtector/tags`
2. La release : `https://github.com/ksiloret44-afk/fixtector/releases`
3. L'archive ZIP téléchargeable dans la release

## 🐛 Dépannage

### Erreur: "GITHUB_TOKEN n'est pas défini"
- Définissez le token : `$env:GITHUB_TOKEN = "votre-token"`

### Erreur: "Échec de la création de la release" (422)
- La release existe peut-être déjà. Supprimez-la sur GitHub ou utilisez une autre version.

### Erreur: "Échec du build"
- Vérifiez que toutes les dépendances sont installées
- Vérifiez qu'il n'y a pas d'erreurs TypeScript

### Le tag existe déjà
- Le script vous demandera si vous voulez le supprimer et le recréer

