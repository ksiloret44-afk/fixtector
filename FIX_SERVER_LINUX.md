# Commandes pour corriger le serveur Linux

## 1. Arrêter tous les processus PM2 et nettoyer
```bash
cd /home/kevin/fixtector

# Arrêter toutes les instances PM2
pm2 stop all
pm2 delete all

# Vérifier qu'il n'y a plus d'instances
pm2 list
```

## 2. Tuer les processus qui utilisent le port 3001
```bash
# Trouver le processus qui utilise le port 3001
sudo lsof -i :3001
# OU
sudo netstat -tlnp | grep 3001

# Tuer le processus (remplacer PID par le numéro trouvé ci-dessus)
sudo kill -9 PID

# OU tuer tous les processus Node.js sur le port 3001
sudo fuser -k 3001/tcp
```

## 3. Vérifier et nettoyer le dossier .next
```bash
cd /home/kevin/fixtector

# Supprimer l'ancien build (optionnel, pour un build propre)
rm -rf .next

# Vérifier que le dossier n'existe plus
ls -la | grep .next
```

## 4. Rebuild l'application
```bash
cd /home/kevin/fixtector

# Charger les variables d'environnement
set -a && source .env.local && set +a

# Générer les clients Prisma (IMPORTANT)
npx prisma generate --schema=prisma/schema-main.prisma
npx prisma generate --schema=prisma/schema-company.prisma

# Builder l'application
npm run build

# Vérifier que le build a réussi
ls -la .next
```

## 5. Redémarrer proprement avec PM2
```bash
cd /home/kevin/fixtector

# Vérifier que le fichier ecosystem.config.js existe et est correct
cat ecosystem.config.js

# Si le fichier n'existe pas ou est incorrect, le créer :
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'fixtector',
    script: 'npm',
    args: 'start',
    cwd: '/home/kevin/fixtector',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
}
EOF

# Créer le dossier logs si nécessaire
mkdir -p logs

# Démarrer avec PM2
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Vérifier le statut
pm2 status

# Vérifier les logs
pm2 logs fixtector --lines 30
```

## 6. Vérifier que tout fonctionne
```bash
# Vérifier que le port 3001 est bien utilisé par PM2
sudo netstat -tlnp | grep 3001

# Tester l'application
curl http://localhost:3001

# Voir les logs en temps réel
pm2 logs fixtector --lines 50
```

## Si le problème persiste

### Option A : Utiliser un autre port temporairement
```bash
# Modifier ecosystem.config.js pour utiliser le port 3002
sed -i 's/PORT: 3001/PORT: 3002/' ecosystem.config.js

# Redémarrer
pm2 restart fixtector
```

### Option B : Vérifier les permissions
```bash
# Vérifier les permissions du dossier
ls -la /home/kevin/fixtector

# S'assurer que l'utilisateur kevin a les droits
sudo chown -R kevin:kevin /home/kevin/fixtector
```

### Option C : Vérifier la version Node.js
```bash
node --version
npm --version

# Doit être Node.js 18+ et npm 9+
```

















