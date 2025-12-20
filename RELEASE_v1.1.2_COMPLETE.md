# Release v1.1.2 - FixTector

## 🔔 Système de vérification des mises à jour

Cette version ajoute un système complet de vérification et notification des mises à jour, permettant aux utilisateurs de rester informés des nouvelles versions disponibles.

## ✨ Nouvelles fonctionnalités

### 🔄 Vérification automatique des mises à jour
- **Vérification GitHub** : Vérifie automatiquement les nouvelles releases sur GitHub via l'API publique
- **Notification en temps réel** : Alerte visuelle quand une nouvelle version est disponible
- **Page dédiée** : Nouvelle page `/updates` pour consulter les mises à jour disponibles
- **Comparaison de versions** : Compare automatiquement la version actuelle (1.1.2) avec la dernière release GitHub
- **Vérification périodique** : Vérifie automatiquement toutes les 5 minutes

### 📱 Interface utilisateur
- **Notification sur le Dashboard** : Bannière de notification orange quand une mise à jour est disponible
- **Lien dans la navigation** : Nouveau lien "Mises à jour" dans le menu principal avec icône de téléchargement
- **Masquage de notification** : Possibilité de masquer la notification (stockée par version dans localStorage)
- **Rafraîchissement manuel** : Bouton pour vérifier les mises à jour à tout moment depuis la page dédiée

### 📋 Informations affichées
- **Version actuelle** : Affiche clairement la version installée (1.1.2)
- **Dernière version** : Affiche la dernière version disponible sur GitHub
- **Notes de version** : Affiche les notes de la release au format Markdown
- **Date de publication** : Affiche quand la release a été publiée
- **Lien vers GitHub** : Lien direct vers la release sur GitHub pour téléchargement

### 🛠️ Instructions de mise à jour
- **Mise à jour automatique** : Instructions détaillées pour utiliser le script `update.sh`
- **Mise à jour manuelle** : Guide étape par étape pour mise à jour manuelle
- **Commandes utiles** : Liste des commandes PM2 et autres outils nécessaires

## 🔧 Améliorations techniques

### API et Backend
- **Nouvelle API `/api/updates/check`** : Endpoint sécurisé pour vérifier les mises à jour
- **Gestion des erreurs** : Gestion robuste des erreurs de connexion à GitHub
- **Support des tokens GitHub** : Support optionnel des tokens pour éviter les limites de rate (60 requêtes/heure)
- **Comparaison de versions SemVer** : Algorithme de comparaison de versions (format X.Y.Z)

### Frontend
- **Composant UpdateNotification** : Composant réutilisable pour afficher les notifications
- **Composant UpdatesChecker** : Page complète de vérification des mises à jour
- **Intégration Dashboard** : Notification automatique sur toutes les pages du Dashboard
- **LocalStorage** : Stockage local pour masquer les notifications par version

## 📝 Notes importantes

- La vérification se fait automatiquement au chargement de la page Dashboard
- Les notifications sont masquées par version (une notification par nouvelle version)
- Le système fonctionne avec l'API publique GitHub (pas de token requis par défaut)
- Compatible avec toutes les versions précédentes

## 🔗 Liens utiles

- **Releases GitHub** : https://github.com/ksiloret44-afk/fixtector/releases
- **Documentation** : Voir INSTALL.md et DEPLOY.md
- **Script de mise à jour** : `/home/fixtector/fixtector/update.sh`

## 🚀 Installation et mise à jour

### Pour les nouvelles installations
```bash
wget https://raw.githubusercontent.com/ksiloret44-afk/fixtector/main/install.sh
chmod +x install.sh
sudo ./install.sh
```

### Pour mettre à jour depuis une version précédente
```bash
sudo /home/fixtector/fixtector/update.sh
```

### Mise à jour manuelle
1. Téléchargez la dernière release depuis GitHub
2. Arrêtez le serveur : `pm2 stop fixtector`
3. Remplacez les fichiers (sauf `.env.local` et bases de données)
4. Installez les dépendances : `npm install`
5. Rebuild : `npm run build`
6. Redémarrez : `pm2 restart fixtector`

---

**Version** : 1.1.2  
**Date** : Décembre 2024  
**Compatibilité** : Node.js 20.x, Next.js 14.x  
**Tag GitHub** : v1.1.2

