import { NextAuthOptions } from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import { users } from './db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db) as any, // Type workaround for Drizzle adapter
  providers: [
    // Demo/Test credentials provider - REMOVE IN PRODUCTION
    CredentialsProvider({
      name: 'Demo Account',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'demo@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        // For testing: accept demo@example.com with any password
        if (credentials.email.toLowerCase() === 'demo@example.com') {
          try {
            // Check if demo user exists
            let user = await db
              .select()
              .from(users)
              .where(eq(users.email, 'demo@example.com'))
              .limit(1)

            if (user.length === 0) {
              console.log('Creating demo user...')
              // Create demo user
              const [newUser] = await db
                .insert(users)
                .values({
                  email: 'demo@example.com',
                  name: 'Demo User',
                  emailVerified: new Date(),
                })
                .returning()
              
              console.log('Demo user created:', newUser.id)
              return {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
              }
            }

            console.log('Demo user found:', user[0].id)
            return {
              id: user[0].id,
              email: user[0].email,
              name: user[0].name || 'Demo User',
            }
          } catch (error) {
            console.error('Database error in authorize:', error)
            return null
          }
        }

        console.log('Email does not match demo account:', credentials.email)
        return null
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || 'localhost',
        port: parseInt(process.env.EMAIL_SERVER_PORT || '1025'),
        auth: process.env.EMAIL_SERVER_USER ? {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD || '',
        } : undefined,
        secure: false,
        tls: {
          rejectUnauthorized: false,
        },
      },
      from: process.env.EMAIL_FROM || 'noreply@example.com',
    }),
  ],
  session: {
    strategy: 'jwt', // Changed to JWT for credentials provider
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token) {
        // Add user ID to session from JWT token
        (session.user as any).id = token.id
      }
      return session
    },
  },
}
