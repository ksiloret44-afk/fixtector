# Configuration des serveurs web - Apache et Nginx

Le script d'installation détecte automatiquement les serveurs web installés et permet de les configurer en symbiose sans casser les configurations existantes.

## Détection automatique

Le script détecte automatiquement :
- ✅ **Nginx** (si installé)
- ✅ **Apache** (si installé)

## Options de configuration

### 1. Nginx uniquement (recommandé)
- Utilise Nginx comme reverse proxy
- Ports 80 (HTTP) et 443 (HTTPS)
- Configuration optimale pour Next.js
- **Recommandé pour les nouvelles installations**

### 2. Apache uniquement
- Utilise Apache comme reverse proxy
- Ports 80 (HTTP) et 443 (HTTPS)
- Nginx sera arrêté pour éviter les conflits de port
- **Utile si vous avez déjà des sites sur Apache**

### 3. Les deux en symbiose
- **Nginx** : Ports 80/443 (pour FixTector)
- **Apache** : Port 8080 (pour vos autres sites)
- Les deux fonctionnent simultanément
- **Idéal si vous avez déjà des sites sur Apache et voulez ajouter FixTector**

## Comportement du script

### Si aucun serveur n'est installé
- Installation automatique de Nginx
- Configuration par défaut

### Si Nginx est déjà installé
- Utilisation de Nginx
- Sauvegarde des configurations existantes avant modification
- Ne supprime pas les autres sites configurés

### Si Apache est déjà installé
- Choix entre Apache ou Nginx
- Sauvegarde des configurations existantes
- Activation des modules nécessaires (proxy, headers, rewrite)

### Si les deux sont installés
- Menu interactif pour choisir :
  1. Nginx uniquement
  2. Apache uniquement
  3. Les deux en symbiose

## Sauvegarde des configurations

Le script sauvegarde automatiquement les configurations existantes avant toute modification :
- Format : `config.backup.YYYYMMDD_HHMMSS`
- Emplacement :
  - Nginx : `/etc/nginx/sites-available/` ou `/etc/nginx/conf.d/`
  - Apache : `/etc/apache2/sites-available/` ou `/etc/httpd/conf.d/`

## Configuration Apache + Nginx en symbiose

Quand les deux serveurs sont configurés :

### Nginx (port 80/443)
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    # ... configuration FixTector
}
```

### Apache (port 8080)
```apache
<VirtualHost *:8080>
    ServerName autre-site.com
    # ... vos autres sites
</VirtualHost>
```

## Modules Apache activés automatiquement

Le script active automatiquement les modules nécessaires :
- `proxy` : Pour le reverse proxy
- `proxy_http` : Pour le proxy HTTP
- `headers` : Pour les en-têtes HTTP
- `rewrite` : Pour les redirections

## SSL/HTTPS

### Avec Nginx
```bash
sudo certbot --nginx -d votre-domaine.com
```

### Avec Apache
```bash
sudo certbot --apache -d votre-domaine.com
```

### Avec les deux
- SSL configuré pour Nginx (port 443)
- Apache peut avoir son propre certificat si nécessaire

## Vérification

Utilisez le script de vérification de santé :
```bash
sudo /home/fixtector/fixtector/health-check.sh
```

Il vérifie :
- ✅ Statut de Nginx
- ✅ Statut d'Apache
- ✅ Configuration valide
- ✅ Services actifs

## Dépannage

### Conflit de port
Si les deux serveurs tentent d'utiliser le port 80 :
- Le script configure Apache sur le port 8080 en mode "both"
- Vérifiez avec : `sudo netstat -tuln | grep :80`

### Configuration invalide
```bash
# Nginx
sudo nginx -t

# Apache (Ubuntu/Debian)
sudo apache2ctl configtest

# Apache (CentOS/Rocky)
sudo httpd -t
```

### Redémarrer les services
```bash
# Nginx
sudo systemctl restart nginx

# Apache (Ubuntu/Debian)
sudo systemctl restart apache2

# Apache (CentOS/Rocky)
sudo systemctl restart httpd
```

## Recommandations

1. **Nouvelle installation** : Utilisez Nginx (option 1)
2. **Serveur existant avec Apache** : Utilisez les deux en symbiose (option 3)
3. **Migration depuis Apache** : Utilisez Nginx uniquement (option 1)

## Exemples de configuration

### Exemple 1 : Nginx uniquement
```
Domaine: fixtector.example.com
Serveur: Nginx
Port: 80/443
URL: https://fixtector.example.com
```

### Exemple 2 : Apache uniquement
```
Domaine: fixtector.example.com
Serveur: Apache
Port: 80/443
URL: https://fixtector.example.com
```

### Exemple 3 : Les deux en symbiose
```
FixTector:
  Domaine: fixtector.example.com
  Serveur: Nginx
  Port: 80/443
  URL: https://fixtector.example.com

Autres sites:
  Domaine: autre-site.example.com
  Serveur: Apache
  Port: 8080
  URL: http://autre-site.example.com:8080
```

