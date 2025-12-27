# Release 2.0.0 - Guide de déploiement

## 📦 Nouveautés

- ✅ Version majeure 2.0.0
- ✅ Scripts de démarrage (Linux et Windows)
- ✅ Script automatisé de création de release GitHub
- ✅ Système de mise à jour amélioré (détection des releases et tags)
- ✅ Support Cloudflare Tunnel intégré
- ✅ Thème sombre amélioré sur toutes les pages

## 🚀 Scripts disponibles

### Scripts de démarrage

#### Linux/Unix
```bash
./start.sh
```

#### Windows
```powershell
.\start.ps1
```

Les scripts de démarrage :
- Vérifient les prérequis (Node.js, npm)
- Installent les dépendances si nécessaire
- Génèrent Prisma Client
- Compilent l'application si nécessaire
- Démarrent l'application

### Script de création de release GitHub

```powershell
# Définir le token GitHub
$env:GITHUB_TOKEN = "votre-token-github"

# Créer la release
.\scripts\create-release.ps1 -Version "2.0.0"
```

Le script :
- Compile l'application
- Crée une archive ZIP avec tous les fichiers nécessaires
- Crée un tag Git
- Crée une release GitHub
- Upload l'archive ZIP

## 📋 Fichiers inclus dans la release

- ✅ Application compilée (`.next`)
- ✅ Fichiers publics (`public`)
- ✅ Schémas Prisma (`prisma`)
- ✅ Scripts d'installation (`install.sh`, `install-initial.sh`, `update.sh`)
- ✅ Scripts de démarrage (`start.sh`, `start.ps1`)
- ✅ Configuration Apache (`apache/`)
- ✅ Scripts utilitaires (`scripts/`)
- ✅ Documentation (README.md, INSTALLATION.md, etc.)
- ✅ Fichiers de configuration (package.json, next.config.js, etc.)

## 🔧 Installation

### Nouvelle installation

```bash
# Télécharger et exécuter le script d'installation
curl -fsSL https://raw.githubusercontent.com/ksiloret44-afk/fixtector/v2.0.0/install-initial.sh | bash
```

### Mise à jour depuis une version précédente

```bash
# Utiliser le script de mise à jour
./update.sh
```

## 📝 Notes de version

### Version 2.0.0

#### Nouvelles fonctionnalités
- Système de mise à jour amélioré avec détection automatique des releases GitHub
- Scripts de démarrage automatisés pour Linux et Windows
- Support Cloudflare Tunnel avec scripts d'installation
- Thème sombre amélioré sur toutes les pages et composants

#### Améliorations
- Optimisation du système de compilation
- Amélioration de la gestion des erreurs
- Documentation améliorée

#### Corrections
- Corrections de bugs dans le système de mise à jour
- Corrections du thème sombre sur plusieurs pages
- Corrections TypeScript

## 🔗 Liens utiles

- **Repository GitHub**: https://github.com/ksiloret44-afk/fixtector
- **Releases**: https://github.com/ksiloret44-afk/fixtector/releases
- **Documentation**: Voir `INSTALLATION.md` et `README.md`

## 📞 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.














