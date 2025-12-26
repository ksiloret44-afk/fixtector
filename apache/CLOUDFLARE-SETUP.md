# Configuration Cloudflare avec Apache

## 🌐 Vue d'ensemble

Cloudflare Tunnel permet d'exposer votre serveur Apache sans ouvrir de ports sur votre firewall. C'est plus sécurisé et plus simple que de configurer un port forwarding.

```
Internet → Cloudflare → Cloudflare Tunnel → Apache → Node.js
```

## 📋 Prérequis

1. Un compte Cloudflare (gratuit)
2. Un domaine configuré dans Cloudflare
3. Apache installé et configuré
4. Node.js/Next.js fonctionnel sur le port 3001

## 🔧 Installation Cloudflare Tunnel (cloudflared)

### Windows

1. **Télécharger cloudflared**
   ```powershell
   # Via winget (Windows 10/11)
   winget install --id Cloudflare.cloudflared
   
   # Ou télécharger manuellement
   # https://github.com/cloudflare/cloudflared/releases
   ```

2. **Vérifier l'installation**
   ```powershell
   cloudflared --version
   ```

## 🚀 Configuration Cloudflare Tunnel

### Étape 1: Authentification Cloudflare

```powershell
cloudflared tunnel login
```

Cela ouvrira votre navigateur pour vous connecter à Cloudflare et autoriser le tunnel.

### Étape 2: Créer un tunnel

```powershell
cloudflared tunnel create fixtector
```

Notez le **Tunnel ID** qui sera affiché (ex: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

### Étape 3: Créer le fichier de configuration

Créez le fichier: `C:\Users\%USERNAME%\.cloudflared\config.yml`

```yaml
tunnel: a1b2c3d4-e5f6-7890-abcd-ef1234567890  # Remplacez par votre Tunnel ID
credentials-file: C:\Users\%USERNAME%\.cloudflared\a1b2c3d4-e5f6-7890-abcd-ef1234567890.json

ingress:
  # Règle 1: Trafic HTTPS vers Apache
  - hostname: example.com
    service: http://localhost:80
  
  # Règle 2: Trafic HTTPS www vers Apache
  - hostname: www.example.com
    service: http://localhost:80
  
  # Règle 3: Catch-all (optionnel, pour développement)
  - service: http_status:404
```

**Remplacez:**
- `a1b2c3d4-e5f6-7890-abcd-ef1234567890` par votre Tunnel ID
- `example.com` par votre domaine réel
- `%USERNAME%` par votre nom d'utilisateur Windows

### Étape 4: Route DNS dans Cloudflare

1. Allez sur https://dash.cloudflare.com
2. Sélectionnez votre domaine
3. Allez dans **DNS** > **Records**
4. Créez un enregistrement CNAME :
   - **Type**: CNAME
   - **Name**: @ (ou www pour sous-domaine)
   - **Target**: `a1b2c3d4-e5f6-7890-abcd-ef1234567890.cfargotunnel.com`
   - **Proxy**: ✅ Proxied (orange cloud)
   - **TTL**: Auto

### Étape 5: Démarrer le tunnel

```powershell
cloudflared tunnel run fixtector
```

Pour le démarrer en arrière-plan (service Windows), voir ci-dessous.

## 🔄 Configuration comme service Windows

### Créer le service

```powershell
# Créer le service cloudflared
cloudflared service install

# Démarrer le service
Start-Service cloudflared

# Vérifier le statut
Get-Service cloudflared
```

Le service utilisera automatiquement le fichier `config.yml` dans `C:\Users\%USERNAME%\.cloudflared\`.

## 🔒 Configuration SSL dans Cloudflare

### Option 1: SSL Full (Recommandé)

1. Allez dans **SSL/TLS** > **Overview**
2. Sélectionnez **Full** (pas "Full Strict" car certificat auto-signé)
3. Cloudflare chiffrera le trafic entre Cloudflare et votre serveur

### Option 2: SSL Full Strict (Production)

Pour utiliser "Full Strict", vous devez installer un certificat SSL valide sur Apache (Let's Encrypt recommandé).

## 📝 Configuration Apache pour Cloudflare

### Ajouter les headers Cloudflare

Ajoutez dans votre configuration vhost Apache (`apache/vhost-example.com.conf`) :

```apache
# Headers Cloudflare (pour obtenir la vraie IP du client)
LoadModule remoteip_module modules/mod_remoteip.so

<IfModule mod_remoteip.c>
    RemoteIPHeader CF-Connecting-IP
    RemoteIPTrustedProxy 173.245.48.0/20
    RemoteIPTrustedProxy 103.21.244.0/22
    RemoteIPTrustedProxy 103.22.200.0/22
    RemoteIPTrustedProxy 103.31.4.0/22
    RemoteIPTrustedProxy 141.101.64.0/18
    RemoteIPTrustedProxy 108.162.192.0/18
    RemoteIPTrustedProxy 190.93.240.0/20
    RemoteIPTrustedProxy 188.114.96.0/20
    RemoteIPTrustedProxy 197.234.240.0/22
    RemoteIPTrustedProxy 198.41.128.0/17
    RemoteIPTrustedProxy 162.158.0.0/15
    RemoteIPTrustedProxy 104.16.0.0/13
    RemoteIPTrustedProxy 104.24.0.0/14
    RemoteIPTrustedProxy 172.64.0.0/13
    RemoteIPTrustedProxy 131.0.72.0/22
</IfModule>

# Utiliser la vraie IP dans les logs
LogFormat "%{CF-Connecting-IP}i %h %l %u %t \"%r\" %>s %O \"%{Referer}i\" \"%{User-Agent}i\"" cloudflare
CustomLog "logs/example.com-access.log" cloudflare
```

## 🧪 Test de la configuration

1. **Vérifier le tunnel**
   ```powershell
   cloudflared tunnel info fixtector
   ```

2. **Tester l'accès**
   - Ouvrez https://example.com dans votre navigateur
   - Vous devriez voir votre application Next.js

3. **Vérifier les logs**
   ```powershell
   # Logs Cloudflare Tunnel
   Get-Content C:\Users\%USERNAME%\.cloudflared\cloudflared.log
   
   # Logs Apache
   Get-Content C:\Apache24\logs\example.com-access.log -Tail 50
   ```

## 🛠️ Dépannage

### Le tunnel ne démarre pas

1. Vérifiez que vous êtes connecté:
   ```powershell
   cloudflared tunnel list
   ```

2. Vérifiez le fichier de configuration:
   ```powershell
   cloudflared tunnel --config C:\Users\%USERNAME%\.cloudflared\config.yml ingress validate
   ```

### Le domaine ne fonctionne pas

1. Vérifiez le DNS dans Cloudflare (doit pointer vers le tunnel)
2. Attendez quelques minutes pour la propagation DNS
3. Vérifiez que le tunnel est actif:
   ```powershell
   cloudflared tunnel info fixtector
   ```

### Erreur 502 Bad Gateway

1. Vérifiez qu'Apache fonctionne sur le port 80:
   ```powershell
   netstat -an | findstr :80
   ```

2. Vérifiez qu'Apache peut accéder à Node.js sur le port 3001:
   ```powershell
   netstat -an | findstr :3001
   ```

3. Testez Apache directement:
   ```powershell
   curl http://localhost
   ```

## 📚 Ressources

- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Documentation Apache: https://httpd.apache.org/docs/
- Certbot (Let's Encrypt): https://certbot.eff.org/














