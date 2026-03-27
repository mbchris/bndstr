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
            <q-card-section class="row items-center justify-between">
              <div>
                <div class="text-h6">Manage Bands</div>
                <div class="text-caption text-grey-7">Select your active band, then open the main app.</div>
              </div>
              <q-btn flat icon="refresh" label="Refresh" @click="refreshBands" />
            </q-card-section>
            <q-separator />
            <q-list separator>
              <q-item v-for="band in authStore.bands" :key="band.id">
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ band.name }}</q-item-label>
                  <q-item-label caption>Slug: {{ band.slug }} | Role: {{ band.role }}</q-item-label>
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
                    placeholder="BND-XXXXXXXX"
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

          <q-card flat bordered>
            <q-card-section class="row items-center justify-between">
              <div>
                <div class="text-h6">Create Invitation Code</div>
                <div class="text-caption text-grey-7">Active band: {{ activeBandName }}</div>
              </div>
              <q-btn
                color="primary"
                icon="add"
                label="Create Code"
                :disable="!canManageInvites"
                :loading="creatingInvite"
                @click="createInviteCode"
              />
            </q-card-section>
            <q-separator />
            <q-card-section v-if="!canManageInvites">
              <q-banner class="bg-grey-3 text-dark rounded-borders">
                Select a band where you are owner/admin to manage invitation codes.
              </q-banner>
            </q-card-section>
            <q-list v-else separator>
              <q-item v-for="code in inviteCodes" :key="code.id">
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ code.code }}</q-item-label>
                  <q-item-label caption>
                    Created: {{ formatDateTime(code.createdAt) }}
                    <span v-if="code.usedAt"> | Used: {{ formatDateTime(code.usedAt) }}</span>
                    <span v-if="code.invalidatedAt"> | Invalidated: {{ formatDateTime(code.invalidatedAt) }}</span>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row q-gutter-xs">
                    <q-badge v-if="code.usedAt" color="positive" label="Used" />
                    <q-badge v-else-if="code.invalidatedAt" color="negative" label="Invalidated" />
                    <q-badge v-else color="info" label="Active" />
                    <q-btn flat dense icon="qr_code_2" label="QR" @click="openQr(code.code)" />
                    <q-btn
                      flat
                      dense
                      color="negative"
                      icon="block"
                      label="Invalidate"
                      :disable="!!code.usedAt || !!code.invalidatedAt"
                      @click="invalidateInviteCode(code.id)"
                    />
                  </div>
                </q-item-section>
              </q-item>
              <q-item v-if="inviteCodes.length === 0">
                <q-item-section>
                  <q-item-label caption>No invitation codes yet.</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>
      </div>
    </div>

    <q-dialog v-model="showQrDialog">
      <q-card style="min-width: 340px">
        <q-card-section class="row items-center">
          <div class="text-h6">Invitation QR Code</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="text-center">
          <img v-if="qrImageUrl" :src="qrImageUrl" alt="Invitation QR" class="qr-img" />
          <div class="text-body2 q-mt-sm">{{ selectedInviteCode }}</div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Notify, useQuasar } from 'quasar'
import { apiJson } from '../boot/api'
import { useAuthStore, type BandMembership } from '../stores/auth'
import { useBandStore } from '../stores/band'

type InviteCode = {
  id: number
  code: string
  createdBy: string
  usedBy: string | null
  invalidatedBy: string | null
  createdAt: string
  usedAt: string | null
  invalidatedAt: string | null
}

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const bandStore = useBandStore()

const joining = ref(false)
const creatingInvite = ref(false)
const joinCode = ref('')
const inviteCodes = ref<InviteCode[]>([])

const showQrDialog = ref(false)
const selectedInviteCode = ref('')
const qrImageUrl = ref('')

const activeBandName = computed(() => authStore.activeBand?.name ?? 'No active band')
const activePlanLabel = computed(() => authStore.activeBand?.plan ?? 'free')
const canManageInvites = computed(() => {
  const role = authStore.activeBand?.role
  return role === 'owner' || role === 'admin'
})

function formatDateTime(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

async function refreshBands() {
  const bands = await apiJson<BandMembership[]>('/bands')
  authStore.setBands(bands)
}

function selectBandOnly(bandId: number) {
  authStore.setActiveBand(bandId)
  void loadInviteCodes()
  Notify.create({ type: 'positive', message: 'Active band selected' })
}

async function selectBandAndOpen(bandId: number) {
  authStore.setActiveBand(bandId)
  await bandStore.fetchMembers()
  await loadInviteCodes()
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

async function loadInviteCodes() {
  if (!authStore.activeBandId || !canManageInvites.value) {
    inviteCodes.value = []
    return
  }
  try {
    inviteCodes.value = await apiJson<InviteCode[]>(`/bands/${authStore.activeBandId}/invite-codes`)
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to load invitation codes',
    })
  }
}

async function createInviteCode() {
  if (!authStore.activeBandId || !canManageInvites.value) return
  creatingInvite.value = true
  try {
    const created = await apiJson<InviteCode>(`/bands/${authStore.activeBandId}/invite-codes`, { method: 'POST' })
    inviteCodes.value = [created, ...inviteCodes.value]
    Notify.create({ type: 'positive', message: `Invitation code created: ${created.code}` })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to create invitation code',
    })
  } finally {
    creatingInvite.value = false
  }
}

function openQr(code: string) {
  selectedInviteCode.value = code
  qrImageUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(code)}`
  showQrDialog.value = true
}

function invalidateInviteCode(inviteId: number) {
  if (!authStore.activeBandId) return
  $q.dialog({
    title: 'Invalidate Invitation',
    message: 'Invalidate this invitation code?',
    cancel: true,
  }).onOk(async () => {
    try {
      const updated = await apiJson<InviteCode>(
        `/bands/${authStore.activeBandId}/invite-codes/${inviteId}/invalidate`,
        { method: 'POST' },
      )
      const idx = inviteCodes.value.findIndex((entry) => entry.id === inviteId)
      if (idx !== -1) inviteCodes.value[idx] = updated
      Notify.create({ type: 'positive', message: 'Invitation code invalidated' })
    } catch (error) {
      Notify.create({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Failed to invalidate invitation code',
      })
    }
  })
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

watch(
  () => authStore.activeBandId,
  () => {
    void loadInviteCodes()
  },
)

onMounted(async () => {
  await refreshBands()
  await loadInviteCodes()
})
</script>

<style scoped>
.dashboard-wrap {
  max-width: 1240px;
  margin: 0 auto;
}

.qr-img {
  width: 300px;
  max-width: 100%;
  height: auto;
}
</style>
