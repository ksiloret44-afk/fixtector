# Emplacement des Bases de Données

## 📍 Localisation des fichiers de base de données

### Base de données principale
**Fichier :** `prisma/main.db`

Cette base de données contient :
- Les utilisateurs (User)
- Les entreprises (Company)
- Les abonnements (Subscription)
- Les essais gratuits (Trial)
- La configuration Stripe (StripeConfig)
- Les messages du chatbot (ChatbotMessage)
- Les versions de l'application (AppVersion)
- Les avis d'entreprises (CompanyReview)
- Les tokens de réinitialisation de mot de passe (PasswordResetToken)

### Bases de données des entreprises
**Dossier :** `prisma/companies/`

Chaque entreprise a sa propre base de données :
- Format : `prisma/companies/{companyId}.db`
- Exemple : `prisma/companies/cmje7m1je0000cnqb7bm9on2i.db`

Ces bases de données contiennent :
- Les clients (Customer)
- Les réparations (Repair)
- Les devis (Quote)
- Les factures (Invoice)
- Les pièces détachées (Part)
- Les rendez-vous (Appointment)
- Les avis clients (Review)
- Les photos de réparations (RepairPhoto)

## 🔒 Fichiers à NE PAS supprimer lors d'une mise à jour

Lors de la mise à jour de l'application, **NE PAS SUPPRIMER** :

1. **`.env.local`** - Contient toutes les configurations sensibles
2. **`prisma/main.db`** - Base de données principale avec tous les utilisateurs
3. **`prisma/companies/`** - Dossier contenant toutes les bases de données des entreprises
4. **`prisma/companies/*.db`** - Tous les fichiers de base de données des entreprises

## ✅ Fichiers à remplacer lors d'une mise à jour

Vous pouvez remplacer tous les autres fichiers, notamment :
- `app/` - Code de l'application
- `components/` - Composants React
- `lib/` - Bibliothèques et utilitaires
- `public/` - Fichiers statiques (sauf les logos uploadés)
- `prisma/schema-*.prisma` - Schémas Prisma (mais ne pas supprimer les .db)
- `package.json` et `package-lock.json`
- `node_modules/` - Peut être régénéré avec `npm install`

## 📝 Note importante

Les bases de données SQLite sont des fichiers binaires. Si vous les supprimez, **toutes les données seront perdues définitivement**.

Pour faire une sauvegarde :
```bash
# Sauvegarder la base principale
cp prisma/main.db prisma/main.db.backup

# Sauvegarder toutes les bases d'entreprises
cp -r prisma/companies prisma/companies.backup
```

Ou sur Windows PowerShell :
```powershell
# Sauvegarder la base principale
Copy-Item prisma\main.db prisma\main.db.backup

# Sauvegarder toutes les bases d'entreprises
Copy-Item -Recurse prisma\companies prisma\companies.backup
```













