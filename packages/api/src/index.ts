import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth, AUTH_BASE_PATH } from './lib/auth.js'
import { bands } from './routes/bands.js'
import { songs } from './routes/songs.js'
import { votes } from './routes/votes.js'
import { calendar } from './routes/calendar.js'
import { gigs } from './routes/gigs.js'
import { rehearsals } from './routes/rehearsals.js'
import { usersRouter as users } from './routes/users.js'
import { admin } from './routes/admin.js'
import { billing } from './routes/billing.js'
import { runMigrations } from './db/migrate.js'

const app = new Hono()
type AuthRequest = Parameters<typeof auth.handler>[0]
type RequestLike = {
  url: string
  method: string
  headers: RequestInit['headers']
  body: RequestInit['body'] | null
}

const MOBILE_LOCAL_ORIGINS = ['capacitor://localhost', 'http://localhost', 'https://localhost']
const SUPPORTED_SOCIAL_PROVIDERS = new Set(['google', 'github'])

function getAllowedOrigins(): string[] {
  const configured = (process.env.CORS_ORIGINS ?? 'http://localhost:9000')
    .split(/[;,]/)
    .map((o) => o.trim())
    .filter(Boolean)

  return Array.from(new Set([...configured, ...MOBILE_LOCAL_ORIGINS]))
}

function cloneRequestWithPath(req: RequestLike, pathname: string): AuthRequest {
  const url = new URL(req.url)
  url.pathname = pathname
  const init: RequestInit & { duplex?: 'half' } = {
    method: req.method,
    headers: req.headers,
  }
  if (req.body !== null) {
    init.body = req.body
    init.duplex = 'half'
  }
  return new Request(url.toString(), init) as AuthRequest
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Global middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = getAllowedOrigins()
      return allowed.includes(origin) ? origin : allowed[0]
    },
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'X-Band-Id'],
  }),
)

// Health check
app.get('/health', (c) => c.json({ ok: true, version: process.env.GIT_REV ?? 'dev' }))

// Native OAuth bootstrap:
// Start social sign-in from the system browser context so Better Auth state cookies
// are created and consumed in the same context (avoids state_mismatch).
app.get('/api/mobile-auth/start', (c) => {
  const provider = (c.req.query('provider') ?? '').trim().toLowerCase()
  if (!SUPPORTED_SOCIAL_PROVIDERS.has(provider)) {
    return c.text('Unsupported provider', 400)
  }

  const callbackURL = (c.req.query('callbackURL') ?? '').trim()
  if (!callbackURL) {
    return c.text('Missing callbackURL', 400)
  }

  const errorCallbackURL = (c.req.query('errorCallbackURL') ?? callbackURL).trim()
  const formAction = `${authCanonical}/sign-in/social`

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>bndstr login</title>
  </head>
  <body>
    <form id="oauth-start" method="post" action="${escapeHtml(formAction)}">
      <input type="hidden" name="provider" value="${escapeHtml(provider)}" />
      <input type="hidden" name="callbackURL" value="${escapeHtml(callbackURL)}" />
      <input type="hidden" name="errorCallbackURL" value="${escapeHtml(errorCallbackURL)}" />
      <input type="hidden" name="disableRedirect" value="false" />
      <noscript>
        <button type="submit">Continue</button>
      </noscript>
    </form>
    <script>
      document.getElementById('oauth-start')?.submit();
    </script>
  </body>
</html>`

  return c.html(html)
})

// Routes
const authMethods = ['GET', 'POST', 'OPTIONS']
const authCanonical = AUTH_BASE_PATH.replace(/\/+$/, '')
const authLegacyPaths = ['/auth', '/api/auth'].filter((p) => p !== authCanonical)

app.on(authMethods, authCanonical, (c) => auth.handler(c.req.raw as AuthRequest))
app.on(authMethods, `${authCanonical}/*`, (c) => auth.handler(c.req.raw as AuthRequest))

for (const legacyBase of authLegacyPaths) {
  app.on(authMethods, legacyBase, (c) => {
    return auth.handler(cloneRequestWithPath(c.req.raw, authCanonical))
  })
  app.on(authMethods, `${legacyBase}/*`, (c) => {
    const aliasPath = c.req.path.replace(new RegExp(`^${legacyBase}`), authCanonical)
    return auth.handler(cloneRequestWithPath(c.req.raw, aliasPath))
  })
}
app.route('/api/bands', bands)
app.route('/api/songs', songs)
app.route('/api/votes', votes)
app.route('/api/calendar', calendar)
app.route('/api/gigs', gigs)
app.route('/api/rehearsals', rehearsals)
app.route('/api/users', users)
app.route('/api/admin', admin)
app.route('/api/billing', billing)

const port = Number(process.env.PORT ?? 3001)

async function bootstrap() {
  await runMigrations()
  serve({ fetch: app.fetch, port }, () => {
    console.log(`bndstr API running on http://localhost:${port} (auth: ${authCanonical})`)
  })
}

void bootstrap().catch((error) => {
  console.error('API startup failed', error)
  process.exit(1)
})

export type AppType = typeof app
