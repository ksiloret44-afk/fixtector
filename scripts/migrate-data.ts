import { PrismaClient as OldPrismaClient } from '@prisma/client'
import { PrismaClient as MainPrismaClient } from '../node_modules/.prisma/client-main'
import { PrismaClient as CompanyPrismaClient } from '../node_modules/.prisma/client-company'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

// Charger les variables d'environnement depuis .env.local
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
} catch (error) {
  console.error('Erreur lors du chargement de .env.local:', error)
}

// Ancienne base (test.db)
const oldPrisma = new OldPrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./prisma/test.db',
    },
  },
})

// Nouvelle base principale
const mainPrisma = new MainPrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_MAIN || 'file:./prisma/main.db',
    },
  },
})

const COMPANIES_DB_DIR = path.join(process.cwd(), 'prisma', 'companies')

function getCompanyDbPath(companyId: string): string {
  if (!fs.existsSync(COMPANIES_DB_DIR)) {
    fs.mkdirSync(COMPANIES_DB_DIR, { recursive: true })
  }
  return path.join(COMPANIES_DB_DIR, `${companyId}.db`)
}

function getCompanyPrisma(companyId: string): CompanyPrismaClient {
  const dbPath = getCompanyDbPath(companyId)
  const dbUrl = `file:${dbPath}`
  
  return new CompanyPrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  })
}

async function initCompanyDatabase(companyId: string): Promise<void> {
  const dbPath = getCompanyDbPath(companyId)
  
  if (!fs.existsSync(dbPath)) {
    const dbUrl = `file:${dbPath}`
    try {
      process.env.DATABASE_URL = dbUrl
      execSync(`npx prisma db push --schema=prisma/schema-company.prisma`, {
        cwd: process.cwd(),
        stdio: 'inherit',
      })
      console.log(`✅ Base de données créée pour l'entreprise ${companyId}`)
    } catch (error) {
      console.error(`❌ Erreur lors de l'initialisation de la base pour l'entreprise ${companyId}:`, error)
      throw error
    }
  }
}

async function main() {
  console.log('🔄 Migration des données de l\'ancienne base vers les bases d\'entreprise...\n')

  try {
    // Vérifier si l'ancienne base existe
    const oldDbPath = process.env.DATABASE_URL?.replace(/^file:/, '') || path.join(process.cwd(), 'prisma', 'test.db')
    if (!fs.existsSync(oldDbPath)) {
      console.log('ℹ️  L\'ancienne base de données n\'existe pas. Rien à migrer.')
      return
    }

    // Récupérer tous les utilisateurs de la nouvelle base principale
    const users = await mainPrisma.user.findMany({
      where: {
        approved: true,
        role: { not: 'admin' },
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyId: true,
      },
    })

    if (users.length === 0) {
      console.log('ℹ️  Aucun utilisateur approuvé trouvé. Création d\'une entreprise par défaut...')
      
      // Créer une entreprise par défaut pour les données existantes
      const defaultCompany = await mainPrisma.company.create({
        data: {
          name: 'Entreprise par défaut',
          email: 'default@fixtector.com',
        },
      })

      // Créer un utilisateur par défaut si nécessaire
      const defaultUser = await mainPrisma.user.findFirst({
        where: { email: 'default@fixtector.com' },
      })

      if (!defaultUser) {
        const bcrypt = require('bcryptjs')
        const hashedPassword = await bcrypt.hash('default123', 10)
        await mainPrisma.user.create({
          data: {
            email: 'default@fixtector.com',
            name: 'Utilisateur par défaut',
            password: hashedPassword,
            role: 'user',
            approved: true,
            companyId: defaultCompany.id,
          },
        })
      }

      await initCompanyDatabase(defaultCompany.id)
      const companyPrisma = getCompanyPrisma(defaultCompany.id)

      // Migrer toutes les données vers cette entreprise
      await migrateDataToCompany(companyPrisma, null)
      
      console.log('\n✅ Migration terminée vers l\'entreprise par défaut')
      return
    }

    // Pour chaque utilisateur, migrer ses données vers sa base d'entreprise
    for (const user of users) {
      if (!user.companyId) {
        console.log(`⏭️  Utilisateur ${user.email} n'a pas d'entreprise, ignoré`)
        continue
      }

      console.log(`\n📦 Migration des données pour ${user.email}...`)
      
      // Initialiser la base de données de l'entreprise
      await initCompanyDatabase(user.companyId)
      const companyPrisma = getCompanyPrisma(user.companyId)

      // Migrer les données de cet utilisateur
      await migrateDataToCompany(companyPrisma, user.id)
    }

    console.log('\n✅ Migration terminée!')
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log('ℹ️  L\'ancienne base de données n\'existe pas ou est vide')
    } else {
      console.error('❌ Erreur:', error)
    }
  }
}

async function migrateDataToCompany(companyPrisma: CompanyPrismaClient, userId: string | null) {
  try {
    // Migrer les clients
    const oldCustomers = await oldPrisma.customer.findMany({
      where: userId ? { user: { id: userId } } : undefined,
    })

    console.log(`   📋 ${oldCustomers.length} client(s) à migrer`)
    for (const oldCustomer of oldCustomers) {
      try {
        await companyPrisma.customer.create({
          data: {
            id: oldCustomer.id,
            firstName: oldCustomer.firstName,
            lastName: oldCustomer.lastName,
            email: oldCustomer.email,
            phone: oldCustomer.phone,
            address: oldCustomer.address,
            city: oldCustomer.city,
            postalCode: oldCustomer.postalCode,
            notes: oldCustomer.notes,
            createdAt: oldCustomer.createdAt,
            updatedAt: oldCustomer.updatedAt,
          },
        })
      } catch (error: any) {
        if (error.code !== 'P2002') { // Ignorer les doublons
          console.error(`      ❌ Erreur pour le client ${oldCustomer.id}:`, error.message)
        }
      }
    }

    // Migrer les réparations
    const oldRepairs = await oldPrisma.repair.findMany({
      where: userId ? { userId } : undefined,
      include: {
        customer: true,
      },
    })

    console.log(`   🔧 ${oldRepairs.length} réparation(s) à migrer`)
    for (const oldRepair of oldRepairs) {
      try {
        // S'assurer que le client existe dans la nouvelle base
        const customer = await companyPrisma.customer.findUnique({
          where: { id: oldRepair.customerId },
        })

        if (!customer) {
          // Créer le client s'il n'existe pas
          await companyPrisma.customer.create({
            data: {
              id: oldRepair.customer.id,
              firstName: oldRepair.customer.firstName,
              lastName: oldRepair.customer.lastName,
              email: oldRepair.customer.email,
              phone: oldRepair.customer.phone,
              address: oldRepair.customer.address,
              city: oldRepair.customer.city,
              postalCode: oldRepair.customer.postalCode,
              notes: oldRepair.customer.notes,
              createdAt: oldRepair.customer.createdAt,
              updatedAt: oldRepair.customer.updatedAt,
            },
          })
        }

        await companyPrisma.repair.create({
          data: {
            id: oldRepair.id,
            ticketNumber: oldRepair.ticketNumber || oldRepair.id,
            customerId: oldRepair.customerId,
            userId: oldRepair.userId || userId || '',
            deviceType: oldRepair.deviceType,
            brand: oldRepair.brand,
            model: oldRepair.model,
            serialNumber: oldRepair.serialNumber,
            issue: oldRepair.issue,
            status: oldRepair.status,
            estimatedCost: oldRepair.estimatedCost,
            finalCost: oldRepair.finalCost,
            estimatedTime: oldRepair.estimatedTime,
            notes: oldRepair.notes,
            internalNotes: oldRepair.internalNotes,
            createdAt: oldRepair.createdAt,
            updatedAt: oldRepair.updatedAt,
            completedAt: oldRepair.completedAt,
          },
        })
      } catch (error: any) {
        if (error.code !== 'P2002') {
          console.error(`      ❌ Erreur pour la réparation ${oldRepair.id}:`, error.message)
        }
      }
    }

    // Migrer les devis
    const oldQuotes = await oldPrisma.quote.findMany({
      where: userId ? { userId } : undefined,
    })

    console.log(`   📄 ${oldQuotes.length} devis à migrer`)
    for (const oldQuote of oldQuotes) {
      try {
        await companyPrisma.quote.create({
          data: {
            id: oldQuote.id,
            quoteNumber: oldQuote.quoteNumber || oldQuote.id,
            repairId: oldQuote.repairId,
            customerId: oldQuote.customerId,
            userId: oldQuote.userId || userId || '',
            laborCost: oldQuote.laborCost,
            partsCost: oldQuote.partsCost,
            totalCost: oldQuote.totalCost,
            validUntil: oldQuote.validUntil,
            status: oldQuote.status,
            notes: oldQuote.notes,
            createdAt: oldQuote.createdAt,
            updatedAt: oldQuote.updatedAt,
          },
        })
      } catch (error: any) {
        if (error.code !== 'P2002') {
          console.error(`      ❌ Erreur pour le devis ${oldQuote.id}:`, error.message)
        }
      }
    }

    // Migrer les factures
    const oldInvoices = await oldPrisma.invoice.findMany({
      where: userId ? { userId } : undefined,
    })

    console.log(`   💰 ${oldInvoices.length} facture(s) à migrer`)
    for (const oldInvoice of oldInvoices) {
      try {
        await companyPrisma.invoice.create({
          data: {
            id: oldInvoice.id,
            invoiceNumber: oldInvoice.invoiceNumber || oldInvoice.id,
            repairId: oldInvoice.repairId,
            customerId: oldInvoice.customerId,
            userId: oldInvoice.userId || userId || '',
            laborCost: oldInvoice.laborCost,
            partsCost: oldInvoice.partsCost,
            totalCost: oldInvoice.totalCost,
            taxRate: oldInvoice.taxRate,
            taxAmount: oldInvoice.taxAmount,
            finalAmount: oldInvoice.finalAmount,
            paymentStatus: oldInvoice.paymentStatus,
            paymentMethod: oldInvoice.paymentMethod,
            paidAt: oldInvoice.paidAt,
            notes: oldInvoice.notes,
            createdAt: oldInvoice.createdAt,
            updatedAt: oldInvoice.updatedAt,
          },
        })
      } catch (error: any) {
        if (error.code !== 'P2002') {
          console.error(`      ❌ Erreur pour la facture ${oldInvoice.id}:`, error.message)
        }
      }
    }

    // Migrer les pièces
    const oldParts = await oldPrisma.part.findMany()

    console.log(`   📦 ${oldParts.length} pièce(s) à migrer`)
    for (const oldPart of oldParts) {
      try {
        await companyPrisma.part.create({
          data: {
            id: oldPart.id,
            name: oldPart.name,
            description: oldPart.description,
            brand: oldPart.brand,
            partNumber: oldPart.partNumber,
            category: oldPart.category,
            stock: oldPart.stock,
            unitPrice: oldPart.unitPrice,
            supplier: oldPart.supplier,
            createdAt: oldPart.createdAt,
            updatedAt: oldPart.updatedAt,
          },
        })
      } catch (error: any) {
        if (error.code !== 'P2002') {
          console.error(`      ❌ Erreur pour la pièce ${oldPart.id}:`, error.message)
        }
      }
    }

    // Migrer les paramètres
    const oldSettings = await oldPrisma.settings.findMany()

    console.log(`   ⚙️  ${oldSettings.length} paramètre(s) à migrer`)
    for (const oldSetting of oldSettings) {
      try {
        await companyPrisma.settings.create({
          data: {
            id: oldSetting.id,
            key: oldSetting.key,
            value: oldSetting.value,
            description: oldSetting.description,
            createdAt: oldSetting.createdAt,
            updatedAt: oldSetting.updatedAt,
          },
        })
      } catch (error: any) {
        if (error.code !== 'P2002') {
          console.error(`      ❌ Erreur pour le paramètre ${oldSetting.key}:`, error.message)
        }
      }
    }
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log('   ℹ️  L\'ancienne base de données n\'existe pas ou est vide')
    } else {
      console.error('   ❌ Erreur lors de la migration:', error.message)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await oldPrisma.$disconnect()
    await mainPrisma.$disconnect()
  })

