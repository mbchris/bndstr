import { boot } from 'quasar/wrappers'
import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient({
  baseURL: process.env.API_URL ?? '',
  basePath: '/auth',
})

export default boot(() => {
  // authClient is used directly in stores/auth.ts and components
})
