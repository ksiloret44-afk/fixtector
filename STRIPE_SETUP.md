# Configuration Stripe pour FixTector

Ce guide explique comment configurer Stripe pour permettre aux utilisateurs de passer de l'essai gratuit à un compte actif avec un abonnement mensuel à 19,99€.

## Prérequis

1. Un compte Stripe (créer sur https://stripe.com)
2. Les clés API Stripe (disponibles dans le tableau de bord Stripe)

## Configuration

### 1. Variables d'environnement

Ajoutez les variables suivantes dans votre fichier `.env.local` :

```env
# Clé secrète Stripe (commence par sk_)
STRIPE_SECRET_KEY=sk_test_...

# Secret du webhook Stripe (commence par whsec_)
STRIPE_WEBHOOK_SECRET=whsec_...

# URL de base de votre application (pour les redirections)
NEXTAUTH_URL=http://localhost:3001
# ou en production :
# NEXTAUTH_URL=https://votre-domaine.com
```

### 2. Installation de Stripe

Stripe est déjà ajouté dans `package.json`. Pour installer :

```bash
npm install
```

### 3. Configuration du webhook Stripe

1. Connectez-vous à votre tableau de bord Stripe
2. Allez dans **Développeurs > Webhooks**
3. Cliquez sur **Ajouter un point de terminaison**
4. Entrez l'URL de votre webhook :
   - En développement : `http://localhost:3001/api/stripe/webhook` (utilisez Stripe CLI)
   - En production : `https://votre-domaine.com/api/stripe/webhook`
5. Sélectionnez les événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Copiez le **Secret de signature** et ajoutez-le à `.env.local` comme `STRIPE_WEBHOOK_SECRET`

### 4. Test en développement local

Pour tester les webhooks en local, utilisez Stripe CLI :

```bash
# Installer Stripe CLI
# Windows: télécharger depuis https://stripe.com/docs/stripe-cli
# Mac: brew install stripe/stripe-cli/stripe
# Linux: voir documentation Stripe

# Se connecter
stripe login

# Rediriger les webhooks vers votre serveur local
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

Le CLI affichera un secret de webhook (commence par `whsec_`). Utilisez ce secret dans votre `.env.local` pour les tests.

## Utilisation

### Page de paiement

Les utilisateurs peuvent accéder à la page de paiement via :
- `/subscribe` - Page principale avec le forfait à 19,99€/mois

### Flux de paiement

1. L'utilisateur clique sur "Payer 19,99€ / mois"
2. Il est redirigé vers Stripe Checkout
3. Après paiement réussi, il est redirigé vers `/subscribe/success`
4. Le webhook Stripe met à jour automatiquement l'abonnement dans la base de données
5. L'essai est marqué comme converti
6. L'utilisateur a maintenant un compte actif

### Gestion des abonnements

Les abonnements sont gérés automatiquement via les webhooks Stripe :
- **Création** : Lors du paiement réussi
- **Mise à jour** : Lors de changements (renouvellement, annulation, etc.)
- **Annulation** : Lorsque l'utilisateur annule son abonnement
- **Échec de paiement** : Suivi des tentatives de paiement échouées

## Structure des fichiers

- `app/subscribe/page.tsx` - Page de paiement
- `app/subscribe/success/page.tsx` - Page de succès après paiement
- `app/api/stripe/create-checkout-session/route.ts` - Création de la session Stripe Checkout
- `app/api/stripe/webhook/route.ts` - Webhook pour gérer les événements Stripe
- `app/api/stripe/verify-session/route.ts` - Vérification de la session de paiement

## Modèle de données

L'abonnement est stocké dans la table `Subscription` avec :
- `status` : active, cancelled, past_due, trialing
- `plan` : standard (pour le moment)
- `stripeCustomerId` : ID du client Stripe
- `stripeSubscriptionId` : ID de l'abonnement Stripe
- `currentPeriodStart` / `currentPeriodEnd` : Période actuelle
- `lastPaymentStatus` : Statut du dernier paiement

L'essai est marqué comme converti dans la table `Trial` :
- `convertedToSubscription` : true
- `convertedAt` : Date de conversion
- `isActive` : false

## Notes importantes

- Le prix est fixé à **19,99€/mois** (1999 centimes)
- L'abonnement est mensuel (recurring)
- Les données de l'utilisateur sont conservées lors du passage à l'abonnement
- L'essai est automatiquement désactivé lors de la conversion

## Support

Pour toute question sur la configuration Stripe, consultez la documentation officielle :
https://stripe.com/docs



