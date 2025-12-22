import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const secret = process.env.NEXTAUTH_SECRET
    
    return NextResponse.json({
      hasSession: !!session,
      sessionUser: session?.user?.email || null,
      hasSecret: !!secret,
      secretLength: secret?.length || 0,
      message: session 
        ? 'Session active' 
        : 'Aucune session active',
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      hasSecret: !!process.env.NEXTAUTH_SECRET,
    }, { status: 500 })
  }
}

