# Guide d'installation FixTector

## Problème : Repository privé (404)

Si vous obtenez une erreur 404 lors du téléchargement depuis `raw.githubusercontent.com`, c'est parce que le repository est privé.

## Solutions

### Solution 1 : Utiliser le script install-initial.sh (Recommandé)

Le script `install-initial.sh` télécharge automatiquement `install.sh` depuis GitHub, même pour les repositories privés.

```bash
# Télécharger install-initial.sh depuis la release GitHub
wget https://github.com/ksiloret44-afk/fixtector/releases/download/v1.1.5/install-initial.sh
chmod +x install-initial.sh

# Exécuter avec token GitHub (pour repository privé)
GITHUB_TOKEN=votre_token_github sudo ./install-initial.sh

# Ou passer le token en paramètre
sudo ./install-initial.sh --token votre_token_github
```

### Solution 2 : Télécharger depuis la release GitHub

Les releases GitHub sont publiques même si le repository est privé.

1. Allez sur https://github.com/ksiloret44-afk/fixtector/releases
2. Téléchargez la dernière release (fichier `.zip` ou `.tar.gz`)
3. Extrayez l'archive
4. Exécutez `sudo ./install.sh`

### Solution 3 : Cloner le repository (si vous avez accès)

```bash
# Cloner avec token GitHub
git clone https://votre_token_github@github.com/ksiloret44-afk/fixtector.git
cd fixtector
sudo ./install.sh
```

### Solution 4 : Utiliser l'API GitHub directement

```bash
# Télécharger install.sh avec token GitHub
GITHUB_TOKEN="votre_token_github"
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3.raw" \
     -o install.sh \
     "https://api.github.com/repos/ksiloret44-afk/fixtector/contents/install.sh?ref=main"

chmod +x install.sh
sudo ./install.sh
```

## Créer un token GitHub

Si vous n'avez pas de token GitHub :

1. Allez sur https://github.com/settings/tokens
2. Cliquez sur "Generate new token" → "Generate new token (classic)"
3. Donnez un nom (ex: "FixTector Installation")
4. Cochez la permission `repo` (accès complet aux repositories privés)
5. Cliquez sur "Generate token"
6. **Copiez le token immédiatement** (il ne sera plus visible après)

## Utilisation du token

### Méthode 1 : Variable d'environnement
```bash
export GITHUB_TOKEN=votre_token_github
sudo ./install-initial.sh
```

### Méthode 2 : Paramètre
```bash
sudo ./install-initial.sh --token votre_token_github
```

### Méthode 3 : Dans le script
Modifiez `install-initial.sh` et ajoutez :
```bash
GITHUB_TOKEN="votre_token_github"
```

## Installation complète

Une fois `install.sh` téléchargé :

```bash
sudo ./install.sh
```

Le script vous demandera :
- Méthode d'installation (GitHub ou fichiers locaux)
- Token GitHub (si repository privé)
- Domaine (optionnel)
- Email pour Let's Encrypt (optionnel)

## Mise à jour

Pour mettre à jour l'application :

```bash
cd /home/fixtector/fixtector
sudo ./update.sh
```

Ou avec token GitHub :
```bash
sudo ./update.sh --token votre_token_github
```

## Support

Pour plus d'informations, consultez :
- `INSTALL.md` - Guide d'installation détaillé
- `README.md` - Documentation générale
















