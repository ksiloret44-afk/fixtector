# FixTector - Solution de gestion pour réparateurs

Application SaaS complète pour la gestion d'une activité de réparation de matériel électronique et multimédia.

## Fonctionnalités

- 🔐 Authentification sécurisée avec NextAuth.js
- 👥 Gestion complète des clients
- 🔧 Gestion des réparations (suivi, statuts, notes, photos)
- 📋 Devis et factures (PDF, factures électroniques UBL 2.1)
- 📦 Gestion du stock (pièces détachées avec alertes)
- 📊 Tableau de bord avec statistiques détaillées
- 💰 Suivi financier complet
- 📅 Calendrier des rendez-vous interactif
- 📈 Rapports et statistiques avancées
- 🔔 Notifications email et SMS automatiques
- 🔒 Gestion SSL/HTTPS dans les paramètres
- 🔄 Système de vérification des mises à jour
- 👨‍💼 Gestion des collaborateurs (équipe)
- 🖼️ Logo entreprise personnalisable
- 📱 Page de suivi publique pour les clients
- 🏢 Multi-entreprises avec bases de données séparées

## Technologies

- **Next.js 14** - Framework React full-stack
- **TypeScript** - Typage statique
- **Prisma** - ORM pour la base de données
- **SQLite** - Base de données (facilement remplaçable par PostgreSQL)
- **Tailwind CSS** - Styling
- **NextAuth.js** - Authentification
- **Radix UI** - Composants UI accessibles

## Installation

### 🚀 Installation automatisée sur VPS Linux (Recommandé)

Le script d'installation automatique configure tout ce dont vous avez besoin en une seule commande.

#### Prérequis

- Serveur Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+, Rocky Linux, AlmaLinux)
- Accès root ou sudo
- Connexion Internet
- Domaine configuré (optionnel, pour SSL)

#### Installation en 3 étapes

```bash
# 1. Télécharger le script d'installation
wget https://raw.githubusercontent.com/ksiloret44-afk/fixtector/main/install.sh

# 2. Rendre le script exécutable
chmod +x install.sh

# 3. Exécuter l'installation (avec sudo)
sudo ./install.sh
```

#### Ce que fait le script

Le script `install.sh` effectue automatiquement :

1. **Détection du système** : Détecte votre distribution Linux
2. **Installation des dépendances** :
   - Node.js 20.x LTS
   - npm et Git
   - Nginx ou Apache (détection automatique)
   - PM2 (gestionnaire de processus)
3. **Configuration de l'application** :
   - Création de l'utilisateur `fixtector`
   - Installation de l'application
   - Configuration de Prisma et bases de données
   - Génération des variables d'environnement
4. **Build et démarrage** :
   - Compilation de l'application
   - Démarrage avec PM2
   - Configuration du démarrage automatique
5. **Configuration du serveur web** :
   - Détection automatique d'Apache et/ou Nginx
   - Configuration du reverse proxy
   - Support des deux serveurs en symbiose
6. **SSL/HTTPS** (si domaine fourni) :
   - Installation de Certbot
   - Génération automatique du certificat Let's Encrypt
   - Configuration HTTPS
7. **Sécurité** :
   - Configuration du firewall
   - Scripts de sauvegarde automatique

#### Pendant l'installation

Le script vous demandera :
- **Domaine** (optionnel) : Votre nom de domaine (ex: `fixtector.example.com`)
  - Laissez vide pour utiliser `localhost`
- **Email** (optionnel) : Votre email pour Let's Encrypt SSL
  - Laissez vide si vous ne voulez pas configurer SSL maintenant

#### Exemple d'utilisation

```bash
# Installation avec domaine et SSL
sudo ./install.sh
# Domaine: fixtector.example.com
# Email: admin@example.com

# Installation locale (sans domaine)
sudo ./install.sh
# Domaine: (appuyez sur Entrée)
# Email: (appuyez sur Entrée)
```

#### Après l'installation

Une fois l'installation terminée :

1. **Accéder à l'application** :
   - Avec domaine : `https://votre-domaine.com`
   - Sans domaine : `http://VOTRE_IP:3000`

2. **Créer un compte administrateur** :
   ```bash
   cd /home/fixtector/fixtector
   sudo -u fixtector npx tsx scripts/init-db.ts
   ```

3. **Vérifier le statut** :
   ```bash
   sudo -u fixtector pm2 status
   sudo /home/fixtector/fixtector/health-check.sh
   ```

#### Scripts disponibles après installation

- **`/home/fixtector/fixtector/update.sh`** : Mise à jour automatique
- **`/home/fixtector/fixtector/health-check.sh`** : Vérification de santé
- **`/home/fixtector/fixtector/backup.sh`** : Sauvegarde manuelle

#### Mise à jour

Pour mettre à jour vers une nouvelle version :

```bash
sudo /home/fixtector/fixtector/update.sh
```

**Voir `INSTALL.md` pour le guide complet et `QUICK_START.md` pour un démarrage rapide.**

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

