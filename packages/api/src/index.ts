import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from './lib/auth.js'
import { bands } from './routes/bands.js'
import { songs } from './routes/songs.js'
import { votes } from './routes/votes.js'
import { calendar } from './routes/calendar.js'
import { gigs } from './routes/gigs.js'
import { rehearsals } from './routes/rehearsals.js'
import { usersRouter as users } from './routes/users.js'
import { admin } from './routes/admin.js'
import { billing } from './routes/billing.js'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = (process.env.CORS_ORIGINS ?? 'http://localhost:9000').split(',')
      return allowed.includes(origin) ? origin : allowed[0]
    },
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'X-Band-Id'],
  }),
)

// Health check
app.get('/health', (c) => c.json({ ok: true, version: process.env.GIT_REV ?? 'dev' }))

// Routes
app.on(['POST', 'GET'], '/api/auth', (c) => auth.handler(c.req.raw))
app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))
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

serve({ fetch: app.fetch, port }, () => {
  console.log(`bndstr API running on http://localhost:${port}`)
})

export type AppType = typeof app
