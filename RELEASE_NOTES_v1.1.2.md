# Release v1.1.2 - FixTector

## 🔔 Système de vérification des mises à jour

Cette version ajoute un système complet de vérification et notification des mises à jour.

## ✨ Nouvelles fonctionnalités

### 🔄 Vérification automatique des mises à jour
- **Vérification GitHub** : Vérifie automatiquement les nouvelles releases sur GitHub
- **Notification en temps réel** : Alerte visuelle quand une nouvelle version est disponible
- **Page dédiée** : Page `/updates` pour consulter les mises à jour disponibles
- **Comparaison de versions** : Compare automatiquement la version actuelle avec la dernière release

### 📱 Interface utilisateur
- **Notification sur le Dashboard** : Bannière de notification quand une mise à jour est disponible
- **Lien dans la navigation** : Accès rapide à la page des mises à jour
- **Masquage de notification** : Possibilité de masquer la notification (par version)
- **Rafraîchissement manuel** : Bouton pour vérifier les mises à jour à tout moment

### 📋 Informations affichées
- **Version actuelle** : Affiche la version installée
- **Dernière version** : Affiche la dernière version disponible sur GitHub
- **Notes de version** : Affiche les notes de la release (format Markdown)
- **Date de publication** : Affiche quand la release a été publiée
- **Lien vers GitHub** : Lien direct vers la release sur GitHub

### 🛠️ Instructions de mise à jour
- **Mise à jour automatique** : Instructions pour utiliser le script `update.sh`
- **Mise à jour manuelle** : Guide étape par étape pour mise à jour manuelle
- **Commandes utiles** : Liste des commandes PM2 et autres outils

## 🔧 Améliorations techniques

- **API `/api/updates/check`** : Endpoint pour vérifier les mises à jour
- **Gestion des erreurs** : Gestion robuste des erreurs de connexion à GitHub
- **Cache intelligent** : Vérification périodique (toutes les 5 minutes)
- **Support des tokens GitHub** : Support optionnel des tokens pour éviter les limites de rate

## 📝 Notes

- La vérification se fait automatiquement au chargement de la page
- Les notifications sont masquées par version (une notification par nouvelle version)
- Le système fonctionne avec l'API publique GitHub (pas de token requis)

## 🔗 Liens utiles

- **Releases GitHub** : https://github.com/ksiloret44-afk/fixtector/releases
- **Documentation** : Voir INSTALL.md et DEPLOY.md

---

**Version** : 1.1.2  
**Date** : Décembre 2024  
**Compatibilité** : Node.js 20.x, Next.js 14.x

