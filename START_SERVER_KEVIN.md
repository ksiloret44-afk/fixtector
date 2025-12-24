# Commandes pour démarrer le serveur (utilisateur kevin)

## 1. Aller dans le dossier de l'application
```bash
cd /home/kevin/fixtector
```

## 2. Installer les dépendances
```bash
npm install
```

## 3. Créer le fichier .env.local (si pas déjà créé)
```bash
cat > .env.local << 'EOF'
DATABASE_URL_MAIN=file:./prisma/main.db
DATABASE_URL=file:./prisma/main.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
EOF

# Générer un secret aléatoire et le mettre dans .env.local
NEXTAUTH_SECRET=$(openssl rand -base64 32)
sed -i "s/\$(openssl rand -base64 32)/$NEXTAUTH_SECRET/" .env.local
chmod 640 .env.local
```

## 4. Configurer Prisma
```bash
# Générer les clients Prisma
npx prisma generate --schema=prisma/schema-main.prisma
npx prisma generate --schema=prisma/schema-company.prisma

# Créer les bases de données
mkdir -p prisma/companies
set -a && source .env.local && set +a && npx prisma db push --schema=prisma/schema-main.prisma --accept-data-loss --skip-generate
set -a && source .env.local && set +a && export DATABASE_URL=$(grep '^DATABASE_URL=' .env.local | cut -d'=' -f2-) && npx prisma db push --schema=prisma/schema-company.prisma --accept-data-loss --skip-generate
```

## 5. Builder l'application
```bash
set -a && source .env.local && set +a && npm run build
```

## 6. Démarrer avec PM2 (recommandé)
```bash
# Créer le fichier ecosystem.config.js
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
      PORT: 3000
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

# Créer le dossier logs
mkdir -p logs

# Démarrer avec PM2
pm2 start ecosystem.config.js
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup systemd -u kevin --hp "/home/kevin" || true
```

## 7. OU démarrer directement avec npm (pour test)
```bash
set -a && source .env.local && set +a && npm start
```

## Commandes utiles PM2
```bash
# Voir les logs
pm2 logs fixtector

# Redémarrer
pm2 restart fixtector

# Arrêter
pm2 stop fixtector

# Statut
pm2 status

# Voir les logs en temps réel
pm2 logs fixtector --lines 50
```

## Vérifier que le serveur tourne
```bash
# Vérifier le port
netstat -tlnp | grep 3000

# Ou avec ss
ss -tlnp | grep 3000

# Tester avec curl
curl http://localhost:3000
```














