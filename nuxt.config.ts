// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-04',

  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@sidebase/nuxt-auth',
  ],

  auth: {
    // The relative path to the auth API.
    baseURL: '/api/auth',

    globalAppMiddleware: process.env.DEVMODE !== 'true',

    provider: {
      type: 'authjs',
      addDefaultCallbackUrl: true
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Server-only (not exposed to client)
    // apiSecret: '',
    authSecret: process.env.AUTH_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    githubClientId: process.env.GITHUB_CLIENT_ID,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    authWhitelistEmails: process.env.WHITELIST_EMAILS,

    // Public (exposed to client via useRuntimeConfig())
    public: {
      siteUrl: (process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || '',
      devMode: process.env.DEVMODE === 'true',
      authOrigin: (process.env.NUXT_AUTH_ORIGIN || process.env.AUTH_ORIGIN || 'http://localhost:3000').replace(/\/$/, ''),
      commitId: process.env.bndstr_GIT_REV || process.env.NUXT_PUBLIC_COMMIT_ID || process.env.SOURCE_COMMIT || 'local',
    },
  },

  app: {
    // Remove trailing slash to prevent normalization loops
    baseURL: (process.env.NUXT_APP_BASE_URL || '/').replace(/\/$/, ''),
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'bndstr',
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon.png', // Assume there is one or default
        },
      ],
    },
  },

  // Nitro server engine configuration
  nitro: {
    // Native C++ modules must be externalized — Rollup cannot bundle .node files
    externals: {
      inline: undefined,
    },
    rollupConfig: {
      external: ['better-sqlite3'],
    },
  },
})
