#!/usr/bin/env tsx
/**
 * Script de vérification de sécurité
 * Vérifie les vulnérabilités Node.js et npm
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'

interface SecurityCheck {
  nodeVersion: string
  npmVersion: string
  vulnerabilities: {
    critical: number
    high: number
    moderate: number
    low: number
  }
  outdatedPackages: string[]
  recommendations: string[]
}

function getNodeVersion(): string {
  try {
    return execSync('node --version', { encoding: 'utf-8' }).trim()
  } catch {
    return 'Unknown'
  }
}

function getNpmVersion(): string {
  try {
    return execSync('npm --version', { encoding: 'utf-8' }).trim()
  } catch {
    return 'Unknown'
  }
}

function checkNpmAudit(): { critical: number; high: number; moderate: number; low: number } {
  try {
    const auditOutput = execSync('npm audit --json', { encoding: 'utf-8' })
    const audit = JSON.parse(auditOutput)
    
    return {
      critical: audit.metadata?.vulnerabilities?.critical || 0,
      high: audit.metadata?.vulnerabilities?.high || 0,
      moderate: audit.metadata?.vulnerabilities?.moderate || 0,
      low: audit.metadata?.vulnerabilities?.low || 0,
    }
  } catch (error: any) {
    console.error('Erreur lors de la vérification npm audit:', error.message)
    return { critical: 0, high: 0, moderate: 0, low: 0 }
  }
}

function getOutdatedPackages(): string[] {
  try {
    const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf-8' })
    const outdated = JSON.parse(outdatedOutput)
    return Object.keys(outdated)
  } catch {
    return []
  }
}

function getRecommendations(check: SecurityCheck): string[] {
  const recommendations: string[] = []
  
  // Vérifier la version Node.js
  const nodeVersion = check.nodeVersion.replace('v', '')
  const majorVersion = parseInt(nodeVersion.split('.')[0])
  
  if (majorVersion < 20) {
    recommendations.push('⚠️ Node.js version obsolète. Mettez à jour vers Node.js 20.x ou supérieur.')
  }
  
  // Vérifier les vulnérabilités
  if (check.vulnerabilities.critical > 0) {
    recommendations.push(`🔴 ${check.vulnerabilities.critical} vulnérabilité(s) critique(s) détectée(s). Exécutez: npm audit fix`)
  }
  
  if (check.vulnerabilities.high > 0) {
    recommendations.push(`🟠 ${check.vulnerabilities.high} vulnérabilité(s) haute(s) détectée(s). Exécutez: npm audit fix`)
  }
  
  if (check.vulnerabilities.moderate > 0) {
    recommendations.push(`🟡 ${check.vulnerabilities.moderate} vulnérabilité(s) modérée(s) détectée(s). Exécutez: npm audit fix`)
  }
  
  // Vérifier les packages obsolètes
  if (check.outdatedPackages.length > 0) {
    recommendations.push(`📦 ${check.outdatedPackages.length} package(s) obsolète(s). Exécutez: npm update`)
  }
  
  return recommendations
}

function main() {
  console.log('🔒 Vérification de sécurité...\n')
  
  const check: SecurityCheck = {
    nodeVersion: getNodeVersion(),
    npmVersion: getNpmVersion(),
    vulnerabilities: checkNpmAudit(),
    outdatedPackages: getOutdatedPackages(),
    recommendations: [],
  }
  
  check.recommendations = getRecommendations(check)
  
  // Afficher les résultats
  console.log('📊 Résultats de la vérification:\n')
  console.log(`Node.js: ${check.nodeVersion}`)
  console.log(`npm: ${check.npmVersion}`)
  console.log('\n🔍 Vulnérabilités détectées:')
  console.log(`  - Critique: ${check.vulnerabilities.critical}`)
  console.log(`  - Haute: ${check.vulnerabilities.high}`)
  console.log(`  - Modérée: ${check.vulnerabilities.moderate}`)
  console.log(`  - Faible: ${check.vulnerabilities.low}`)
  
  if (check.outdatedPackages.length > 0) {
    console.log(`\n📦 Packages obsolètes: ${check.outdatedPackages.length}`)
  }
  
  if (check.recommendations.length > 0) {
    console.log('\n💡 Recommandations:')
    check.recommendations.forEach(rec => console.log(`  ${rec}`))
  } else {
    console.log('\n✅ Aucun problème de sécurité détecté!')
  }
  
  // Code de sortie
  const hasIssues = 
    check.vulnerabilities.critical > 0 ||
    check.vulnerabilities.high > 0 ||
    check.outdatedPackages.length > 10
  
  process.exit(hasIssues ? 1 : 0)
}

main()















