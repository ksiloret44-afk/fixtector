# Guide SSL et Cloudflare pour Windows

## 🌐 Option 1 : Cloudflare Tunnel (RECOMMANDÉ pour Windows)

### Avantages
- ✅ SSL automatique (pas besoin de certificat local)
- ✅ Pas besoin d'ouvrir de ports
- ✅ Protection DDoS intégrée
- ✅ CDN et cache automatiques
- ✅ Gratuit jusqu'à 50 utilisateurs

### Installation

1. **Installer cloudflared**
   ```powershell
   winget install --id Cloudflare.cloudflared
   ```

2. **Se connecter à Cloudflare**
   ```powershell
   cloudflared tunnel login
   ```
   Cela ouvrira votre navigateur pour autoriser l'accès.

3. **Créer un tunnel**
   ```powershell
   cloudflared tunnel create fixtector
   ```
   Notez le **Tunnel ID** qui sera affiché.

4. **Configurer DNS dans Cloudflare**
   - Allez sur https://dash.cloudflare.com
   - Sélectionnez votre domaine
   - DNS > Records > Add record
   - Type: **CNAME**
   - Name: **@** (ou **www** pour sous-domaine)
   - Target: **{TUNNEL_ID}.cfargotunnel.com**
   - Proxy: ✅ **Proxied** (orange cloud)
   - TTL: **Auto**

5. **Démarrer le tunnel**
   ```powershell
   cloudflared tunnel run fixtector
   ```

6. **Configurer comme service Windows (optionnel)**
   ```powershell
   cloudflared service install
   Start-Service cloudflared
   ```

### Configuration Apache

Avec Cloudflare Tunnel, Apache écoute sur le port 80 localement. Cloudflare gère le SSL automatiquement.

Votre configuration Apache doit pointer vers `http://localhost:3001` (votre serveur Node.js).

## 🔒 Option 2 : Let's Encrypt avec Win-ACME

### Installation Win-ACME

1. **Télécharger Win-ACME**
   - Allez sur https://www.win-acme.com/
   - Téléchargez la dernière version
   - Extrayez dans un dossier (ex: `C:\win-acme`)

2. **Exécuter Win-ACME**
   ```powershell
   # Ouvrir PowerShell en tant qu'administrateur
   cd C:\win-acme
   .\wacs.exe
   ```

3. **Suivre l'assistant**
   - Choisir **N** pour créer un nouveau certificat
   - Sélectionner votre domaine
   - Choisir **2** pour Apache (si Apache est installé)
   - Win-ACME configurera automatiquement Apache

4. **Renouvellement automatique**
   Win-ACME crée automatiquement une tâche planifiée Windows pour renouveler le certificat.

### Configuration Apache avec Win-ACME

Win-ACME configure automatiquement Apache, mais vous pouvez vérifier dans :
- `C:\Apache24\conf\extra\ssl.conf` (ou votre fichier de configuration SSL)

Les certificats sont généralement dans :
- `C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\`

## 📝 Comparaison des options

| Fonctionnalité | Cloudflare Tunnel | Win-ACME |
|----------------|-------------------|----------|
| SSL automatique | ✅ Oui | ✅ Oui |
| Renouvellement | ✅ Automatique | ✅ Automatique |
| Ouverture de ports | ❌ Non requis | ✅ Oui (80, 443) |
| Protection DDoS | ✅ Oui | ❌ Non |
| CDN | ✅ Oui | ❌ Non |
| Configuration | ⭐ Simple | ⭐⭐ Moyenne |
| Coût | Gratuit | Gratuit |

## 🎯 Recommandation

**Pour Windows, utilisez Cloudflare Tunnel** car :
1. Plus simple à configurer
2. Pas besoin d'ouvrir de ports sur votre firewall
3. SSL automatique sans gestion de certificats
4. Protection DDoS et CDN inclus
5. Idéal pour les serveurs Windows

## 🔧 Configuration dans l'interface

Dans l'onglet **Virtual Host** des paramètres :
1. Activez **"Utiliser Cloudflare Tunnel"**
2. Entrez le nom du tunnel (ex: `fixtector`)
3. Suivez les instructions affichées
4. Configurez DNS dans Cloudflare Dashboard

## 📚 Ressources

- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Win-ACME: https://www.win-acme.com/
- Cloudflare Dashboard: https://dash.cloudflare.com














