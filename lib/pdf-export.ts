/**
 * Service d'export PDF pour factures et devis
 */
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface CompanyInfo {
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  siret?: string
  siren?: string
  rcs?: string
  rcsCity?: string
  vatNumber?: string
  legalForm?: string
  capital?: string
  director?: string
  logoUrl?: string
}

interface CustomerInfo {
  firstName: string
  lastName: string
  email?: string
  phone: string
  address?: string
  city?: string
  postalCode?: string
}

interface InvoiceData {
  invoiceNumber: string
  createdAt: Date
  dueDate?: Date
  customer: CustomerInfo
  repair: {
    ticketNumber: string
    deviceType: string
    brand: string
    model: string
    issue: string
  }
  laborCost: number
  partsCost: number
  totalCost: number
  taxRate: number
  taxAmount: number
  finalAmount: number
  paymentStatus: string
  paymentTerms?: string
  paymentDeadline?: number
  latePaymentPenalty?: number
  legalMentions?: string
  warrantyInfo?: string
  notes?: string
}

interface QuoteData {
  quoteNumber: string
  createdAt: Date
  validUntil: Date
  customer: CustomerInfo
  repair: {
    ticketNumber: string
    deviceType: string
    brand: string
    model: string
    issue: string
  }
  laborCost: number
  partsCost: number
  totalCost: number
  status: string
  paymentTerms?: string
  paymentDeadline?: number
  latePaymentPenalty?: number
  warrantyInfo?: string
  notes?: string
}

/**
 * Génère un PDF de facture
 */
export async function generateInvoicePDF(
  invoice: InvoiceData,
  company: CompanyInfo,
  parts?: Array<{ name: string; quantity: number; unitPrice: number; total: number }>
): Promise<jsPDF> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = margin

  // En-tête avec logo et informations entreprise
  let logoAdded = false
  if (company.logoUrl) {
    try {
      // Charger le logo depuis le système de fichiers
      const logoPath = company.logoUrl.startsWith('/')
        ? join(process.cwd(), 'public', company.logoUrl)
        : join(process.cwd(), 'public', company.logoUrl)
      
      const logoData = await readFile(logoPath)
      const logoBase64 = logoData.toString('base64')
      const logoExtension = company.logoUrl.split('.').pop()?.toLowerCase() || 'png'
      const mimeType = logoExtension === 'svg' ? 'image/svg+xml' : 
                      logoExtension === 'jpg' || logoExtension === 'jpeg' ? 'image/jpeg' :
                      logoExtension === 'webp' ? 'image/webp' : 'image/png'
      
      // Ajouter le logo au PDF (max 50px de hauteur)
      const logoWidth = 50
      const logoHeight = 50
      doc.addImage(`data:${mimeType};base64,${logoBase64}`, logoExtension, margin, yPos, logoWidth, logoHeight)
      logoAdded = true
    } catch (err) {
      console.error('Erreur lors du chargement du logo:', err)
    }
  }

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE', pageWidth - margin - 30, yPos, { align: 'right' })
  
  yPos += logoAdded ? 55 : 10
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  if (company.name) {
    doc.text(company.name, margin, yPos)
    yPos += 6
  }
  if (company.address) {
    doc.text(company.address, margin, yPos)
    yPos += 6
  }
  if (company.postalCode && company.city) {
    doc.text(`${company.postalCode} ${company.city}`, margin, yPos)
    yPos += 6
  }
  if (company.phone) {
    doc.text(`Tél: ${company.phone}`, margin, yPos)
    yPos += 6
  }
  if (company.email) {
    doc.text(`Email: ${company.email}`, margin, yPos)
    yPos += 6
  }
  if (company.siret) {
    doc.text(`SIRET: ${company.siret}`, margin, yPos)
    yPos += 6
  }
  if (company.siren) {
    doc.text(`SIREN: ${company.siren}`, margin, yPos)
    yPos += 6
  }
  if (company.rcs) {
    const rcsText = company.rcsCity ? `RCS ${company.rcsCity} ${company.rcs}` : `RCS ${company.rcs}`
    doc.text(rcsText, margin, yPos)
    yPos += 6
  }
  if (company.vatNumber) {
    doc.text(`TVA Intracommunautaire: ${company.vatNumber}`, margin, yPos)
    yPos += 6
  }
  if (company.legalForm) {
    doc.text(`Forme juridique: ${company.legalForm}`, margin, yPos)
    yPos += 6
  }
  if (company.capital) {
    doc.text(`Capital social: ${company.capital}`, margin, yPos)
    yPos += 6
  }
  if (company.director) {
    doc.text(`Directeur: ${company.director}`, margin, yPos)
    yPos += 6
  }

  // Informations facture
  yPos = margin + 10
  doc.setFontSize(10)
  doc.text(`N° Facture: ${invoice.invoiceNumber}`, pageWidth - margin - 30, yPos, { align: 'right' })
  yPos += 6
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}`, pageWidth - margin - 30, yPos, { align: 'right' })
  yPos += 6
  const statusText = invoice.paymentStatus === 'paid' ? 'Payée' : invoice.paymentStatus === 'partial' ? 'Partiellement payée' : 'Non payée'
  doc.text(`Statut: ${statusText}`, pageWidth - margin - 30, yPos, { align: 'right' })

  // Informations client
  yPos += 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Facturé à:', margin, yPos)
  yPos += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`${invoice.customer.firstName} ${invoice.customer.lastName}`, margin, yPos)
  yPos += 6
  if (invoice.customer.address) {
    doc.text(invoice.customer.address, margin, yPos)
    yPos += 6
  }
  if (invoice.customer.postalCode && invoice.customer.city) {
    doc.text(`${invoice.customer.postalCode} ${invoice.customer.city}`, margin, yPos)
    yPos += 6
  }
  if (invoice.customer.phone) {
    doc.text(`Tél: ${invoice.customer.phone}`, margin, yPos)
    yPos += 6
  }
  if (invoice.customer.email) {
    doc.text(`Email: ${invoice.customer.email}`, margin, yPos)
  }

  // Informations réparation
  yPos += 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Réparation:', margin, yPos)
  yPos += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Ticket: ${invoice.repair.ticketNumber}`, margin, yPos)
  yPos += 6
  doc.text(`Appareil: ${invoice.repair.deviceType} - ${invoice.repair.brand} ${invoice.repair.model}`, margin, yPos)
  yPos += 6
  doc.text(`Problème: ${invoice.repair.issue.substring(0, 80)}${invoice.repair.issue.length > 80 ? '...' : ''}`, margin, yPos)

  // Tableau des prestations
  yPos += 15
  const tableData: any[] = []
  
  // Main d'œuvre
  tableData.push([
    'Main d\'œuvre',
    '1',
    `${invoice.laborCost.toFixed(2)} €`,
    `${invoice.laborCost.toFixed(2)} €`
  ])

  // Pièces détachées
  if (parts && parts.length > 0) {
    parts.forEach(part => {
      tableData.push([
        part.name,
        part.quantity.toString(),
        `${part.unitPrice.toFixed(2)} €`,
        `${part.total.toFixed(2)} €`
      ])
    })
  } else {
    tableData.push([
      'Pièces détachées',
      '-',
      '-',
      `${invoice.partsCost.toFixed(2)} €`
    ])
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qté', 'Prix unitaire', 'Total HT']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    }
  })

  const finalY = (doc as any).lastAutoTable.finalY || yPos + 30

  // Totaux
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const totalsX = pageWidth - margin - 60
  doc.text(`Total HT: ${invoice.totalCost.toFixed(2)} €`, totalsX, finalY + 10, { align: 'right' })
  doc.text(`TVA (${invoice.taxRate}%): ${invoice.taxAmount.toFixed(2)} €`, totalsX, finalY + 16, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`Total TTC: ${invoice.finalAmount.toFixed(2)} €`, totalsX, finalY + 24, { align: 'right' })

  // Notes
  let notesY = finalY + 35
  if (invoice.notes) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Notes:', margin, notesY)
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin)
    doc.text(splitNotes, margin, notesY + 7)
    notesY += splitNotes.length * 6 + 10
  }

  // Mentions légales obligatoires (UE)
  notesY += 10
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Mentions légales:', margin, notesY)
  notesY += 7
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  
  // Conditions de paiement
  if (invoice.paymentTerms) {
    doc.text(`Conditions de paiement: ${invoice.paymentTerms}`, margin, notesY)
    notesY += 6
  } else {
    const deadline = invoice.paymentDeadline || 30
    doc.text(`Paiement à réception de facture (délai: ${deadline} jours)`, margin, notesY)
    notesY += 6
  }
  
  // Date d'échéance
  if (invoice.dueDate) {
    doc.text(`Date d'échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`, margin, notesY)
    notesY += 6
  } else if (invoice.paymentDeadline) {
    const dueDate = new Date(invoice.createdAt)
    dueDate.setDate(dueDate.getDate() + invoice.paymentDeadline)
    doc.text(`Date d'échéance: ${dueDate.toLocaleDateString('fr-FR')}`, margin, notesY)
    notesY += 6
  }
  
  // Pénalités de retard
  if (invoice.latePaymentPenalty) {
    doc.text(`En cas de retard de paiement, des pénalités au taux de ${invoice.latePaymentPenalty.toFixed(2)}% seront appliquées.`, margin, notesY)
    notesY += 6
  } else {
    doc.text('En cas de retard de paiement, des pénalités au taux de 3 fois le taux d\'intérêt légal seront appliquées.', margin, notesY)
    notesY += 6
  }
  
  // Indemnité forfaitaire pour frais de recouvrement
  doc.text('Une indemnité forfaitaire pour frais de recouvrement de 40€ sera due en cas de retard de paiement.', margin, notesY)
  notesY += 6
  
  // Garantie légale de conformité (Directive 2019/771/UE)
  if (invoice.warrantyInfo) {
    doc.text(`Garantie: ${invoice.warrantyInfo}`, margin, notesY)
    notesY += 6
  } else {
    doc.text('Garantie légale de conformité: Conformément à la directive 2019/771/UE, vous bénéficiez d\'une garantie légale de conformité de 2 ans.', margin, notesY)
    notesY += 6
  }
  
  // Mentions RGPD
  doc.text('Conformément au RGPD, vos données personnelles sont traitées de manière sécurisée et ne sont utilisées que pour la gestion de votre commande.', margin, notesY)
  notesY += 6
  
  // Mentions légales personnalisées
  if (invoice.legalMentions) {
    const splitMentions = doc.splitTextToSize(invoice.legalMentions, pageWidth - 2 * margin)
    doc.text(splitMentions, margin, notesY)
    notesY += splitMentions.length * 6
  }

  // Pied de page
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    `Facture générée le ${new Date().toLocaleDateString('fr-FR')} - FixTector`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  return doc
}

/**
 * Génère un PDF de devis
 */
export async function generateQuotePDF(
  quote: QuoteData,
  company: CompanyInfo,
  parts?: Array<{ name: string; quantity: number; unitPrice: number; total: number }>
): Promise<jsPDF> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = margin

  // En-tête avec logo
  let logoAdded = false
  if (company.logoUrl) {
    try {
      // Charger le logo depuis le système de fichiers
      const logoPath = company.logoUrl.startsWith('/')
        ? join(process.cwd(), 'public', company.logoUrl)
        : join(process.cwd(), 'public', company.logoUrl)
      
      const logoData = await readFile(logoPath)
      const logoBase64 = logoData.toString('base64')
      const logoExtension = company.logoUrl.split('.').pop()?.toLowerCase() || 'png'
      const mimeType = logoExtension === 'svg' ? 'image/svg+xml' : 
                      logoExtension === 'jpg' || logoExtension === 'jpeg' ? 'image/jpeg' :
                      logoExtension === 'webp' ? 'image/webp' : 'image/png'
      
      // Ajouter le logo au PDF (max 50px de hauteur)
      const logoWidth = 50
      const logoHeight = 50
      doc.addImage(`data:${mimeType};base64,${logoBase64}`, logoExtension, margin, yPos, logoWidth, logoHeight)
      logoAdded = true
    } catch (err) {
      console.error('Erreur lors du chargement du logo:', err)
    }
  }

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('DEVIS', pageWidth - margin - 30, yPos, { align: 'right' })
  
  yPos += logoAdded ? 55 : 10
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  if (company.name) {
    doc.text(company.name, margin, yPos)
    yPos += 6
  }
  if (company.address) {
    doc.text(company.address, margin, yPos)
    yPos += 6
  }
  if (company.postalCode && company.city) {
    doc.text(`${company.postalCode} ${company.city}`, margin, yPos)
    yPos += 6
  }
  if (company.phone) {
    doc.text(`Tél: ${company.phone}`, margin, yPos)
    yPos += 6
  }
  if (company.email) {
    doc.text(`Email: ${company.email}`, margin, yPos)
    yPos += 6
  }
  if (company.siret) {
    doc.text(`SIRET: ${company.siret}`, margin, yPos)
    yPos += 6
  }
  if (company.siren) {
    doc.text(`SIREN: ${company.siren}`, margin, yPos)
    yPos += 6
  }
  if (company.rcs) {
    const rcsText = company.rcsCity ? `RCS ${company.rcsCity} ${company.rcs}` : `RCS ${company.rcs}`
    doc.text(rcsText, margin, yPos)
    yPos += 6
  }
  if (company.vatNumber) {
    doc.text(`TVA Intracommunautaire: ${company.vatNumber}`, margin, yPos)
    yPos += 6
  }
  if (company.legalForm) {
    doc.text(`Forme juridique: ${company.legalForm}`, margin, yPos)
    yPos += 6
  }
  if (company.capital) {
    doc.text(`Capital social: ${company.capital}`, margin, yPos)
    yPos += 6
  }
  if (company.director) {
    doc.text(`Directeur: ${company.director}`, margin, yPos)
    yPos += 6
  }

  // Informations devis
  yPos = margin + 10
  doc.setFontSize(10)
  doc.text(`N° Devis: ${quote.quoteNumber}`, pageWidth - margin - 30, yPos, { align: 'right' })
  yPos += 6
  doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString('fr-FR')}`, pageWidth - margin - 30, yPos, { align: 'right' })
  yPos += 6
  doc.text(`Valable jusqu'au: ${new Date(quote.validUntil).toLocaleDateString('fr-FR')}`, pageWidth - margin - 30, yPos, { align: 'right' })
  yPos += 6
  const statusText = quote.status === 'accepted' ? 'Accepté' : quote.status === 'rejected' ? 'Refusé' : 'En attente'
  doc.text(`Statut: ${statusText}`, pageWidth - margin - 30, yPos, { align: 'right' })

  // Informations client
  yPos += 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Devis pour:', margin, yPos)
  yPos += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`${quote.customer.firstName} ${quote.customer.lastName}`, margin, yPos)
  yPos += 6
  if (quote.customer.address) {
    doc.text(quote.customer.address, margin, yPos)
    yPos += 6
  }
  if (quote.customer.postalCode && quote.customer.city) {
    doc.text(`${quote.customer.postalCode} ${quote.customer.city}`, margin, yPos)
    yPos += 6
  }
  if (quote.customer.phone) {
    doc.text(`Tél: ${quote.customer.phone}`, margin, yPos)
    yPos += 6
  }
  if (quote.customer.email) {
    doc.text(`Email: ${quote.customer.email}`, margin, yPos)
  }

  // Informations réparation
  yPos += 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Réparation:', margin, yPos)
  yPos += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Ticket: ${quote.repair.ticketNumber}`, margin, yPos)
  yPos += 6
  doc.text(`Appareil: ${quote.repair.deviceType} - ${quote.repair.brand} ${quote.repair.model}`, margin, yPos)
  yPos += 6
  doc.text(`Problème: ${quote.repair.issue.substring(0, 80)}${quote.repair.issue.length > 80 ? '...' : ''}`, margin, yPos)

  // Tableau des prestations
  yPos += 15
  const tableData: any[] = []
  
  // Main d'œuvre
  tableData.push([
    'Main d\'œuvre',
    '1',
    `${quote.laborCost.toFixed(2)} €`,
    `${quote.laborCost.toFixed(2)} €`
  ])

  // Pièces détachées
  if (parts && parts.length > 0) {
    parts.forEach(part => {
      tableData.push([
        part.name,
        part.quantity.toString(),
        `${part.unitPrice.toFixed(2)} €`,
        `${part.total.toFixed(2)} €`
      ])
    })
  } else {
    tableData.push([
      'Pièces détachées',
      '-',
      '-',
      `${quote.partsCost.toFixed(2)} €`
    ])
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qté', 'Prix unitaire', 'Total HT']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    }
  })

  const finalY = (doc as any).lastAutoTable.finalY || yPos + 30

  // Total
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  const totalsX = pageWidth - margin - 60
  doc.text(`Total: ${quote.totalCost.toFixed(2)} €`, totalsX, finalY + 10, { align: 'right' })

  // Notes
  let notesY = finalY + 20
  if (quote.notes) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Notes:', margin, notesY)
    const splitNotes = doc.splitTextToSize(quote.notes, pageWidth - 2 * margin)
    doc.text(splitNotes, margin, notesY + 7)
    notesY += splitNotes.length * 6 + 10
  }

  // Avertissement de validité
  notesY += 5
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(
    `Ce devis est valable jusqu'au ${new Date(quote.validUntil).toLocaleDateString('fr-FR')}`,
    margin,
    notesY
  )
  notesY += 10

  // Mentions légales obligatoires (UE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Mentions légales:', margin, notesY)
  notesY += 7
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  
  // Conditions de paiement
  if (quote.paymentTerms) {
    doc.text(`Conditions de paiement: ${quote.paymentTerms}`, margin, notesY)
    notesY += 6
  } else {
    const deadline = quote.paymentDeadline || 30
    doc.text(`Paiement à réception de facture (délai: ${deadline} jours)`, margin, notesY)
    notesY += 6
  }
  
  // Pénalités de retard
  if (quote.latePaymentPenalty) {
    doc.text(`En cas de retard de paiement, des pénalités au taux de ${quote.latePaymentPenalty.toFixed(2)}% seront appliquées.`, margin, notesY)
    notesY += 6
  } else {
    doc.text('En cas de retard de paiement, des pénalités au taux de 3 fois le taux d\'intérêt légal seront appliquées.', margin, notesY)
    notesY += 6
  }
  
  // Garantie légale de conformité
  if (quote.warrantyInfo) {
    doc.text(`Garantie: ${quote.warrantyInfo}`, margin, notesY)
    notesY += 6
  } else {
    doc.text('Garantie légale de conformité: Conformément à la directive 2019/771/UE, vous bénéficiez d\'une garantie légale de conformité de 2 ans.', margin, notesY)
    notesY += 6
  }
  
  // Mentions RGPD
  doc.text('Conformément au RGPD, vos données personnelles sont traitées de manière sécurisée et ne sont utilisées que pour la gestion de votre devis.', margin, notesY)
  notesY += 6

  // Pied de page
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    `Devis généré le ${new Date().toLocaleDateString('fr-FR')} - FixTector`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  return doc
}

