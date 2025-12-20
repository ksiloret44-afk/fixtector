# Démarrage rapide - Installation sur VPS

## Installation en 3 étapes

### 1. Télécharger le script

```bash
wget https://raw.githubusercontent.com/votre-repo/fixtector/main/install.sh
chmod +x install.sh
```

### 2. Exécuter l'installation

```bash
sudo ./install.sh
```

Le script vous demandera :
- **Domaine** (optionnel) : ex. `fixtector.example.com`
- **Email** (optionnel) : pour Let's Encrypt SSL

### 3. Accéder à l'application

- **Avec domaine** : https://votre-domaine.com
- **Sans domaine** : http://VOTRE_IP:3000

## Ce qui est installé automatiquement

✅ Node.js 20.x LTS  
✅ Toutes les dépendances npm  
✅ Prisma et bases de données  
✅ PM2 (gestionnaire de processus)  
✅ Nginx (reverse proxy)  
✅ SSL/HTTPS (si domaine fourni)  
✅ Scripts de sauvegarde automatique  

## Après l'installation

1. **Créer un compte admin** :
```bash
cd /home/fixtector/fixtector
sudo -u fixtector npx tsx scripts/init-db.ts
```

2. **Configurer SMTP/SMS** (optionnel) :
Éditer `/home/fixtector/fixtector/.env.local`

3. **Vérifier que tout fonctionne** :
```bash
sudo /home/fixtector/fixtector/health-check.sh
```

## Scripts disponibles

- `install.sh` - Installation complète
- `update.sh` - Mise à jour de l'application
- `health-check.sh` - Vérification de santé
- `backup.sh` - Sauvegarde manuelle (créé automatiquement)

## Configuration minimale requise

- **CPU** : 2 cœurs
- **RAM** : 4 GB (2 GB minimum mais non recommandé)
- **Stockage** : 50 GB SSD
- **OS** : Ubuntu 20.04+, Debian 11+, CentOS 8+

## Support

Pour plus de détails, consultez :
- `INSTALL.md` - Guide d'installation détaillé
- `DEPLOY.md` - Guide de déploiement complet
- `VPS_REQUIREMENTS.md` - Spécifications système

