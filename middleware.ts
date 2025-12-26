import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes publiques qui ne nécessitent pas de vérification d'abonnement
const publicRoutes = [
  '/login',
  '/register',
  '/landing',
  '/api/auth',
  '/api/stripe/webhook', // Webhook Stripe doit être accessible
  '/subscribe',
  '/subscribe/success',
  '/subscription',
  '/forgot-password',
  '/reset-password',
  '/track',
  '/r',
  '/review',
  '/company-review',
  '/client',
  '/test-smtp',
]

// Routes API qui ne nécessitent pas de vérification d'abonnement
const publicApiRoutes = [
  '/api/auth',
  '/api/stripe',
  '/api/reviews/public',
  '/api/reviews/by-token',
  '/api/reviews/repair',
  '/api/reviews/company',
  '/api/chatbot/landing',
  '/api/s/',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Vérifier si c'est une route publique
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next()
  }

  // Vérifier l'authentification
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })

  if (!token) {
    // Si on est sur la racine, rediriger vers /landing
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/landing', request.url))
    }
    // Sinon, rediriger vers la page de connexion
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Pour les routes protégées, on laisse passer
  // La vérification de l'abonnement sera faite dans les composants/layouts
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

