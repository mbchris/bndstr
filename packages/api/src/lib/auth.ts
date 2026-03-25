import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins'
import { db } from '../db/index.js'
import * as schema from '../db/schema.js'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
    },
  }),

  secret: process.env.AUTH_SECRET,
  baseURL: process.env.API_URL ?? 'http://localhost:3001',
  basePath: '/api/auth',

  trustedOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:9000').split(','),

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    },
  },

  plugins: [
    organization({
      // Organizations = Bands in our domain
      // Better Auth manages org membership; we sync to band_members for app-level data
      allowUserToCreateOrganization: true,
    }),
  ],

  user: {
    additionalFields: {},
  },

  session: {
    // Support both cookie (web) and bearer token (mobile/Capacitor)
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 1 week
    },
  },

  advanced: {
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === 'production',
    },
  },
})

export type Auth = typeof auth
