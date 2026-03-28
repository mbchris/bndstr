import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authClient } from '../boot/auth'

export type User = {
  id: string
  name: string
  email: string
  image?: string | null
}

export type BandMembership = {
  id: number
  name: string
  slug: string
  plan: string
  subscriptionStatus?: 'none' | 'active' | 'canceled' | 'past_due' | 'trialing' | null
  subscriptionInterval?: 'monthly' | 'yearly' | null
  subscriptionCurrentPeriodEnd?: string | null
  subscriptionCancelAtPeriodEnd?: boolean
  role: string
  logo?: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('bndstr-token'))
  const activeBandId = ref<number | null>(
    localStorage.getItem('bndstr-band-id') ? Number(localStorage.getItem('bndstr-band-id')) : null,
  )
  const bands = ref<BandMembership[]>([])

  const isAuthenticated = computed(() => !!user.value)
  const activeBand = computed(() => bands.value.find((b) => b.id === activeBandId.value) ?? null)

  async function loadSession() {
    try {
      const { data } = await authClient.getSession()
      if (data?.user) {
        user.value = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          image: data.user.image,
        }
      } else {
        user.value = null
        token.value = null
      }
    } catch {
      // Network or upstream API errors must not break initial navigation.
      clearSession()
    }
  }

  function setToken(t: string | null) {
    token.value = t
    if (t) {
      localStorage.setItem('bndstr-token', t)
    } else {
      localStorage.removeItem('bndstr-token')
    }
  }

  function setActiveBand(id: number | null) {
    activeBandId.value = id
    if (id) {
      localStorage.setItem('bndstr-band-id', String(id))
    } else {
      localStorage.removeItem('bndstr-band-id')
    }
  }

  function setBands(list: BandMembership[]) {
    bands.value = list
    // Auto-select if only one band or saved band no longer accessible
    if (list.length > 0 && !list.find((b) => b.id === activeBandId.value)) {
      setActiveBand(list[0].id)
    }
  }

  function setActiveBandLogo(logo: string | null) {
    const currentBand = bands.value.find((b) => b.id === activeBandId.value)
    if (currentBand) {
      currentBand.logo = logo
    }
  }

  function clearSession() {
    user.value = null
    token.value = null
    activeBandId.value = null
    bands.value = []
    localStorage.removeItem('bndstr-token')
    localStorage.removeItem('bndstr-band-id')
  }

  return {
    user,
    token,
    activeBandId,
    bands,
    isAuthenticated,
    activeBand,
    loadSession,
    setToken,
    setActiveBand,
    setBands,
    setActiveBandLogo,
    clearSession,
  }
})
