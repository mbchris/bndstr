<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-grey-10">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <span class="text-weight-bold">bndstr</span>
        </q-toolbar-title>

        <!-- Band switcher -->
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
          class="q-mr-sm"
        />

        <q-btn flat round dense icon="add" @click="$router.push('/band/new')" title="New band" />

        <q-btn flat round dense icon="logout" @click="handleLogout" title="Sign out" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-10">
      <q-list>
        <q-item-label header class="text-grey-6 text-uppercase text-caption q-pt-lg">
          Navigation
        </q-item-label>

        <nav-item icon="home" label="Home" to="/" exact />
        <nav-item icon="how_to_vote" label="Voting" to="/voting" />
        <nav-item icon="queue_music" label="Setlist" to="/setlist" />
        <nav-item icon="calendar_today" label="Calendar" to="/calendar" />
        <nav-item icon="music_note" label="Stand" to="/stand" />

        <q-separator class="q-my-sm" dark />

        <nav-item
          v-if="isAdmin"
          icon="admin_panel_settings"
          label="Admin"
          to="/admin"
        />
        <nav-item icon="payment" label="Billing" to="/billing" />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useBandStore } from '../stores/band'
import { apiJson } from '../boot/api'
import NavItem from '../components/NavItem.vue'

const authStore = useAuthStore()
const bandStore = useBandStore()

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const bandOptions = computed(() =>
  authStore.bands.map((b) => ({ label: b.name, value: b.id })),
)

const activeBandId = computed({
  get: () => authStore.activeBandId,
  set: (id) => {
    authStore.setActiveBand(id)
    // Refresh band members when switching
    bandStore.fetchMembers()
  },
})

const isAdmin = computed(() => {
  const band = authStore.activeBand
  return band && ['owner', 'admin'].includes(band.role)
})

async function loadBands() {
  const bands = await apiJson<typeof authStore.bands>('/bands')
  authStore.setBands(bands)
}

async function handleLogout() {
  const { authClient } = await import('../boot/auth')
  await authClient.signOut()
  authStore.clearSession()
  window.location.href = '/login'
}

// Load bands on mount
loadBands()
</script>
