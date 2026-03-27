<template>
  <q-page padding>
    <div style="max-width: 1100px; margin: 0 auto">
      <div class="row items-center q-gutter-sm q-mb-lg">
        <q-icon name="groups" size="30px" color="primary" />
        <div class="text-h5 text-weight-bold">Manage Bands</div>
      </div>

      <q-card flat bordered class="q-mb-lg">
        <q-card-section class="row items-center justify-between">
          <div class="text-subtitle1 text-weight-bold">All Bands</div>
          <q-btn color="primary" icon="add" label="Create Band" @click="showCreateModal = true" />
        </q-card-section>

        <q-list separator>
          <q-item v-for="band in authStore.bands" :key="band.id">
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ band.name }}</q-item-label>
              <q-item-label caption>Slug: {{ band.slug }} | Role: {{ band.role }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row q-gutter-xs">
                <q-btn flat dense icon="check_circle" label="Select" @click="switchBand(band.id)" />
                <q-btn
                  v-if="canManageBand(band.role)"
                  flat
                  dense
                  icon="settings"
                  label="Settings"
                  @click="openSettings(band.id)"
                />
                <q-btn
                  v-if="canManageBand(band.role)"
                  flat
                  dense
                  icon="edit"
                  label="Edit"
                  @click="openEdit(band)"
                />
                <q-btn
                  v-if="canDeleteBand(band.role)"
                  flat
                  dense
                  color="negative"
                  icon="delete"
                  label="Delete"
                  @click="deleteBand(band.id)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>

    <q-dialog v-model="showCreateModal">
      <q-card style="min-width: 420px">
        <q-card-section class="row items-center">
          <div class="text-h6">Create Band</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="createForm.name" label="Band name" outlined dense />
          <q-input v-model="createForm.slug" label="Slug" outlined dense hint="lowercase, numbers, -" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Create" :loading="saving" @click="createBand" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showEditModal">
      <q-card style="min-width: 420px" v-if="editForm">
        <q-card-section class="row items-center">
          <div class="text-h6">Edit Band</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="editForm.name" label="Band name" outlined dense />
          <q-input v-model="editForm.slug" label="Slug" outlined dense hint="lowercase, numbers, -" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save" :loading="saving" @click="saveBand" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { apiJson } from '../boot/api'
import { useAuthStore, type BandMembership } from '../stores/auth'
import { useBandStore } from '../stores/band'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const bandStore = useBandStore()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const saving = ref(false)

const createForm = ref({ name: '', slug: '' })
const editForm = ref<{ id: number; name: string; slug: string } | null>(null)

function canManageBand(role: string) {
  return role === 'owner' || role === 'admin'
}

function canDeleteBand(role: string) {
  return role === 'owner'
}

async function refreshBands() {
  const bands = await apiJson<BandMembership[]>('/bands')
  authStore.setBands(bands)
}

function switchBand(bandId: number) {
  authStore.setActiveBand(bandId)
  bandStore.fetchMembers()
  $q.notify({ message: 'Active band switched', color: 'positive' })
}

function openSettings(bandId: number) {
  switchBand(bandId)
  router.push('/admin')
}

function openEdit(band: BandMembership) {
  editForm.value = { id: band.id, name: band.name, slug: band.slug }
  showEditModal.value = true
}

async function createBand() {
  if (!createForm.value.name || !createForm.value.slug) {
    $q.notify({ message: 'Name and slug are required', color: 'negative' })
    return
  }
  saving.value = true
  try {
    const band = await apiJson<{ id: number }>('/bands', {
      method: 'POST',
      body: JSON.stringify(createForm.value),
    })
    await refreshBands()
    authStore.setActiveBand(band.id)
    createForm.value = { name: '', slug: '' }
    showCreateModal.value = false
    $q.notify({ message: 'Band created', color: 'positive' })
  } catch (e: any) {
    $q.notify({ message: e.message || 'Failed to create band', color: 'negative' })
  } finally {
    saving.value = false
  }
}

async function saveBand() {
  if (!editForm.value) return
  saving.value = true
  try {
    authStore.setActiveBand(editForm.value.id)
    await apiJson(`/bands/${editForm.value.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: editForm.value.name, slug: editForm.value.slug }),
    })
    await refreshBands()
    showEditModal.value = false
    $q.notify({ message: 'Band updated', color: 'positive' })
  } catch (e: any) {
    $q.notify({ message: e.message || 'Failed to update band', color: 'negative' })
  } finally {
    saving.value = false
  }
}

function deleteBand(bandId: number) {
  $q.dialog({ title: 'Delete Band', message: 'Delete this band permanently?', cancel: true }).onOk(async () => {
    saving.value = true
    try {
      authStore.setActiveBand(bandId)
      await apiJson(`/bands/${bandId}`, { method: 'DELETE' })
      await refreshBands()
      $q.notify({ message: 'Band deleted', color: 'positive' })
    } catch (e: any) {
      $q.notify({ message: e.message || 'Failed to delete band', color: 'negative' })
    } finally {
      saving.value = false
    }
  })
}

refreshBands()
</script>
