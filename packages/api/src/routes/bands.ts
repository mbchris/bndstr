import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import { db } from '../db/index.js'
import { bands as bandsTable, bandInviteCodes, bandMembers } from '../db/schema.js'
import { requireAuth, type AuthEnv } from '../middleware/auth.js'
import { requireTenant } from '../middleware/tenant.js'
import { requireRole } from '../middleware/rbac.js'

export const bands = new Hono<AuthEnv>()

// List bands the authenticated user belongs to
bands.get('/', requireAuth, async (c) => {
  const userId = c.get('user').id
  const rows = await db
    .select({
      id: bandsTable.id,
      name: bandsTable.name,
      slug: bandsTable.slug,
      plan: bandsTable.plan,
      logo: bandsTable.logo,
      role: bandMembers.role,
    })
    .from(bandMembers)
    .innerJoin(bandsTable, eq(bandsTable.id, bandMembers.bandId))
    .where(eq(bandMembers.userId, userId))
  return c.json(rows)
})

// Create a new band
const createBandSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
})

bands.post('/', requireAuth, zValidator('json', createBandSchema), async (c) => {
  const userId = c.get('user').id
  const { name, slug } = c.req.valid('json')

  const [band] = await db.insert(bandsTable).values({ name, slug }).returning()

  await db.insert(bandMembers).values({
    bandId: band.id,
    userId,
    role: 'owner',
  })

  return c.json(band, 201)
})

// Get band details (must be a member)
bands.get('/:id', requireAuth, requireTenant, async (c) => {
  const bandId = c.get('bandId')
  const [band] = await db.select().from(bandsTable).where(eq(bandsTable.id, bandId)).limit(1)
  if (!band) return c.json({ error: 'Not found' }, 404)
  return c.json(band)
})

// Update band (admin+)
const updateBandSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
})

bands.patch(
  '/:id',
  requireAuth,
  requireTenant,
  requireRole('admin'),
  zValidator('json', updateBandSchema),
  async (c) => {
    const bandId = c.get('bandId')
    const data = c.req.valid('json')
    const [updated] = await db
      .update(bandsTable)
      .set(data)
      .where(eq(bandsTable.id, bandId))
      .returning()
    return c.json(updated)
  },
)

// Delete band (owner only)
bands.delete('/:id', requireAuth, requireTenant, requireRole('owner'), async (c) => {
  const bandId = c.get('bandId')
  await db.delete(bandsTable).where(eq(bandsTable.id, bandId))
  return c.json({ ok: true })
})

// List band members
bands.get('/:id/members', requireAuth, requireTenant, async (c) => {
  const bandId = c.get('bandId')
  const members = await db
    .select({
      userId: bandMembers.userId,
      role: bandMembers.role,
      sortOrder: bandMembers.sortOrder,
      isHidden: bandMembers.isHidden,
      beerCount: bandMembers.beerCount,
      joinedAt: bandMembers.joinedAt,
    })
    .from(bandMembers)
    .where(eq(bandMembers.bandId, bandId))
    .orderBy(bandMembers.sortOrder)
  return c.json(members)
})

// List invitation codes for the active band (admin+)
bands.get('/:id/invite-codes', requireAuth, requireTenant, requireRole('admin'), async (c) => {
  const bandId = c.get('bandId')
  const rows = await db
    .select({
      id: bandInviteCodes.id,
      code: bandInviteCodes.code,
      createdBy: bandInviteCodes.createdBy,
      usedBy: bandInviteCodes.usedBy,
      invalidatedBy: bandInviteCodes.invalidatedBy,
      createdAt: bandInviteCodes.createdAt,
      usedAt: bandInviteCodes.usedAt,
      invalidatedAt: bandInviteCodes.invalidatedAt,
    })
    .from(bandInviteCodes)
    .where(eq(bandInviteCodes.bandId, bandId))
    .orderBy(desc(bandInviteCodes.createdAt))
  return c.json(rows)
})

// Create invitation code for active band (admin+)
bands.post('/:id/invite-codes', requireAuth, requireTenant, requireRole('admin'), async (c) => {
  const bandId = c.get('bandId')
  const userId = c.get('user').id

  let created:
    | {
        id: number
        bandId: number
        code: string
        createdBy: string
        usedBy: string | null
        invalidatedBy: string | null
        createdAt: Date
        usedAt: Date | null
        invalidatedAt: Date | null
      }
    | undefined

  for (let attempts = 0; attempts < 5; attempts += 1) {
    const code = `BND-${randomBytes(4).toString('hex').toUpperCase()}`
    try {
      ;[created] = await db
        .insert(bandInviteCodes)
        .values({
          bandId,
          code,
          createdBy: userId,
        })
        .returning()
      break
    } catch {
      // Retry on potential unique collisions.
    }
  }

  if (!created) return c.json({ error: 'Could not generate invitation code' }, 500)
  return c.json(created, 201)
})

// Invalidate invitation code (admin+)
bands.post('/:id/invite-codes/:inviteId/invalidate', requireAuth, requireTenant, requireRole('admin'), async (c) => {
  const bandId = c.get('bandId')
  const userId = c.get('user').id
  const inviteId = Number(c.req.param('inviteId'))

  if (!Number.isInteger(inviteId) || inviteId <= 0) return c.json({ error: 'Invalid invitation id' }, 400)

  const [updated] = await db
    .update(bandInviteCodes)
    .set({ invalidatedBy: userId, invalidatedAt: new Date() })
    .where(
      and(
        eq(bandInviteCodes.id, inviteId),
        eq(bandInviteCodes.bandId, bandId),
        isNull(bandInviteCodes.usedAt),
        isNull(bandInviteCodes.invalidatedAt),
      ),
    )
    .returning()

  if (!updated) return c.json({ error: 'Invitation code not found or already inactive' }, 404)
  return c.json(updated)
})

const joinBandSchema = z.object({
  code: z.string().trim().min(4).max(64),
})

// Join a band with a one-time invitation code.
bands.post('/join', requireAuth, zValidator('json', joinBandSchema), async (c) => {
  const userId = c.get('user').id
  const code = c.req.valid('json').code.toUpperCase()

  const [invite] = await db
    .select()
    .from(bandInviteCodes)
    .where(
      and(eq(bandInviteCodes.code, code), isNull(bandInviteCodes.usedAt), isNull(bandInviteCodes.invalidatedAt)),
    )
    .limit(1)

  if (!invite) return c.json({ error: 'Invitation code is invalid or already used' }, 404)

  const [existing] = await db
    .select({ bandId: bandMembers.bandId })
    .from(bandMembers)
    .where(and(eq(bandMembers.bandId, invite.bandId), eq(bandMembers.userId, userId)))
    .limit(1)

  if (existing) return c.json({ error: 'You are already a member of this band' }, 409)

  const result = await db.transaction(async (tx) => {
    const [consumed] = await tx
      .update(bandInviteCodes)
      .set({ usedBy: userId, usedAt: new Date() })
      .where(
        and(
          eq(bandInviteCodes.id, invite.id),
          isNull(bandInviteCodes.usedAt),
          isNull(bandInviteCodes.invalidatedAt),
        ),
      )
      .returning()

    if (!consumed) return null

    await tx.insert(bandMembers).values({
      bandId: invite.bandId,
      userId,
      role: 'member',
    })

    const [band] = await tx.select().from(bandsTable).where(eq(bandsTable.id, invite.bandId)).limit(1)
    if (!band) return null

    return {
      id: band.id,
      name: band.name,
      slug: band.slug,
      plan: band.plan,
      logo: band.logo,
      role: 'member',
    }
  })

  if (!result) return c.json({ error: 'Invitation code is invalid or already used' }, 409)
  return c.json(result, 201)
})
