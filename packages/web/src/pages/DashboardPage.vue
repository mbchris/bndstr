<template>
  <q-page padding>
    <div class="dashboard-wrap">
      <div class="row items-center q-col-gutter-sm q-mb-lg">
        <div class="col-12 col-md">
          <div class="text-h4 text-weight-bold">Dashboard</div>
          <div class="text-body2 text-grey-7">Manage your bands, subscription, and invitation access.</div>
        </div>
        <div class="col-12 col-md-auto">
          <q-btn color="primary" icon="home" label="Open Band App" @click="openActiveBandApp" />
        </div>
      </div>

      <div class="row q-col-gutter-lg">
        <div class="col-12 col-lg-7">
          <q-card flat bordered class="q-mb-lg">
            <q-card-section class="row items-center justify-between q-gutter-sm">
              <div>
                <div class="text-h6">Manage Bands</div>
                <div class="text-caption text-grey-7">Select your active band, then open the main app.</div>
              </div>
              <div class="row q-gutter-xs">
                <q-btn flat icon="refresh" label="Refresh" @click="refreshBands" />
                <q-btn flat icon="settings" label="Manage" @click="router.push('/bands/manage')" />
                <q-btn
                  color="primary"
                  icon="add"
                  label="Create Band"
                  :disable="!canCreateBand"
                  :title="canCreateBand ? 'Create a new band' : 'Free plan supports only one created band'"
                  @click="showCreateBandDialog = true"
                />
              </div>
            </q-card-section>
            <q-separator />
            <q-list separator>
              <q-item v-for="band in authStore.bands" :key="band.id">
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ band.name }}</q-item-label>
                  <q-item-label caption>Slug: {{ band.slug }} | Role: {{ band.role }} | Plan: {{ band.plan }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row q-gutter-xs">
                    <q-badge v-if="authStore.activeBandId === band.id" color="primary" label="Active" />
                    <q-btn flat dense icon="check_circle" label="Select Band" @click="selectBandOnly(band.id)" />
                    <q-btn color="primary" dense icon="launch" label="Open App" @click="selectBandAndOpen(band.id)" />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>

          <q-card flat bordered>
            <q-card-section class="row items-center justify-between">
              <div>
                <div class="text-h6">Join Band</div>
                <div class="text-caption text-grey-7">Use a one-time invitation code from a band owner/admin.</div>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <div class="row q-col-gutter-md items-end">
                <div class="col-12 col-md">
                  <q-input
                    v-model="joinCode"
                    label="Invitation code"
                    outlined
                    dense
                    placeholder="BND-XXXXXXXXXXXXXXXXXXXXXXXX"
                    @keyup.enter="joinBand"
                  />
                </div>
                <div class="col-12 col-md-auto">
                  <q-btn color="primary" icon="group_add" label="Join Band" :loading="joining" @click="joinBand" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-lg-5">
          <q-card flat bordered class="q-mb-lg">
            <q-card-section class="row items-center justify-between">
              <div>
                <div class="text-h6">Manage Subscriptions</div>
                <div class="text-caption text-grey-7">Current plan: {{ activePlanLabel }}</div>
              </div>
              <q-btn color="primary" icon="payments" label="Open Billing" @click="router.push('/billing')" />
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <q-dialog v-model="showCreateBandDialog">
      <q-card style="min-width: 420px">
        <q-card-section class="row items-center">
          <div class="text-h6">Create Band</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section>
          <q-input v-model="newBandName" label="Band name" outlined dense autofocus />
          <div class="text-caption text-grey-7 q-mt-sm">URL slug is generated automatically.</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Create" :loading="creatingBand" :disable="!newBandName.trim()" @click="createBand" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import { apiJson } from '../boot/api'
import { useAuthStore, type BandMembership } from '../stores/auth'
import { useBandStore } from '../stores/band'

const router = useRouter()
const authStore = useAuthStore()
const bandStore = useBandStore()

const joining = ref(false)
const creatingBand = ref(false)
const showCreateBandDialog = ref(false)
const newBandName = ref('')
const joinCode = ref('')

const activePlanLabel = computed(() => authStore.activeBand?.plan ?? 'free')
const canCreateBand = computed(() => {
  const ownedBands = authStore.bands.filter((band) => band.role === 'owner')
  if (ownedBands.length === 0) return true
  return ownedBands.some((band) => band.plan !== 'free')
})

async function refreshBands() {
  const bands = await apiJson<BandMembership[]>('/bands')
  authStore.setBands(bands)
}

async function createBand() {
  const name = newBandName.value.trim()
  if (!name) {
    Notify.create({ type: 'warning', message: 'Band name is required.' })
    return
  }
  creatingBand.value = true
  try {
    const band = await apiJson<{ id: number }>('/bands', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
    await refreshBands()
    authStore.setActiveBand(band.id)
    newBandName.value = ''
    showCreateBandDialog.value = false
    Notify.create({ type: 'positive', message: 'Band created' })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to create band',
    })
  } finally {
    creatingBand.value = false
  }
}

function selectBandOnly(bandId: number) {
  authStore.setActiveBand(bandId)
  Notify.create({ type: 'positive', message: 'Active band selected' })
}

async function selectBandAndOpen(bandId: number) {
  authStore.setActiveBand(bandId)
  await bandStore.fetchMembers()
  await router.push('/')
}

async function openActiveBandApp() {
  if (!authStore.activeBandId && authStore.bands[0]) {
    authStore.setActiveBand(authStore.bands[0].id)
  }
  if (authStore.activeBandId) {
    await bandStore.fetchMembers()
    await router.push('/')
    return
  }
  Notify.create({ type: 'warning', message: 'No band selected yet.' })
}

async function joinBand() {
  if (!joinCode.value.trim()) {
    Notify.create({ type: 'warning', message: 'Enter an invitation code first.' })
    return
  }
  joining.value = true
  try {
    const joinedBand = await apiJson<BandMembership>('/bands/join', {
      method: 'POST',
      body: JSON.stringify({ code: joinCode.value.trim() }),
    })
    await refreshBands()
    authStore.setActiveBand(joinedBand.id)
    joinCode.value = ''
    Notify.create({ type: 'positive', message: `Joined ${joinedBand.name}` })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to join band',
    })
  } finally {
    joining.value = false
  }
}

onMounted(async () => {
  await refreshBands()
})
</script>

<style scoped>
.dashboard-wrap {
  max-width: 1240px;
  margin: 0 auto;
}
</style>
