import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { requireTenant, type TenantEnv } from '../middleware/tenant.js'
import { requireRole } from '../middleware/rbac.js'

export const billing = new Hono<TenantEnv>()

// Placeholder — Stripe integration in Step 7
billing.use('*', requireAuth, requireTenant)

billing.get('/plans', (c) => {
  return c.json([
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
  ])
})

// POST /billing/checkout — creates Stripe Checkout session (Step 7)
billing.post('/checkout', requireRole('owner'), async (c) => {
  return c.json({ error: 'Stripe not yet configured' }, 501)
})

// GET /billing/portal — Stripe Customer Portal URL (Step 7)
billing.get('/portal', requireRole('owner'), async (c) => {
  return c.json({ error: 'Stripe not yet configured' }, 501)
})

// POST /billing/webhook — Stripe webhook handler (Step 7)
billing.post('/webhook', async (c) => {
  return c.json({ received: true })
})
