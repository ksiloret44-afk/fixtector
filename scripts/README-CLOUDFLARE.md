# Configuration Cloudflare Tunnel pour Windows

## 📋 Vue d'ensemble

Ce guide explique comment installer et configurer Cloudflare Tunnel sur Windows pour exposer votre application Fixtector de manière sécurisée.

## 🚀 Installation rapide

### Option 1: Script dédié Cloudflare (Recommandé)

```powershell
# Exécuter en tant qu'administrateur
.\scripts\setup-cloudflare-windows.ps1 -Domain example.com
```

Ce script automatise toutes les étapes :
1. ✅ Installation de cloudflared via winget
2. ✅ Connexion à Cloudflare
3. ✅ Création du tunnel
4. ✅ Configuration du fichier config.yml
5. ✅ Instructions DNS

### Option 2: Script VHost + Cloudflare (Apache requis)

```powershell
# Exécuter en tant qu'administrateur
.\apache\setup-vhost-cloudflare.ps1 -Domain example.com
```

Ce script configure :
- Virtual Host Apache
- Cloudflare Tunnel (avec installation automatique de cloudflared)

## 📝 Installation manuelle

Si vous préférez installer manuellement :

### Étape 1: Installer cloudflared

```powershell
winget install --id Cloudflare.cloudflared
```

### Étape 2: Se connecter à Cloudflare

```powershell
cloudflared tunnel login
```

Une fenêtre de navigateur s'ouvrira pour vous connecter.

### Étape 3: Créer le tunnel

```powershell
cloudflared tunnel create fixtector
```

Notez le **Tunnel ID** affiché.

### Étape 4: Configurer DNS dans Cloudflare Dashboard

1. Allez sur https://dash.cloudflare.com
2. Sélectionnez votre domaine
3. Allez dans **DNS** > **Records**
4. Créez un enregistrement CNAME :
   - **Type**: CNAME
   - **Name**: @ (ou www)
   - **Target**: `VOTRE_TUNNEL_ID.cfargotunnel.com`
   - **Proxy**: ✅ Proxied (orange cloud)
   - **TTL**: Auto

### Étape 5: Créer le fichier de configuration

Le fichier de configuration est créé automatiquement par les scripts dans :
`C:\Users\%USERNAME%\.cloudflared\config.yml`

Exemple de contenu :
```yaml
tunnel: a1b2c3d4-e5f6-7890-abcd-ef1234567890
credentials-file: C:\Users\VOTRE_USERNAME\.cloudflared\a1b2c3d4-e5f6-7890-abcd-ef1234567890.json

ingress:
  - hostname: example.com
    service: http://localhost:80
  - hostname: www.example.com
    service: http://localhost:80
  - service: http_status:404
```

### Étape 6: Démarrer le tunnel

```powershell
cloudflared tunnel run fixtector
```

## 🔄 Installation comme service Windows

Pour que le tunnel démarre automatiquement :

```powershell
# Installer le service
cloudflared service install

# Démarrer le service
Start-Service cloudflared

# Vérifier le statut
Get-Service cloudflared
```

## 🛠️ Commandes utiles

```powershell
# Lister les tunnels
cloudflared tunnel list

# Informations sur un tunnel
cloudflared tunnel info fixtector

# Supprimer un tunnel
cloudflared tunnel delete fixtector

# Tester la configuration
cloudflared tunnel --config C:\Users\%USERNAME%\.cloudflared\config.yml ingress validate
```

## 📚 Documentation complète

Pour plus de détails, consultez :
- `apache\CLOUDFLARE-SETUP.md` - Guide complet avec dépannage
- `apache\WINDOWS-SSL-GUIDE.md` - Guide SSL pour Windows

## ⚠️ Notes importantes

1. **Privilèges administrateur** : Les scripts doivent être exécutés en tant qu'administrateur
2. **Port local** : Par défaut, le tunnel pointe vers `localhost:80` (Apache). Modifiez si nécessaire
3. **Propagation DNS** : Attendez quelques minutes après la configuration DNS
4. **Service Windows** : Le service utilise automatiquement le fichier `config.yml` dans `%USERPROFILE%\.cloudflared\`

## 🔒 Sécurité

- Le tunnel chiffre automatiquement le trafic
- Aucun port n'a besoin d'être ouvert sur votre firewall
- Cloudflare gère le SSL/TLS automatiquement

## 🆘 Dépannage

### Le tunnel ne démarre pas

1. Vérifiez que vous êtes connecté :
   ```powershell
   cloudflared tunnel list
   ```

2. Vérifiez le fichier de configuration :
   ```powershell
   cloudflared tunnel --config C:\Users\%USERNAME%\.cloudflared\config.yml ingress validate
   ```

### Erreur 502 Bad Gateway

1. Vérifiez qu'Apache fonctionne sur le port 80 :
   ```powershell
   netstat -an | findstr :80
   ```

2. Vérifiez que Node.js fonctionne sur le port 3001 :
   ```powershell
   netstat -an | findstr :3001
   ```

### Le domaine ne fonctionne pas

1. Vérifiez le DNS dans Cloudflare Dashboard
2. Attendez la propagation DNS (quelques minutes)
3. Vérifiez que le tunnel est actif :
   ```powershell
   cloudflared tunnel info fixtector
   ```














