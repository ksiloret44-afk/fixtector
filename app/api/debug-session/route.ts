import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const cookieStore = await cookies()
    const nextAuthSessionToken = cookieStore.get('next-auth.session-token')
    const nextAuthCsrfToken = cookieStore.get('next-auth.csrf-token')
    
    return NextResponse.json({
      hasSession: !!session,
      sessionUser: session?.user ? {
        id: (session.user as any).id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role,
      } : null,
      cookies: {
        hasSessionToken: !!nextAuthSessionToken,
        hasCsrfToken: !!nextAuthCsrfToken,
        sessionTokenValue: nextAuthSessionToken?.value?.substring(0, 20) + '...' || null,
      },
      env: {
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        secretLength: process.env.NEXTAUTH_SECRET?.length || 0,
        nextAuthUrl: process.env.NEXTAUTH_URL,
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}

