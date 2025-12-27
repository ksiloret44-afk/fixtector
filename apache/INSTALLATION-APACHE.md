# Installation et Configuration Apache pour FixTector

## 📋 Prérequis

- Windows 10/11 ou Windows Server
- Node.js installé et fonctionnel
- Serveur Next.js fonctionnel sur le port 3001

## 🔧 Installation Apache sur Windows

### Option 1: Installation via XAMPP (Recommandé pour débutants)

1. **Télécharger XAMPP**
   - Allez sur: https://www.apachefriends.org/
   - Téléchargez XAMPP pour Windows
   - Installez-le (par défaut: `C:\xampp`)

2. **Démarrer Apache**
   - Ouvrez le panneau de contrôle XAMPP
   - Cliquez sur "Start" pour Apache

### Option 2: Installation Apache seul

1. **Télécharger Apache**
   - Allez sur: https://www.apachelounge.com/download/
   - Téléchargez Apache 2.4 pour Windows (VC15 ou VC16)
   - Extrayez dans `C:\Apache24`

2. **Installer Apache comme service**
   ```powershell
   cd C:\Apache24\bin
   httpd.exe -k install
   ```

## ⚙️ Configuration Apache

### 1. Activer les modules nécessaires

Éditez `C:\Apache24\conf\httpd.conf` (ou `C:\xampp\apache\conf\httpd.conf` pour XAMPP) et décommentez :

```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule headers_module modules/mod_headers.so
LoadModule deflate_module modules/mod_deflate.so
LoadModule ssl_module modules/mod_ssl.so
```

### 2. Inclure la configuration FixTector

Ajoutez à la fin de `httpd.conf` :

```apache
# Configuration FixTector
Include conf/extra/fixtector.conf
```

### 3. Copier le fichier de configuration

Copiez `apache/fixtector.conf` vers :
- **Apache seul**: `C:\Apache24\conf\extra\fixtector.conf`
- **XAMPP**: `C:\xampp\apache\conf\extra\fixtector.conf`

### 4. Créer le répertoire SSL (pour HTTPS)

```powershell
mkdir C:\Apache24\conf\ssl
# ou pour XAMPP
mkdir C:\xampp\apache\conf\ssl
```

## 🔒 Configuration SSL/HTTPS (Optionnel)

### Générer un certificat auto-signé (pour développement)

```powershell
# Installer OpenSSL si nécessaire
# Via Chocolatey: choco install openssl

# Générer la clé privée
openssl genrsa -out fixtector.key 2048

# Générer le certificat
openssl req -new -x509 -key fixtector.key -out fixtector.crt -days 365 -subj "/CN=localhost"

# Copier les fichiers
copy fixtector.key C:\Apache24\conf\ssl\
copy fixtector.crt C:\Apache24\conf\ssl\
```

### Utiliser Let's Encrypt (pour production)

Utilisez Certbot pour obtenir un certificat SSL gratuit :
- https://certbot.eff.org/

## 🚀 Démarrage

### Démarrer Apache

**XAMPP:**
- Utilisez le panneau de contrôle XAMPP

**Apache seul:**
```powershell
# Démarrer Apache
C:\Apache24\bin\httpd.exe -k start

# Ou si installé comme service
net start Apache2.4
```

### Vérifier la configuration

```powershell
# Tester la configuration Apache
C:\Apache24\bin\httpd.exe -t

# Si OK, redémarrer
C:\Apache24\bin\httpd.exe -k restart
```

## 🌐 Accès

- **HTTP**: http://localhost (redirige vers Node.js sur le port 3001)
- **HTTPS**: https://localhost (si SSL configuré)

## 🔍 Vérification

1. **Vérifier qu'Apache écoute sur le port 80**
   ```powershell
   netstat -an | findstr :80
   ```

2. **Vérifier que Node.js écoute sur le port 3001**
   ```powershell
   netstat -an | findstr :3001
   ```

3. **Tester l'accès**
   - Ouvrez http://localhost dans votre navigateur
   - Vous devriez voir votre application Next.js

## 📝 Logs

Les logs Apache sont disponibles dans :
- **Erreurs**: `C:\Apache24\logs\fixtector-error.log`
- **Accès**: `C:\Apache24\logs\fixtector-access.log`

## 🛠️ Dépannage

### Port 80 déjà utilisé

Si le port 80 est déjà utilisé (par IIS par exemple) :

1. **Changer le port dans `fixtector.conf`**
   ```apache
   <VirtualHost *:8080>
   ```

2. **Ou arrêter IIS**
   ```powershell
   net stop w3svc
   ```

### Erreur "Cannot load module"

Vérifiez que les modules sont bien activés dans `httpd.conf` et que les fichiers `.so` existent dans `modules/`.

### Proxy ne fonctionne pas

1. Vérifiez que Node.js est bien démarré sur le port 3001
2. Vérifiez les logs Apache pour les erreurs
3. Testez directement Node.js: http://localhost:3001

## 📚 Ressources

- Documentation Apache: https://httpd.apache.org/docs/
- Module Proxy: https://httpd.apache.org/docs/2.4/mod/mod_proxy.html
- XAMPP: https://www.apachefriends.org/















