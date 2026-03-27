<template>
  <q-layout view="lHh Lpr lFf">
    <q-header bordered class="bg-transparent">
      <q-toolbar class="q-px-sm q-px-md-md">
        <q-toolbar-title>
          <router-link to="/" class="brand-link">
            <img :src="activeLogoSrc" alt="bndstr logo" class="brand-logo" />
          </router-link>
        </q-toolbar-title>

        <div class="row items-center q-gutter-xs q-gutter-sm-md no-wrap">
          <q-btn
            flat
            round
            dense
            :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
            @click="toggleDarkMode"
            :title="$q.dark.isActive ? 'Switch to light mode' : 'Switch to dark mode'"
          />

          <q-btn
            flat
            dense
            class="text-weight-bold"
            :label="locale === 'en' ? 'DE' : 'EN'"
            @click="toggleLocale"
          />

          <q-btn flat round dense icon="account_circle">
            <q-menu anchor="bottom right" self="top right">
              <q-list style="min-width: 260px">
                <q-item clickable v-close-popup @click="goDashboard">
                  <q-item-section>Dashboard</q-item-section>
                </q-item>
                <q-item-label header>All Bands</q-item-label>
                <q-item
                  v-for="band in authStore.bands"
                  :key="band.id"
                  clickable
                  v-close-popup
                  @click="selectBand(band.id)"
                >
                  <q-item-section>{{ band.name }}</q-item-section>
                  <q-item-section side>
                    <q-badge v-if="activeBandId === band.id" color="primary">Active</q-badge>
                  </q-item-section>
                </q-item>

                <q-separator />
                <q-item disable>
                  <q-item-section>Role: {{ activeBandRole }}</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="goBilling">
                  <q-item-section>Subscriptions</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="handleLogout">
                  <q-item-section>Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>

      <div v-if="showTopNav" class="top-nav q-px-sm q-pb-sm">
        <div class="row items-center no-wrap top-nav-scroll justify-center">
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
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth'
import { useBandStore } from '../stores/band'
import { useI18n } from '../composables/useI18n'
import defaultLogoDark from '../assets/bndstr_rect_wh.webp'
import defaultLogoLight from '../assets/bndstr_rect_bl.webp'

const authStore = useAuthStore()
const bandStore = useBandStore()
const route = useRoute()
const router = useRouter()
const { t, locale, toggleLocale } = useI18n()
const $q = useQuasar()

const activeBandId = computed({
  get: () => authStore.activeBandId,
  set: (id) => {
    authStore.setActiveBand(id)
    bandStore.fetchMembers()
  },
})

const activeBandRole = computed(() => authStore.activeBand?.role ?? 'none')

const activeLogoSrc = computed(() => {
  const customLogo = authStore.activeBand?.logo
  if (customLogo) return customLogo
  return $q.dark.isActive ? defaultLogoDark : defaultLogoLight
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

  // links.push({ icon: 'payment', label: 'Billing', to: '/billing' })

  return links
})

const showTopNav = computed(() => route.path !== '/dashboard')

function isActiveRoute(path: string) {
  return route.path === path
}

function toggleDarkMode() {
  $q.dark.set(!$q.dark.isActive)
}

function selectBand(id: number) {
  activeBandId.value = id
}

function goDashboard() {
  router.push('/dashboard')
}

function goBilling() {
  router.push('/billing')
}

async function handleLogout() {
  const { authClient } = await import('../boot/auth')
  await authClient.signOut()
  authStore.clearSession()
  window.location.href = '/login'
}
</script>

<style scoped>
.top-nav {
  background: rgba(243, 244, 246, 0.92);
  border-top: 1px solid rgba(17, 24, 39, 0.08);
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
  color: #374151;
}

.top-nav-btn--active {
  background: rgba(148, 163, 184, 0.24);
  border-color: rgba(100, 116, 139, 0.42);
  color: #111827;
}

.brand-link {
  display: inline-flex;
  align-items: center;
}

.brand-logo {
  display: block;
  width: auto;
  height: 34px;
  max-width: 190px;
  object-fit: contain;
}
</style>
