# Créer la release GitHub v1.1.2

## Méthode 1 : Via l'interface GitHub (Recommandé)

1. Allez sur : **https://github.com/ksiloret44-afk/fixtector/releases/new**

2. Remplissez les champs :
   - **Choose a tag** : Sélectionnez `v1.1.2` (ou créez-le si nécessaire)
   - **Release title** : `Version 1.1.2 - Système de vérification des mises à jour`
   - **Describe this release** : Copiez le contenu du fichier `RELEASE_NOTES_v1.1.2.md`

3. Cliquez sur **"Publish release"**

## Méthode 2 : Via l'API GitHub (avec curl)

```bash
curl -X POST https://api.github.com/repos/ksiloret44-afk/fixtector/releases \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tag_name": "v1.1.2",
    "name": "Version 1.1.2 - Système de vérification des mises à jour",
    "body": "Voir RELEASE_NOTES_v1.1.2.md pour le contenu complet",
    "draft": false,
    "prerelease": false
  }'
```

## Méthode 3 : Via GitHub CLI (si installé)

```bash
gh release create v1.1.2 \
  --title "Version 1.1.2 - Système de vérification des mises à jour" \
  --notes-file RELEASE_NOTES_v1.1.2.md
```

## Vérification

Une fois la release créée, le système de vérification des mises à jour détectera automatiquement :
- Si vous êtes sur une version < 1.1.2, il affichera une notification
- La page `/updates` affichera les informations de la release

