# FixTector - Solution de gestion pour réparateurs

Application SaaS complète pour la gestion d'une activité de réparation de matériel électronique et multimédia.

## Fonctionnalités

- 🔐 Authentification sécurisée
- 👥 Gestion des clients
- 🔧 Gestion des réparations (suivi, statuts, notes)
- 📋 Devis et factures
- 📦 Gestion du stock (pièces détachées)
- 📊 Tableau de bord avec statistiques
- 💰 Suivi financier

## Technologies

- **Next.js 14** - Framework React full-stack
- **TypeScript** - Typage statique
- **Prisma** - ORM pour la base de données
- **SQLite** - Base de données (facilement remplaçable par PostgreSQL)
- **Tailwind CSS** - Styling
- **NextAuth.js** - Authentification
- **Radix UI** - Composants UI accessibles

## Installation

### 🚀 Installation automatique sur VPS Linux (Recommandé)

Pour une installation complète et automatique sur un serveur Linux :

```bash
# Télécharger le script d'installation
wget https://raw.githubusercontent.com/ksiloret44-afk/fixtector/main/install.sh
chmod +x install.sh
sudo ./install.sh
```

Le script installe automatiquement :
- ✅ Node.js 20.x LTS
- ✅ Toutes les dépendances système
- ✅ L'application et ses dépendances npm
- ✅ Prisma et les bases de données
- ✅ PM2 pour la gestion des processus
- ✅ Nginx ou Apache comme reverse proxy
- ✅ SSL avec Let's Encrypt (optionnel)
- ✅ Scripts de sauvegarde automatique

**Voir `INSTALL.md` pour plus de détails.**

### 💻 Installation locale (Développement)

**IMPORTANT:** Créez d'abord un fichier `.env.local` à la racine du projet avec le contenu suivant :

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="changez-moi-en-production-changez-moi-en-production"
```

Puis exécutez :

```bash
# Installer et configurer tout
npm run setup
```

**Note:** Si vous avez des problèmes de connexion, assurez-vous que le fichier `.env.local` existe et contient bien `NEXTAUTH_SECRET`.

### Installation manuelle

1. Installer les dépendances :
```bash
npm install
```

2. Configurer la base de données :
```bash
# Créer le fichier .env avec les variables suivantes :
# DATABASE_URL="file:./dev.db"
# NEXTAUTH_URL="http://localhost:3000"
# NEXTAUTH_SECRET="votre-secret-ici"

# Générer le client Prisma
npm run db:generate

# Créer la base de données
npm run db:push

# Initialiser avec un utilisateur admin (optionnel)
npm run db:init
```

3. Lancer le serveur de développement :
```bash
npm run dev
```

4. Ouvrir [http://localhost:3000](http://localhost:3000)

### Compte par défaut

Si vous avez exécuté `npm run db:init`, vous pouvez vous connecter avec :
- **Email:** admin@fixtector.com
- **Mot de passe:** admin123

⚠️ **Important:** Changez ce mot de passe après la première connexion !

## Structure du projet

```
fixtector/
├── app/              # Pages et routes Next.js
├── components/       # Composants React réutilisables
├── lib/             # Utilitaires et configurations
├── prisma/          # Schéma de base de données
└── public/          # Fichiers statiques
```

## Base de données

La base de données utilise SQLite par défaut (facile à remplacer par PostgreSQL en production).

Pour visualiser la base de données :
```bash
npm run db:studio
```

## 📚 Documentation

- **[INSTALL.md](INSTALL.md)** - Guide d'installation automatique complet
- **[DEPLOY.md](DEPLOY.md)** - Guide de déploiement détaillé
- **[QUICK_START.md](QUICK_START.md)** - Démarrage rapide
- **[VPS_REQUIREMENTS.md](VPS_REQUIREMENTS.md)** - Spécifications système requises
- **[WEB_SERVERS.md](WEB_SERVERS.md)** - Configuration Apache/Nginx

## 🚀 Déploiement

### Déploiement sur VPS (Production)

L'application est optimisée pour être déployée sur un VPS Linux. Utilisez le script d'installation automatique :

```bash
wget https://raw.githubusercontent.com/ksiloret44-afk/fixtector/main/install.sh
chmod +x install.sh
sudo ./install.sh
```

**Configuration minimale requise :**
- CPU : 2 cœurs
- RAM : 4 GB
- Stockage : 50 GB SSD
- OS : Ubuntu 20.04+, Debian 11+, CentOS 8+

Voir `VPS_REQUIREMENTS.md` pour plus de détails.

### Déploiement sur plateformes cloud

L'application peut également être déployée sur :
- **Vercel** : Déploiement automatique depuis GitHub
- **Railway** : Déploiement avec base de données PostgreSQL
- **Heroku** : Support complet avec buildpacks Node.js

Pour la production, pensez à :
- Changer `DATABASE_URL` pour PostgreSQL (si nécessaire)
- Configurer `NEXTAUTH_SECRET` avec une valeur sécurisée
- Configurer `NEXTAUTH_URL` avec votre domaine

