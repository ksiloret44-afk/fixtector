# Configuration du Webhook Stripe

## Option 1 : Stripe CLI (Recommandé pour le développement local)

### Installation de Stripe CLI

**Windows :**
1. Téléchargez Stripe CLI depuis : https://github.com/stripe/stripe-cli/releases
2. Téléchargez `stripe_X.X.X_windows_x86_64.zip`
3. Extrayez le fichier `stripe.exe`
4. Ajoutez le dossier contenant `stripe.exe` à votre PATH, ou placez-le dans un dossier accessible

**Alternative Windows (avec Scoop) :**
```powershell
scoop install stripe
```

**Mac :**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux :**
```bash
# Téléchargez et installez depuis https://github.com/stripe/stripe-cli/releases
```

### Utilisation de Stripe CLI

1. **Connectez-vous à Stripe :**
```bash
stripe login
```
Cela ouvrira votre navigateur pour vous authentifier.

2. **Redirigez les webhooks vers votre serveur local :**
```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

3. **Copiez le secret du webhook affiché :**
Le CLI affichera quelque chose comme :
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx (^C to quit)
```

4. **Utilisez ce secret dans votre configuration :**
   - Allez dans Paramètres > Stripe
   - Collez le secret dans le champ "Secret du webhook Stripe"
   - Cliquez sur "Enregistrer"

### Avantages de Stripe CLI :
- ✅ Fonctionne en local sans configuration serveur
- ✅ Teste les webhooks en temps réel
- ✅ Affiche les événements Stripe dans le terminal
- ✅ Parfait pour le développement

---

## Option 2 : Configuration via le Tableau de Bord Stripe (Production)

### Pour la production :

1. **Connectez-vous au tableau de bord Stripe :**
   - Allez sur https://dashboard.stripe.com
   - Connectez-vous à votre compte

2. **Créez un endpoint webhook :**
   - Allez dans **Développeurs > Webhooks**
   - Cliquez sur **"Ajouter un point de terminaison"** (Add endpoint)

3. **Configurez l'endpoint :**
   - **URL du point de terminaison :** 
     - Production : `https://votre-domaine.com/api/stripe/webhook`
     - Exemple : `https://fixtector.com/api/stripe/webhook`
   
   - **Description :** (optionnel) "FixTector - Gestion des abonnements"

4. **Sélectionnez les événements à écouter :**
   Cochez les événements suivants :
   - ✅ `checkout.session.completed` - Quand un paiement est complété
   - ✅ `customer.subscription.updated` - Quand un abonnement est mis à jour
   - ✅ `customer.subscription.deleted` - Quand un abonnement est annulé
   - ✅ `invoice.payment_succeeded` - Quand un paiement de facture réussit
   - ✅ `invoice.payment_failed` - Quand un paiement de facture échoue

5. **Copiez le secret de signature :**
   - Après avoir créé l'endpoint, cliquez dessus
   - Dans la section "Signing secret", cliquez sur "Révéler" ou "Reveal"
   - Copiez le secret (commence par `whsec_...`)

6. **Ajoutez le secret dans votre application :**
   - Allez dans Paramètres > Stripe
   - Collez le secret dans le champ "Secret du webhook Stripe"
   - Cliquez sur "Enregistrer"

---

## Vérification

### Tester le webhook en local :

1. Démarrez votre serveur : `npm run dev`
2. Dans un autre terminal, lancez : `stripe listen --forward-to localhost:3001/api/stripe/webhook`
3. Effectuez un paiement de test
4. Vérifiez que les événements apparaissent dans le terminal Stripe CLI

### Tester le webhook en production :

1. Dans le tableau de bord Stripe, allez dans votre endpoint webhook
2. Cliquez sur "Envoyer un événement de test" (Send test webhook)
3. Sélectionnez un événement (ex: `checkout.session.completed`)
4. Vérifiez les logs de votre serveur pour confirmer la réception

---

## Notes importantes

- 🔒 **Sécurité :** Ne partagez jamais votre secret de webhook
- 🔄 **Mode test vs Production :** Utilisez des secrets différents pour test et production
- 📝 **Logs :** Les webhooks sont loggés dans la console du serveur
- ⚠️ **Retry :** Stripe réessaie automatiquement si le webhook échoue

---

## Dépannage

### Le webhook ne fonctionne pas :

1. Vérifiez que l'URL est correcte et accessible
2. Vérifiez que le secret est correctement configuré
3. Vérifiez les logs du serveur pour les erreurs
4. Testez avec Stripe CLI en local d'abord

### Erreur "Webhook secret non configuré" :

1. Assurez-vous d'avoir configuré le secret dans Paramètres > Stripe
2. Vérifiez que le secret commence par `whsec_`
3. Vérifiez qu'il n'y a pas d'espaces avant/après le secret




