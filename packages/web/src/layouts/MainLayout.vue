<template>
  <q-layout view="lHh Lpr lFf">
    <q-header bordered class="bg-transparent">
      <q-toolbar class="q-px-sm q-px-md-md">
        <q-toolbar-title>
          <span class="text-weight-bold" style="letter-spacing: -0.03em">bndstr</span>
        </q-toolbar-title>

        <div class="row items-center q-gutter-xs q-gutter-sm-md no-wrap">
          <q-btn
            flat
            dense
            class="text-weight-bold"
            :label="locale === 'en' ? 'DE' : 'EN'"
            @click="toggleLocale"
          />

          <q-select
            v-if="authStore.bands.length > 0"
            v-model="activeBandId"
            :options="bandOptions"
            dense
            outlined
            dark
            emit-value
            map-options
            style="min-width: 160px"
            class="gt-xs"
          />

          <q-btn flat round dense icon="add" @click="$router.push('/band/new')" :title="t('common.add')" />
          <q-btn flat round dense icon="logout" @click="handleLogout" :title="t('nav.signOut')" />
        </div>
      </q-toolbar>

      <div class="top-nav q-px-sm q-pb-sm">
        <div class="row items-center no-wrap top-nav-scroll">
          <q-btn
            v-for="link in navLinks"
            :key="link.to"
            flat
            dense
            no-caps
            :label="link.label"
            :to="link.to"
            class="top-nav-btn q-mr-xs"
            :class="{ 'top-nav-btn--active': isActiveRoute(link.to) }"
          />
        </div>
      </div>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useBandStore } from '../stores/band'
import { apiJson } from '../boot/api'
import { useI18n } from '../composables/useI18n'

const authStore = useAuthStore()
const bandStore = useBandStore()
const route = useRoute()
const { t, locale, toggleLocale } = useI18n()

const bandOptions = computed(() =>
  authStore.bands.map((b) => ({ label: b.name, value: b.id })),
)

const activeBandId = computed({
  get: () => authStore.activeBandId,
  set: (id) => {
    authStore.setActiveBand(id)
    bandStore.fetchMembers()
  },
})

const isAdmin = computed(() => {
  const band = authStore.activeBand
  return !!(band && ['owner', 'admin'].includes(band.role))
})

const navLinks = computed(() => {
  const links = [
    { icon: 'home', label: t('nav.home'), to: '/' },
    { icon: 'how_to_vote', label: t('nav.voting'), to: '/voting' },
    { icon: 'queue_music', label: t('nav.setlist'), to: '/setlist' },
    { icon: 'calendar_today', label: t('nav.calendar'), to: '/calendar' },
    { icon: 'music_note', label: t('nav.bendAStand'), to: '/stand' },
  ]

  if (isAdmin.value) {
    links.push({ icon: 'admin_panel_settings', label: t('nav.admin'), to: '/admin' })
  }

  links.push({ icon: 'payment', label: 'Billing', to: '/billing' })

  return links
})

function isActiveRoute(path: string) {
  return route.path === path
}

async function loadBands() {
  try {
    const bands = await apiJson<typeof authStore.bands>('/bands')
    authStore.setBands(bands)
  } catch {
    authStore.clearSession()
    window.location.href = '/login'
  }
}

async function handleLogout() {
  const { authClient } = await import('../boot/auth')
  await authClient.signOut()
  authStore.clearSession()
  window.location.href = '/login'
}

loadBands()
</script>

<style scoped>
.top-nav {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.top-nav-scroll {
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.top-nav-scroll::-webkit-scrollbar {
  display: none;
}

.top-nav-btn {
  border-radius: 999px;
  border: 1px solid transparent;
  white-space: nowrap;
}

.top-nav-btn--active {
  background: rgba(99, 102, 241, 0.16);
  border-color: rgba(129, 140, 248, 0.35);
  color: #a5b4fc;
}
</style>