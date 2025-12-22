# Commandes pour démarrer le serveur

## 1. Aller dans le dossier de l'application
```bash
cd /home/fixtector/fixtector
# ou le chemin où vous avez copié les fichiers
```

## 2. Installer les dépendances
```bash
sudo -u fixtector npm install
```

## 3. Créer le fichier .env.local (si pas déjà créé)
```bash
sudo -u fixtector cat > .env.local << 'EOF'
DATABASE_URL_MAIN=file:./prisma/main.db
DATABASE_URL=file:./prisma/main.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
EOF

# Générer un secret aléatoire
NEXTAUTH_SECRET=$(openssl rand -base64 32)
sudo -u fixtector sed -i "s/\$(openssl rand -base64 32)/$NEXTAUTH_SECRET/" .env.local
sudo chmod 640 .env.local
```

## 4. Configurer Prisma
```bash
# Générer les clients Prisma
sudo -u fixtector npx prisma generate --schema=prisma/schema-main.prisma
sudo -u fixtector npx prisma generate --schema=prisma/schema-company.prisma

# Créer les bases de données
sudo -u fixtector mkdir -p prisma/companies
sudo -u fixtector bash -c "cd /home/fixtector/fixtector && set -a && source .env.local && set +a && npx prisma db push --schema=prisma/schema-main.prisma --accept-data-loss --skip-generate"
sudo -u fixtector bash -c "cd /home/fixtector/fixtector && set -a && source .env.local && set +a && export DATABASE_URL=\$(grep '^DATABASE_URL=' .env.local | cut -d'=' -f2-) && npx prisma db push --schema=prisma/schema-company.prisma --accept-data-loss --skip-generate"
```

## 5. Builder l'application
```bash
sudo -u fixtector bash -c "cd /home/fixtector/fixtector && set -a && source .env.local && set +a && npm run build"
```

## 6. Démarrer avec PM2 (recommandé)
```bash
# Créer le fichier ecosystem.config.js
sudo -u fixtector cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'fixtector',
    script: 'npm',
    args: 'start',
    cwd: '/home/fixtector/fixtector',
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
sudo -u fixtector mkdir -p logs

# Démarrer avec PM2
sudo -u fixtector pm2 start ecosystem.config.js
sudo -u fixtector pm2 save

# Configurer PM2 pour démarrer au boot
sudo -u fixtector pm2 startup systemd -u fixtector --hp "/home/fixtector" || true
```

## 7. OU démarrer directement avec npm (pour test)
```bash
sudo -u fixtector bash -c "cd /home/fixtector/fixtector && set -a && source .env.local && set +a && npm start"
```

## Commandes utiles PM2
```bash
# Voir les logs
sudo -u fixtector pm2 logs fixtector

# Redémarrer
sudo -u fixtector pm2 restart fixtector

# Arrêter
sudo -u fixtector pm2 stop fixtector

# Statut
sudo -u fixtector pm2 status

# Voir les logs en temps réel
sudo -u fixtector pm2 logs fixtector --lines 50
```

## Vérifier que le serveur tourne
```bash
# Vérifier le port
sudo netstat -tlnp | grep 3000

# Ou avec ss
sudo ss -tlnp | grep 3000

# Tester avec curl
curl http://localhost:3000
```

