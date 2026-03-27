import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins'
import { db } from '../db/index.js'
import * as schema from '../db/schema.js'

function normalizeAuthBaseUrl(apiUrl: string): string {
  try {
    const parsed = new URL(apiUrl)
    // API_URL often points to ".../api". Better Auth baseURL should stay at app origin/path prefix,
    // while auth routes are configured via basePath.
    parsed.pathname = parsed.pathname.replace(/\/+$/, '').replace(/\/api$/, '') || '/'
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return apiUrl.replace(/\/+$/, '').replace(/\/api$/, '')
  }
}

const configuredApiUrl = process.env.API_URL ?? 'http://localhost:3001'
const authBaseUrl = normalizeAuthBaseUrl(configuredApiUrl)
export const AUTH_BASE_PATH = '/api/auth'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      organization: schema.organizations,
      member: schema.members,
      invitation: schema.invitations,
    },
  }),

  secret: process.env.AUTH_SECRET,
  baseURL: authBaseUrl,
  basePath: AUTH_BASE_PATH,

  trustedOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:9000')
    .split(/[;,]/)
    .map((o) => o.trim())
    .filter(Boolean),

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
