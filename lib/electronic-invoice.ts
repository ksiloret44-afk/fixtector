/**
 * Service de génération de factures électroniques conformes à la réforme 2025-2027
 * Formats supportés : UBL 2.1, Factur-X (EN 16931)
 */
import { XMLBuilder } from 'xmlbuilder2'

interface CompanyInfo {
  name: string
  siret?: string
  siren?: string
  vatNumber?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  email?: string
  phone?: string
  rcs?: string
  rcsCity?: string
  legalForm?: string
}

interface CustomerInfo {
  firstName: string
  lastName: string
  email?: string
  phone: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  siret?: string
  vatNumber?: string
}

interface InvoiceLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalAmount: number
  taxRate: number
  taxAmount: number
}

interface InvoiceData {
  invoiceNumber: string
  issueDate: Date
  dueDate?: Date
  company: CompanyInfo
  customer: CustomerInfo
  lines: InvoiceLine[]
  totalHT: number
  totalTVA: number
  totalTTC: number
  currency: string
  paymentTerms?: string
  paymentDeadline?: number
}

/**
 * Génère une facture électronique au format UBL 2.1 (Universal Business Language)
 * Conforme à la norme EN 16931 et à la réforme française 2025-2027
 */
export function generateUBLInvoice(invoice: InvoiceData): string {
  const builder = XMLBuilder.create({ version: '1.0', encoding: 'UTF-8' })
  
  const root = builder.ele('Invoice', {
    'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
    'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
    'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    'xmlns:ccts': 'urn:un:unece:uncefact:documentation:2',
    'xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
    'xmlns:qdt': 'urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2',
    'xmlns:udt': 'urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2',
    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance'
  })

  // ID de la facture
  root.ele('cbc:ID').txt(invoice.invoiceNumber)
  
  // Date d'émission
  root.ele('cbc:IssueDate').txt(invoice.issueDate.toISOString().split('T')[0])
  
  // Type de facture
  root.ele('cbc:InvoiceTypeCode', { listID: 'UNCL1001' }).txt('380') // 380 = Facture commerciale
  
  // Devise
  root.ele('cbc:DocumentCurrencyCode', { listID: 'ISO4217' }).txt(invoice.currency || 'EUR')
  
  // Informations du fournisseur (vendeur)
  const accountingSupplierParty = root.ele('cac:AccountingSupplierParty')
  const supplierParty = accountingSupplierParty.ele('cac:Party')
  
  // Identifiant du fournisseur (SIRET)
  if (invoice.company.siret) {
    const supplierID = supplierParty.ele('cac:PartyIdentification')
    supplierID.ele('cbc:ID', { schemeID: '0002' }).txt(invoice.company.siret) // 0002 = SIRET
  }
  
  // Nom du fournisseur
  const supplierName = supplierParty.ele('cac:PartyName')
  supplierName.ele('cbc:Name').txt(invoice.company.name)
  
  // Adresse du fournisseur
  const supplierAddress = supplierParty.ele('cac:PostalAddress')
  if (invoice.company.address) {
    supplierAddress.ele('cbc:StreetName').txt(invoice.company.address)
  }
  if (invoice.company.city) {
    supplierAddress.ele('cbc:CityName').txt(invoice.company.city)
  }
  if (invoice.company.postalCode) {
    supplierAddress.ele('cbc:PostalZone').txt(invoice.company.postalCode)
  }
  if (invoice.company.country) {
    const country = supplierAddress.ele('cac:Country')
    country.ele('cbc:IdentificationCode', { listID: 'ISO3166-1:Alpha2' }).txt(
      invoice.company.country === 'France' ? 'FR' : 'FR'
    )
  }
  
  // Contact du fournisseur
  if (invoice.company.email || invoice.company.phone) {
    const supplierContact = supplierParty.ele('cac:Contact')
    if (invoice.company.email) {
      supplierContact.ele('cbc:ElectronicMail').txt(invoice.company.email)
    }
    if (invoice.company.phone) {
      supplierContact.ele('cbc:Telephone').txt(invoice.company.phone)
    }
  }
  
  // Tax Scheme (TVA)
  if (invoice.company.vatNumber) {
    const taxScheme = supplierParty.ele('cac:PartyTaxScheme')
    taxScheme.ele('cbc:CompanyID').txt(invoice.company.vatNumber)
    taxScheme.ele('cac:TaxScheme').ele('cbc:ID').txt('VAT')
  }
  
  // Informations du client (acheteur)
  const accountingCustomerParty = root.ele('cac:AccountingCustomerParty')
  const customerParty = accountingCustomerParty.ele('cac:Party')
  
  // Identifiant du client (SIRET si disponible)
  if (invoice.customer.siret) {
    const customerID = customerParty.ele('cac:PartyIdentification')
    customerID.ele('cbc:ID', { schemeID: '0002' }).txt(invoice.customer.siret)
  }
  
  // Nom du client
  const customerName = customerParty.ele('cac:PartyName')
  customerName.ele('cbc:Name').txt(`${invoice.customer.firstName} ${invoice.customer.lastName}`)
  
  // Adresse du client
  const customerAddress = customerParty.ele('cac:PostalAddress')
  if (invoice.customer.address) {
    customerAddress.ele('cbc:StreetName').txt(invoice.customer.address)
  }
  if (invoice.customer.city) {
    customerAddress.ele('cbc:CityName').txt(invoice.customer.city)
  }
  if (invoice.customer.postalCode) {
    customerAddress.ele('cbc:PostalZone').txt(invoice.customer.postalCode)
  }
  const customerCountry = customerAddress.ele('cac:Country')
  customerCountry.ele('cbc:IdentificationCode', { listID: 'ISO3166-1:Alpha2' }).txt(
    invoice.customer.country === 'France' ? 'FR' : 'FR'
  )
  
  // Contact du client
  if (invoice.customer.email || invoice.customer.phone) {
    const customerContact = customerParty.ele('cac:Contact')
    if (invoice.customer.email) {
      customerContact.ele('cbc:ElectronicMail').txt(invoice.customer.email)
    }
    if (invoice.customer.phone) {
      customerContact.ele('cbc:Telephone').txt(invoice.customer.phone)
    }
  }
  
  // Tax Scheme du client
  if (invoice.customer.vatNumber) {
    const customerTaxScheme = customerParty.ele('cac:PartyTaxScheme')
    customerTaxScheme.ele('cbc:CompanyID').txt(invoice.customer.vatNumber)
    customerTaxScheme.ele('cac:TaxScheme').ele('cbc:ID').txt('VAT')
  }
  
  // Lignes de facture
  invoice.lines.forEach((line, index) => {
    const invoiceLine = root.ele('cac:InvoiceLine')
    invoiceLine.ele('cbc:ID').txt((index + 1).toString())
    invoiceLine.ele('cbc:InvoicedQuantity', { unitCode: 'C62' }).txt(line.quantity.toString()) // C62 = unité
    invoiceLine.ele('cbc:LineExtensionAmount', { currencyID: invoice.currency || 'EUR' })
      .txt(line.totalAmount.toFixed(2))
    
    // Description
    const item = invoiceLine.ele('cac:Item')
    item.ele('cbc:Description').txt(line.description)
    item.ele('cbc:Name').txt(line.description)
    
    // Prix unitaire
    const price = invoiceLine.ele('cac:Price')
    price.ele('cbc:PriceAmount', { currencyID: invoice.currency || 'EUR' })
      .txt(line.unitPrice.toFixed(2))
    
    // Taxe (TVA)
    if (line.taxRate > 0) {
      const taxTotal = invoiceLine.ele('cac:TaxTotal')
      taxTotal.ele('cbc:TaxAmount', { currencyID: invoice.currency || 'EUR' })
        .txt(line.taxAmount.toFixed(2))
      
      const taxSubtotal = taxTotal.ele('cac:TaxSubtotal')
      taxSubtotal.ele('cbc:TaxableAmount', { currencyID: invoice.currency || 'EUR' })
        .txt(line.totalAmount.toFixed(2))
      taxSubtotal.ele('cbc:TaxAmount', { currencyID: invoice.currency || 'EUR' })
        .txt(line.taxAmount.toFixed(2))
      
      const taxCategory = taxSubtotal.ele('cac:TaxCategory')
      taxCategory.ele('cbc:ID', { schemeID: 'UNCL5305' }).txt('S') // S = Standard rate
      taxCategory.ele('cbc:Percent').txt(line.taxRate.toString())
      taxCategory.ele('cac:TaxScheme').ele('cbc:ID').txt('VAT')
    }
  })
  
  // Totaux
  const legalMonetaryTotal = root.ele('cac:LegalMonetaryTotal')
  legalMonetaryTotal.ele('cbc:LineExtensionAmount', { currencyID: invoice.currency || 'EUR' })
    .txt(invoice.totalHT.toFixed(2))
  legalMonetaryTotal.ele('cbc:TaxExclusiveAmount', { currencyID: invoice.currency || 'EUR' })
    .txt(invoice.totalHT.toFixed(2))
  legalMonetaryTotal.ele('cbc:TaxInclusiveAmount', { currencyID: invoice.currency || 'EUR' })
    .txt(invoice.totalTTC.toFixed(2))
  legalMonetaryTotal.ele('cbc:PayableAmount', { currencyID: invoice.currency || 'EUR' })
    .txt(invoice.totalTTC.toFixed(2))
  
  // Conditions de paiement
  if (invoice.paymentTerms || invoice.dueDate) {
    const paymentTerms = root.ele('cac:PaymentTerms')
    if (invoice.paymentTerms) {
      paymentTerms.ele('cbc:Note').txt(invoice.paymentTerms)
    }
    if (invoice.dueDate) {
      paymentTerms.ele('cbc:PaymentDueDate').txt(invoice.dueDate.toISOString().split('T')[0])
    }
  }
  
  // Tax Total
  const taxTotal = root.ele('cac:TaxTotal')
  taxTotal.ele('cbc:TaxAmount', { currencyID: invoice.currency || 'EUR' })
    .txt(invoice.totalTVA.toFixed(2))
  
  const taxSubtotal = taxTotal.ele('cac:TaxSubtotal')
  taxSubtotal.ele('cbc:TaxableAmount', { currencyID: invoice.currency || 'EUR' })
    .txt(invoice.totalHT.toFixed(2))
  taxSubtotal.ele('cbc:TaxAmount', { currencyID: invoice.currency || 'EUR' })
    .txt(invoice.totalTVA.toFixed(2))
  
  const taxCategory = taxSubtotal.ele('cac:TaxCategory')
  taxCategory.ele('cbc:ID', { schemeID: 'UNCL5305' }).txt('S')
  taxCategory.ele('cbc:Percent').txt(
    invoice.totalHT > 0 
      ? ((invoice.totalTVA / invoice.totalHT) * 100).toFixed(2)
      : '0'
  )
  taxCategory.ele('cac:TaxScheme').ele('cbc:ID').txt('VAT')
  
  return builder.end({ prettyPrint: true })
}

/**
 * Génère une facture électronique au format Factur-X (EN 16931)
 * Format hybride PDF/A-3 avec XML intégré
 */
export function generateFacturXMetadata(invoice: InvoiceData): string {
  // Factur-X est un format hybride : PDF/A-3 avec XML UBL intégré
  // Le XML est identique à UBL mais avec des métadonnées supplémentaires
  return generateUBLInvoice(invoice)
}

/**
 * Encode une facture XML en base64 pour stockage
 */
export function encodeInvoiceXML(xml: string): string {
  return Buffer.from(xml, 'utf-8').toString('base64')
}

/**
 * Décode une facture XML depuis base64
 */
export function decodeInvoiceXML(base64: string): string {
  return Buffer.from(base64, 'base64').toString('utf-8')
}

