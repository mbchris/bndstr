import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { requireTenant, type TenantEnv } from '../middleware/tenant.js'
import { requireRole } from '../middleware/rbac.js'
import { db } from '../db/index.js'
import { bands, bandMembers, songs, votes, calendarEvents } from '../db/schema.js'
import { eq } from 'drizzle-orm'

export const admin = new Hono<TenantEnv>()

admin.use('*', requireAuth, requireTenant, requireRole('admin'))

// GET /admin/status
admin.get('/status', async (c) => {
  return c.json({
    ok: true,
    database: 'postgresql',
    env: {
      googleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      githubOAuth: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      stripe: !!process.env.STRIPE_SECRET_KEY,
    },
  })
})

// GET /admin/db/export — export band data as JSON
admin.get('/db/export', async (c) => {
  const bandId = c.get('bandId')

  const [bandData, members, songsData, votesData, events] = await Promise.all([
    db.select().from(bands).where(eq(bands.id, bandId)).limit(1),
    db.select().from(bandMembers).where(eq(bandMembers.bandId, bandId)),
    db.select().from(songs).where(eq(songs.bandId, bandId)),
    db.select().from(votes).where(eq(votes.bandId, bandId)),
    db.select().from(calendarEvents).where(eq(calendarEvents.bandId, bandId)),
  ])

  c.header('Content-Type', 'application/json; charset=utf-8')
  c.header('Content-Disposition', 'attachment; filename="bndstr-backup.json"')

  return c.json({
    exportedAt: new Date().toISOString(),
    band: bandData[0],
    members,
    songs: songsData,
    votes: votesData,
    calendarEvents: events,
  })
})

// GET /admin/calendar/export — export only calendar events as JSON
admin.get('/calendar/export', async (c) => {
  const bandId = c.get('bandId')
  const events = await db.select().from(calendarEvents).where(eq(calendarEvents.bandId, bandId))

  c.header('Content-Type', 'application/json; charset=utf-8')
  c.header('Content-Disposition', 'attachment; filename="calendar_export.json"')

  return c.json(events)
})
