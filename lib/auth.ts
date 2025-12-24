import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getMainPrisma } from './db-manager'
import bcrypt from 'bcryptjs'

// Vérifier et afficher le secret au chargement
const nextAuthSecret = process.env.NEXTAUTH_SECRET
if (!nextAuthSecret) {
  console.error('❌ NEXTAUTH_SECRET n\'est pas défini!')
  console.error('   Le serveur doit être redémarré après la création de .env.local')
  console.error('   Vérifiez que le fichier .env.local existe à la racine du projet')
} else {
  console.log('✅ NEXTAUTH_SECRET est défini (longueur:', nextAuthSecret.length, 'caractères)')
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret || 'fallback-secret-for-dev-only-change-in-production',
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        try {
          const mainPrisma = getMainPrisma()
          const user = await mainPrisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              mustChangePassword: true,
              theme: true,
              approved: true,
              suspended: true,
            }
          })

          if (!user) {
            console.log('User not found:', credentials.email)
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('Invalid password for user:', credentials.email)
            return null
          }

          // Vérifier si l'utilisateur est approuvé
          if (!user.approved) {
            console.log('User not approved:', credentials.email)
            throw new Error('Compte en attente d\'approbation')
          }

          // Vérifier si le compte est suspendu
          if (user.suspended) {
            console.log('User suspended:', credentials.email)
            throw new Error('COMPTE_SUSPENDU')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
            theme: user.theme || 'light',
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log('JWT callback - User:', user.email)
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role
        token.mustChangePassword = (user as any).mustChangePassword || false
        token.theme = (user as any).theme || 'light'
      } else {
        // Rafraîchir le thème depuis la base de données si le token existe déjà
        if (token.id) {
          try {
            const mainPrisma = getMainPrisma()
            const user = await mainPrisma.user.findUnique({
              where: { id: token.id as string },
              select: { theme: true },
            })
            if (user?.theme) {
              token.theme = user.theme
            }
          } catch (error) {
            console.error('Erreur lors de la récupération du thème:', error)
          }
        }
      }
      console.log('JWT callback - Token:', { id: token.id, email: token.email, theme: token.theme })
      return token
    },
    async session({ session, token }) {
      console.log('Session callback - Token:', { id: token.id, email: token.email, theme: token.theme })
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = token.role as string
        const mustChangePwd = token.mustChangePassword as boolean | undefined
        (session.user as any).mustChangePassword = mustChangePwd !== undefined ? mustChangePwd : false
        const theme = token.theme as string | undefined
        (session.user as any).theme = theme || 'light'
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      console.log('Session callback - Session:', { 
        hasUser: !!session.user, 
        userEmail: session.user?.email,
        theme: (session.user as any)?.theme
      })
      return session
    },
  },
}

