import { route } from 'quasar/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import routes from './routes'

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  router.onError(() => {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  })

  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    const ensureBandsLoaded = async () => {
      if (auth.bands.length > 0) return

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (auth.token) {
        headers.Authorization = `Bearer ${auth.token}`
      }

      const base = (process.env.API_URL ?? '').replace(/\/+$/, '').replace(/\/api$/, '')
      const res = await fetch(`${base}/api/bands`, {
        method: 'GET',
        headers,
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error(`Failed to load bands (${res.status})`)
      }

      const bands = (await res.json()) as typeof auth.bands
      auth.setBands(bands)
    }

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      // Try to restore session from cookie/token
      await auth.loadSession()
      if (!auth.isAuthenticated) {
        return { path: '/login', query: { redirect: to.fullPath } }
      }
    }

    if (to.meta.requiresAuth) {
      try {
        await ensureBandsLoaded()
      } catch {
        auth.clearSession()
        return { path: '/login', query: { redirect: to.fullPath } }
      }
    }

    if (to.meta.requiresAdmin) {
      const activeBand = auth.activeBand
      if (!activeBand || !['owner', 'admin'].includes(activeBand.role)) {
        return { path: '/' }
      }
    }

    // Redirect already-authenticated users away from /login
    if (to.path === '/login' && auth.isAuthenticated) {
      return { path: '/' }
    }
  })

  return router
})
