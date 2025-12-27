# Guide de Test Stripe - FixTector

## Prérequis

✅ Clés Stripe configurées dans Paramètres > Stripe
✅ Webhook configuré (Stripe CLI ou tableau de bord)
✅ Serveur en cours d'exécution (`npm run dev`)

---

## Test Complet du Flux de Paiement

### 1. Préparer l'environnement de test

**Assurez-vous que :**
- Votre serveur est démarré : `npm run dev`
- Si vous utilisez Stripe CLI en local, lancez-le dans un autre terminal :
  ```bash
  stripe listen --forward-to localhost:3001/api/stripe/webhook
  ```

### 2. Accéder à la page de paiement

1. Connectez-vous à votre application
2. Allez sur la page d'abonnement : `http://localhost:3001/subscribe`
   - Ou cliquez sur le bouton "Souscrire" si votre compte est bloqué

### 3. Effectuer un paiement de test

1. Cliquez sur **"Payer 19,99€ / mois"**
2. Vous serez redirigé vers Stripe Checkout

### 4. Utiliser une carte de test Stripe

Dans le formulaire de paiement Stripe, utilisez ces cartes de test :

#### ✅ Carte de test qui fonctionne (paiement réussi) :
```
Numéro de carte : 4242 4242 4242 4242
Date d'expiration : N'importe quelle date future (ex: 12/25)
CVC : N'importe quel 3 chiffres (ex: 123)
Code postal : N'importe quel code postal (ex: 75001)
```

#### ❌ Carte de test pour tester les échecs :
```
Paiement refusé : 4000 0000 0000 0002
Carte insuffisante : 4000 0000 0000 9995
Carte expirée : 4000 0000 0000 0069
```

### 5. Vérifier le résultat

**Si le paiement réussit :**
- ✅ Vous serez redirigé vers `/subscribe/success`
- ✅ Un message "Paiement réussi !" s'affichera
- ✅ Vous serez redirigé vers le tableau de bord après 3 secondes
- ✅ Votre abonnement sera actif dans la base de données

**Si le paiement échoue :**
- ❌ Un message d'erreur s'affichera
- ❌ Vous pourrez réessayer

---

## Vérifications à faire

### 1. Vérifier dans l'application

1. Allez dans **Paramètres > Abonnement** (`/subscription`)
2. Vérifiez que :
   - ✅ Statut : "Actif"
   - ✅ Plan : "Standard"
   - ✅ Prochain paiement : Date dans 1 mois
   - ✅ Historique des paiements : Le paiement apparaît

### 2. Vérifier dans Stripe Dashboard

1. Allez sur https://dashboard.stripe.com/test/payments
2. Vérifiez que :
   - ✅ Le paiement apparaît dans la liste
   - ✅ Statut : "Succeeded"
   - ✅ Montant : 19,99€

### 3. Vérifier les webhooks

**Si vous utilisez Stripe CLI :**
- Vérifiez le terminal où `stripe listen` est actif
- Vous devriez voir les événements :
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `invoice.payment_succeeded`

**Dans le tableau de bord Stripe :**
- Allez dans **Développeurs > Webhooks**
- Cliquez sur votre endpoint
- Vérifiez les **"Tentatives récentes"** (Recent attempts)
- Les événements devraient être en vert (succès)

### 4. Vérifier les logs du serveur

Dans le terminal où votre serveur tourne, vous devriez voir :
```
✓ Abonnement créé pour l'utilisateur [userId]
```

---

## Tests à effectuer

### Test 1 : Paiement réussi
- ✅ Utiliser la carte `4242 4242 4242 4242`
- ✅ Vérifier la redirection vers `/subscribe/success`
- ✅ Vérifier que l'abonnement est actif

### Test 2 : Gestion de l'abonnement
- ✅ Aller sur `/subscription`
- ✅ Vérifier les informations de l'abonnement
- ✅ Tester "Gérer la facturation" (Stripe Customer Portal)

### Test 3 : Webhook (si Stripe CLI)
- ✅ Vérifier que les événements apparaissent dans le terminal
- ✅ Vérifier que l'abonnement est créé même si le webhook est lent

### Test 4 : Paiement échoué
- ✅ Utiliser la carte `4000 0000 0000 0002`
- ✅ Vérifier le message d'erreur approprié

---

## Dépannage

### Le paiement ne fonctionne pas

1. **Vérifiez les clés Stripe :**
   - Allez dans Paramètres > Stripe
   - Vérifiez que "Activer Stripe" est coché
   - Vérifiez que les clés sont correctes (commencent par `pk_test_` et `sk_test_`)

2. **Vérifiez la console du navigateur :**
   - Ouvrez les outils de développement (F12)
   - Onglet "Console"
   - Cherchez les erreurs

3. **Vérifiez les logs du serveur :**
   - Regardez le terminal où `npm run dev` tourne
   - Cherchez les erreurs

### L'abonnement n'est pas créé après paiement

1. **Vérifiez le webhook :**
   - Si vous utilisez Stripe CLI, vérifiez qu'il tourne
   - Vérifiez que le secret webhook est correct

2. **Vérifiez la base de données :**
   - L'abonnement devrait être créé automatiquement
   - Si ce n'est pas le cas, vérifiez les logs du serveur

### Erreur "Stripe n'est pas configuré"

1. Allez dans Paramètres > Stripe
2. Cochez "Activer Stripe"
3. Vérifiez que les clés sont remplies
4. Cliquez sur "Enregistrer"
5. Rechargez la page

---

## Cartes de test Stripe complètes

| Scénario | Numéro de carte | Résultat |
|---------|----------------|----------|
| Paiement réussi | `4242 4242 4242 4242` | ✅ Succès |
| Paiement refusé | `4000 0000 0000 0002` | ❌ Refusé |
| Carte insuffisante | `4000 0000 0000 9995` | ❌ Insuffisant |
| Carte expirée | `4000 0000 0000 0069` | ❌ Expirée |
| Authentification 3D Secure requise | `4000 0025 0000 3155` | ⚠️ 3D Secure |

**Pour toutes les cartes de test :**
- Date d'expiration : N'importe quelle date future
- CVC : N'importe quel 3 chiffres
- Code postal : N'importe quel code postal

---

## Prochaines étapes

Une fois les tests réussis :

1. ✅ Votre système de paiement est opérationnel
2. ✅ Les utilisateurs peuvent s'abonner
3. ✅ Les webhooks mettent à jour automatiquement les abonnements
4. ✅ Vous pouvez passer en mode production avec les clés `live_`

---

## Support

Pour plus d'informations :
- Documentation Stripe : https://stripe.com/docs/testing
- Cartes de test : https://stripe.com/docs/testing#cards




