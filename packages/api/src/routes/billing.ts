import { Hono } from 'hono'
import type { Context } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { bands } from '../db/schema.js'
import { requireAuth } from '../middleware/auth.js'
import { requireTenant, type TenantEnv } from '../middleware/tenant.js'
import { requireRole } from '../middleware/rbac.js'

export const billing = new Hono<TenantEnv>()

type PlanId = 'free' | 'band' | 'pro'

const PLANS: Array<{
  id: PlanId
  name: string
  price: number
  currency: string
  limits: { bands: number | null; songs: number | null; members: number | null }
}> = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'EUR',
    limits: { bands: 1, songs: 20, members: 5 },
  },
  {
    id: 'band',
    name: 'Band',
    price: 5,
    currency: 'EUR',
    limits: { bands: 1, songs: null, members: 10 },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 12,
    currency: 'EUR',
    limits: { bands: 3, songs: null, members: null },
  },
]

let stripeClient: Stripe | null = null

function getStripe(): Stripe {
  if (stripeClient) return stripeClient

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  stripeClient = new Stripe(secretKey)
  return stripeClient
}

function appUrlFromRequest(c: Context) {
  const explicit = process.env.APP_URL?.trim()
  if (explicit) return explicit

  const origins = (process.env.CORS_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean)
  if (origins.length > 0) return origins[0]

  const originHeader = c.req.header('Origin')
  if (originHeader) return originHeader

  return 'http://localhost:9000'
}

function envPriceIdForPlan(plan: Exclude<PlanId, 'free'>) {
  return plan === 'band' ? process.env.STRIPE_PRICE_BAND : process.env.STRIPE_PRICE_PRO
}

function planFromPriceId(priceId?: string | null): PlanId {
  if (!priceId) return 'free'
  if (process.env.STRIPE_PRICE_BAND && priceId === process.env.STRIPE_PRICE_BAND) return 'band'
  if (process.env.STRIPE_PRICE_PRO && priceId === process.env.STRIPE_PRICE_PRO) return 'pro'
  return 'free'
}

async function updateBandPlanByCustomer(customerId: string, plan: PlanId) {
  const [band] = await db.select({ id: bands.id }).from(bands).where(eq(bands.stripeCustomerId, customerId)).limit(1)
  if (!band) return
  await db.update(bands).set({ plan }).where(eq(bands.id, band.id))
}

billing.get('/plans', requireAuth, requireTenant, async (c) => {
  const bandId = c.get('bandId')
  const [band] = await db.select().from(bands).where(eq(bands.id, bandId)).limit(1)
  if (!band) return c.json({ error: 'Band not found' }, 404)

  return c.json({
    currentPlan: band.plan,
    plans: PLANS,
  })
})

billing.post(
  '/checkout',
  requireAuth,
  requireTenant,
  requireRole('owner'),
  zValidator('json', z.object({ plan: z.enum(['band', 'pro']) })),
  async (c) => {
    try {
      const stripe = getStripe()
      const bandId = c.get('bandId')
      const { plan } = c.req.valid('json')
      const [band] = await db.select().from(bands).where(eq(bands.id, bandId)).limit(1)
      if (!band) return c.json({ error: 'Band not found' }, 404)

      const priceId = envPriceIdForPlan(plan)
      if (!priceId) {
        return c.json({ error: `Missing Stripe price configuration for plan "${plan}"` }, 500)
      }

      let customerId = band.stripeCustomerId
      if (!customerId) {
        const customer = await stripe.customers.create({
          name: band.name,
          metadata: { bandId: String(band.id) },
        })
        customerId = customer.id
        await db.update(bands).set({ stripeCustomerId: customerId }).where(eq(bands.id, band.id))
      }

      const appUrl = appUrlFromRequest(c)
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/billing?checkout=success`,
        cancel_url: `${appUrl}/billing?checkout=cancel`,
        metadata: {
          bandId: String(band.id),
          plan,
        },
      })

      return c.json({ url: session.url })
    } catch (error) {
      console.error('[billing.checkout] failed', error)
      return c.json({ error: 'Failed to create checkout session' }, 500)
    }
  },
)

billing.get('/portal', requireAuth, requireTenant, requireRole('owner'), async (c) => {
  try {
    const stripe = getStripe()
    const bandId = c.get('bandId')
    const [band] = await db.select().from(bands).where(eq(bands.id, bandId)).limit(1)
    if (!band) return c.json({ error: 'Band not found' }, 404)
    if (!band.stripeCustomerId) return c.json({ error: 'No Stripe customer found for this band' }, 400)

    const appUrl = appUrlFromRequest(c)
    const portal = await stripe.billingPortal.sessions.create({
      customer: band.stripeCustomerId,
      return_url: `${appUrl}/billing`,
    })

    return c.json({ url: portal.url })
  } catch (error) {
    console.error('[billing.portal] failed', error)
    return c.json({ error: 'Failed to create billing portal session' }, 500)
  }
})

billing.post('/webhook', async (c) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return c.json({ error: 'STRIPE_WEBHOOK_SECRET is not configured' }, 500)
  }

  const signature = c.req.header('stripe-signature')
  if (!signature) {
    return c.json({ error: 'Missing stripe-signature header' }, 400)
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    const payload = await c.req.text()
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error) {
    console.error('[billing.webhook] signature verification failed', error)
    return c.json({ error: 'Invalid webhook signature' }, 400)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (typeof session.customer === 'string' && session.mode === 'subscription') {
          const plan = (session.metadata?.plan as PlanId | undefined) ?? 'free'
          if (plan === 'band' || plan === 'pro') {
            await updateBandPlanByCustomer(session.customer, plan)
          }
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        if (typeof sub.customer === 'string') {
          const priceId = sub.items.data[0]?.price?.id
          await updateBandPlanByCustomer(sub.customer, planFromPriceId(priceId))
        }
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        if (typeof sub.customer === 'string') {
          await updateBandPlanByCustomer(sub.customer, 'free')
        }
        break
      }
      default:
        break
    }
  } catch (error) {
    console.error('[billing.webhook] handler failed', error)
    return c.json({ error: 'Webhook handler error' }, 500)
  }

  return c.json({ received: true })
})
