import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Défini' : '❌ Non défini',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET 
      ? `✅ Défini (${process.env.NEXTAUTH_SECRET.length} caractères)` 
      : '❌ Non défini',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? `✅ ${process.env.NEXTAUTH_URL}` : '❌ Non défini',
  }

  return NextResponse.json({
    message: 'Variables d\'environnement',
    variables: envVars,
    allOk: !!process.env.NEXTAUTH_SECRET && !!process.env.DATABASE_URL && !!process.env.NEXTAUTH_URL,
  })
}

