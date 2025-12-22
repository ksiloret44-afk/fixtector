# Installation FixTector sur Ubuntu 24.04

## Vue d'ensemble

Ce dossier contient une version complètement compatible avec Ubuntu 24.04 LTS, optimisée et testée pour ce système.

## Installation en 2 étapes

### Étape 1 : Installation système (nécessite sudo)

```bash
sudo bash install-ubuntu24.sh
```

**Ce que fait ce script :**
- Met à jour le système
- Installe Node.js 20.x (compatible Ubuntu 24.04)
- Installe npm
- Installe PM2 globalement
- Installe toutes les dépendances système (curl, wget, git, build-essential, etc.)
- Crée l'utilisateur `kevin` si nécessaire
- Crée le répertoire `/home/kevin/fixtector`

### Étape 2 : Configuration de l'application (en tant qu'utilisateur kevin)

```bash
cd /home/kevin/fixtector
bash setup-app.sh
```

**Ce que fait ce script :**
- Installe toutes les dépendances npm
- Crée le fichier `.env.local` avec les variables d'environnement
- Génère les clients Prisma (compatible Linux)
- Initialise les bases de données SQLite
- Crée l'utilisateur admin par défaut
- Build l'application Next.js
- Configure PM2
- Démarre le serveur sur le port 3001

## Installation complète (copier-coller)

```bash
# 1. Copier les fichiers dans /home/kevin/fixtector
# (depuis votre PC Windows ou via git clone)

# 2. Installation système
sudo bash /home/kevin/fixtector/install-ubuntu24.sh

# 3. Configuration application
cd /home/kevin/fixtector
bash setup-app.sh
```

## Vérification

Après l'installation, vérifiez que tout fonctionne :

```bash
# Vérifier PM2
pm2 status

# Vérifier les logs
pm2 logs fixtector --lines 30

# Tester l'application
curl http://localhost:3001

# Vérifier le port
sudo netstat -tlnp | grep 3001
```

## Gestion du serveur

```bash
# Voir les logs en temps réel
pm2 logs fixtector

# Redémarrer
pm2 restart fixtector

# Arrêter
pm2 stop fixtector

# Statut
pm2 status

# Voir l'utilisation des ressources
pm2 monit
```

## Compatibilité Ubuntu 24.04

### Versions testées et compatibles

- ✅ Ubuntu 24.04 LTS
- ✅ Node.js 20.x (recommandé)
- ✅ Node.js 18.x (compatible)
- ✅ npm 9+
- ✅ PM2 (dernière version)

### Optimisations spécifiques Ubuntu 24.04

1. **Chemins Prisma** : Utilise `process.cwd()` pour une compatibilité Linux parfaite
2. **Scripts shell** : Compatibles avec bash Ubuntu 24.04
3. **Permissions** : Gestion correcte des permissions Linux
4. **PM2** : Configuration optimale pour auto-restart et gestion des logs
5. **Dépendances** : Toutes les dépendances sont compatibles Ubuntu 24.04

## Dépannage

### Erreur "Module not found: twilio"
C'est normal et non bloquant. Twilio est optionnel pour les SMS. L'application fonctionne sans.

### Erreur "Prisma client not found"
```bash
cd /home/kevin/fixtector
set -a && source .env.local && set +a
npx prisma generate --schema=prisma/schema-main.prisma
npx prisma generate --schema=prisma/schema-company.prisma
```

### Port 3001 déjà utilisé
```bash
sudo fuser -k 3001/tcp
pm2 restart fixtector
```

### Build échoue
```bash
# Nettoyer et réessayer
rm -rf .next node_modules/.prisma
npm install
set -a && source .env.local && set +a
npm run db:generate
npm run build
```

### PM2 ne démarre pas
```bash
# Vérifier les logs
pm2 logs fixtector --lines 50

# Vérifier la configuration
cat ecosystem.config.js

# Redémarrer proprement
pm2 delete fixtector
pm2 start ecosystem.config.js
pm2 save
```

## Structure des fichiers

```
/home/kevin/fixtector/
├── install-ubuntu24.sh      # Script d'installation système (sudo)
├── setup-app.sh             # Script de configuration app (utilisateur)
├── package.json             # Dépendances npm
├── next.config.js           # Configuration Next.js (compatible Linux)
├── ecosystem.config.js       # Configuration PM2
├── .env.local               # Variables d'environnement (créé par setup-app.sh)
├── prisma/                  # Schémas Prisma
│   ├── schema-main.prisma
│   └── schema-company.prisma
├── app/                     # Application Next.js
├── lib/                     # Bibliothèques
├── components/              # Composants React
└── public/                  # Fichiers statiques
```

## Support

Pour toute question ou problème :
1. Consultez les logs : `pm2 logs fixtector --lines 50`
2. Vérifiez le statut : `pm2 status`
3. Vérifiez les variables d'environnement : `cat .env.local`
4. Vérifiez la version Node.js : `node -v`

## Notes importantes

- Le serveur écoute sur le port **3001** par défaut
- Les bases de données SQLite sont dans `prisma/`
- Les logs PM2 sont dans `logs/`
- Le fichier `.env.local` contient les secrets, ne le partagez pas !

