import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { bands as bandsTable, bandMembers } from '../db/schema.js'
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
