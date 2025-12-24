# Configuration Cloudflare Tunnel pour FixTector

Cloudflare Tunnel (cloudflared) permet d'exposer votre application FixTector sur Internet de manière sécurisée sans ouvrir de ports sur votre serveur.

## Installation

### Windows
```powershell
.\install-cloudflare-windows.ps1
```

### Linux
```bash
chmod +x install-cloudflare-linux.sh
./install-cloudflare-linux.sh
```

## Configuration

### 1. Créer un compte Cloudflare Zero Trust

1. Allez sur https://dash.cloudflare.com/
2. Créez un compte Cloudflare (gratuit)
3. Activez **Zero Trust** (gratuit jusqu'à 50 utilisateurs)

### 2. Créer un tunnel

1. Dans Cloudflare Dashboard, allez dans **Zero Trust** > **Networks** > **Tunnels**
2. Cliquez sur **Create a tunnel**
3. Choisissez **Cloudflared**
4. Donnez un nom à votre tunnel (ex: `fixtector`)
5. Copiez la commande d'authentification fournie

### 3. Authentifier cloudflared

Exécutez la commande copiée depuis Cloudflare Dashboard:
```bash
cloudflared tunnel login
```

Cela ouvrira votre navigateur pour autoriser l'accès.

### 4. Créer le tunnel localement

```bash
cloudflared tunnel create fixtector
```

### 5. Configurer le tunnel

Créez/modifiez le fichier de configuration:

**Windows:** `%USERPROFILE%\.cloudflared\config.yml`
**Linux:** `~/.cloudflared/config.yml`

```yaml
tunnel: fixtector
credentials-file: C:\Users\VotreNom\.cloudflared\fixtector.json  # Windows
# credentials-file: /home/votre-nom/.cloudflared/fixtector.json  # Linux

ingress:
  # Route principale vers votre application
  - hostname: votre-domaine.com
    service: http://localhost:3001
  
  # Route par défaut (404 pour les autres requêtes)
  - service: http_status:404
```

### 6. Configurer le routage dans Cloudflare

1. Dans Cloudflare Dashboard, allez dans **Zero Trust** > **Networks** > **Tunnels**
2. Cliquez sur votre tunnel `fixtector`
3. Allez dans l'onglet **Public Hostnames**
4. Cliquez sur **Add a public hostname**
5. Configurez:
   - **Subdomain:** `app` (ou laissez vide pour le domaine principal)
   - **Domain:** Votre domaine configuré dans Cloudflare
   - **Service:** `http://localhost:3001`
   - **Path:** (laissez vide)
6. Cliquez sur **Save hostname**

### 7. Démarrer le tunnel

#### Mode manuel
```bash
cloudflared tunnel run fixtector
```

#### Mode service (Linux - démarrage automatique)

Créez le fichier `/etc/systemd/system/cloudflared.service`:

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=votre-utilisateur
ExecStart=/usr/local/bin/cloudflared tunnel run fixtector
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Activez et démarrez le service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

#### Mode service (Windows)

Créez un fichier `cloudflared-service.xml` dans le répertoire d'installation:

```xml
<service>
  <id>cloudflared</id>
  <name>Cloudflare Tunnel</name>
  <description>Cloudflare Tunnel pour FixTector</description>
  <executable>C:\Program Files\cloudflared\cloudflared.exe</executable>
  <arguments>tunnel run fixtector</arguments>
  <logmode>rotate</logmode>
</service>
```

Installez avec NSSM (Non-Sucking Service Manager):
```powershell
# Télécharger NSSM depuis https://nssm.cc/download
nssm install cloudflared "C:\Program Files\cloudflared\cloudflared.exe" "tunnel run fixtector"
nssm start cloudflared
```

## Vérification

1. Vérifiez que le tunnel est actif dans Cloudflare Dashboard
2. Accédez à votre domaine configuré (ex: `https://votre-domaine.com`)
3. Votre application FixTector devrait être accessible

## Avantages de Cloudflare Tunnel

- ✅ **Sécurité:** Pas besoin d'ouvrir de ports sur votre serveur
- ✅ **HTTPS automatique:** Certificats SSL gratuits
- ✅ **Protection DDoS:** Protection intégrée Cloudflare
- ✅ **CDN:** Mise en cache pour améliorer les performances
- ✅ **Gratuit:** Plan gratuit jusqu'à 50 utilisateurs

## Dépannage

### Le tunnel ne démarre pas
```bash
# Vérifier les logs
cloudflared tunnel info fixtector

# Vérifier la configuration
cloudflared tunnel route dns list
```

### Erreur d'authentification
```bash
# Ré-authentifier
cloudflared tunnel login
```

### Le domaine ne fonctionne pas
1. Vérifiez que le domaine est bien configuré dans Cloudflare DNS
2. Vérifiez que les serveurs de noms sont bien configurés chez votre registrar
3. Attendez la propagation DNS (peut prendre jusqu'à 24h)

## Documentation

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Zero Trust](https://www.cloudflare.com/products/zero-trust/)












