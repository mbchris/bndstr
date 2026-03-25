<template>
  <q-page padding>
    <div style="max-width: 1200px; margin: 0 auto">
      <div class="row items-center q-gutter-sm q-mb-lg">
        <q-icon name="settings" size="32px" color="primary" />
        <div class="text-h5 text-weight-bold">Admin</div>
      </div>

      <div class="row q-gutter-lg">
        <!-- Band Members Table -->
        <div class="col-12 col-lg-7">
          <q-card flat bordered>
            <q-card-section>
              <div class="row items-center justify-between">
                <div class="text-subtitle1 text-weight-bold">Band Members</div>
                <q-btn size="sm" color="primary" icon="person_add" label="Add" @click="showAddModal = true" />
              </div>
            </q-card-section>
            <q-table
              flat
              :rows="bandStore.members"
              :columns="columns"
              row-key="id"
              :pagination="{ rowsPerPage: 0 }"
              hide-pagination
            >
              <template #body-cell-isHidden="props">
                <q-td :props="props">
                  <q-badge v-if="props.row.isHidden" color="grey">Hidden</q-badge>
                  <span v-else>-</span>
                </q-td>
              </template>
              <template #body-cell-actions="props">
                <q-td :props="props">
                  <div class="row q-gutter-xs">
                    <q-btn flat round dense icon="edit" size="sm" @click="openEdit(props.row)" />
                    <q-btn flat round dense icon="delete" color="red" size="sm" :loading="removingId === props.row.id" @click="removeMember(props.row.id)" />
                  </div>
                </q-td>
              </template>
            </q-table>
          </q-card>
        </div>

        <!-- Sidebar -->
        <div class="col-12 col-lg">
          <!-- System Status -->
          <q-card flat bordered>
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold">System Status</div>
            </q-card-section>
            <q-list dense separator>
              <q-item>
                <q-item-section>Database</q-item-section>
                <q-item-section side><q-badge color="green">Connected</q-badge></q-item-section>
              </q-item>
              <q-item>
                <q-item-section>OIDC Google</q-item-section>
                <q-item-section side>
                  <q-badge :color="sysStatus?.google ? 'green' : 'grey'">{{ sysStatus?.google ? 'Connected' : 'Pending' }}</q-badge>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>OIDC GitHub</q-item-section>
                <q-item-section side>
                  <q-badge :color="sysStatus?.github ? 'green' : 'grey'">{{ sysStatus?.github ? 'Connected' : 'Pending' }}</q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>

          <!-- DB Management -->
          <q-card flat bordered class="q-mt-md">
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold">Database Management</div>
            </q-card-section>
            <q-card-section class="q-gutter-sm">
              <q-btn class="full-width" color="grey-8" icon="download" label="Download Backup" @click="exportDb" />
              <q-btn class="full-width" color="orange" outline icon="upload" label="Import SQL" :loading="isImporting" @click="importInputRef?.click()" />
              <input ref="importInputRef" type="file" accept=".sql,.db" class="hidden" style="display:none" @change="handleImport" />
              <div class="text-caption text-grey text-center">Warning: importing will overwrite existing data.</div>
            </q-card-section>
          </q-card>

          <!-- Calendar Management -->
          <q-card flat bordered class="q-mt-md">
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold">Calendar Management</div>
            </q-card-section>
            <q-card-section class="q-gutter-sm">
              <q-btn class="full-width" color="grey-8" icon="download" label="Export JSON" @click="exportCalendar" />
              <q-btn class="full-width" color="blue" outline icon="upload" label="Import JSON" :loading="isCalendarImporting" @click="calendarImportRef?.click()" />
              <input ref="calendarImportRef" type="file" accept=".json" class="hidden" style="display:none" @change="handleCalendarImport" />
              <div class="text-caption text-grey text-center">Import calendar events from JSON.</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Add Member Dialog -->
    <q-dialog v-model="showAddModal">
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <div class="text-h6">Add Member</div>
          <q-space /><q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="newMember.name" label="Name" outlined dense autofocus />
          <q-input v-model="newMember.email" label="Email" type="email" outlined dense />
          <q-select v-model="newMember.role" :options="['member', 'admin']" label="Role" outlined dense />
          <q-toggle v-model="newMember.isHidden" label="Hidden (excluded from voting)" />
          <q-input v-model.number="newMember.beerCount" label="Beer Count" type="number" outlined dense />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Add" :loading="isSubmitting" @click="addMember" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Member Dialog -->
    <q-dialog v-model="showEditModal">
      <q-card v-if="editingMember" style="min-width: 400px">
        <q-card-section class="row items-center">
          <div class="text-h6">Edit Member</div>
          <q-space /><q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="editingMember.name" label="Name" outlined dense />
          <q-input v-model="editingMember.email" label="Email" type="email" outlined dense />
          <q-select v-model="editingMember.role" :options="['member', 'admin']" label="Role" outlined dense />
          <q-toggle v-model="editingMember.isHidden" label="Hidden" />
          <q-input v-model.number="editingMember.beerCount" label="Beer Count" type="number" outlined dense />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save" :loading="isSubmitting" @click="updateMember" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar, type QTableColumn } from 'quasar'
import { useAuthStore } from '../stores/auth'
import { useBandStore } from '../stores/band'
import { apiJson, api } from '../boot/api'

const $q = useQuasar()
const authStore = useAuthStore()
const bandStore = useBandStore()

const columns: QTableColumn[] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'role', label: 'Role', field: 'role', align: 'left' },
  { name: 'isHidden', label: 'Hidden', field: 'isHidden', align: 'center' },
  { name: 'beerCount', label: 'Beers', field: 'beerCount', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]

const sysStatus = ref<any>(null)
const isSubmitting = ref(false)
const isImporting = ref(false)
const isCalendarImporting = ref(false)
const removingId = ref<string | null>(null)
const importInputRef = ref<HTMLInputElement | null>(null)
const calendarImportRef = ref<HTMLInputElement | null>(null)

// Add member
const showAddModal = ref(false)
const newMember = ref({ name: '', email: '', role: 'member', isHidden: false, beerCount: 0 })

async function addMember() {
  isSubmitting.value = true
  try {
    await apiJson('/users', { method: 'POST', body: JSON.stringify(newMember.value) })
    showAddModal.value = false
    newMember.value = { name: '', email: '', role: 'member', isHidden: false, beerCount: 0 }
    await bandStore.fetchMembers()
  } catch (e: any) { $q.notify({ message: e.message || 'Failed to add member', color: 'negative' }) }
  finally { isSubmitting.value = false }
}

// Edit member
const showEditModal = ref(false)
const editingMember = ref<any>(null)

function openEdit(member: any) {
  editingMember.value = { ...member }
  showEditModal.value = true
}

async function updateMember() {
  if (!editingMember.value) return
  isSubmitting.value = true
  try {
    await bandStore.updateMember(editingMember.value.id, {
      name: editingMember.value.name,
      role: editingMember.value.role,
      isHidden: editingMember.value.isHidden,
    })
    showEditModal.value = false
    await bandStore.fetchMembers()
  } catch (e: any) { $q.notify({ message: e.message || 'Failed to update', color: 'negative' }) }
  finally { isSubmitting.value = false }
}

async function removeMember(id: string) {
  $q.dialog({ title: 'Remove Member', message: 'Are you sure you want to remove this member?', cancel: true }).onOk(async () => {
    removingId.value = id
    try {
      await apiJson(`/users/${id}`, { method: 'DELETE' })
      await bandStore.fetchMembers()
    } catch (e: any) { $q.notify({ message: e.message || 'Failed to remove', color: 'negative' }) }
    finally { removingId.value = null }
  })
}

// System status
async function fetchStatus() {
  try { sysStatus.value = await apiJson<any>('/admin/status') } catch {}
}

// DB export/import
function exportDb() {
  const token = authStore.token
  const bandId = authStore.activeBandId
  const baseUrl = import.meta.env.VITE_API_URL || ''
  window.open(`${baseUrl}/api/admin/db/export?token=${token}&bandId=${bandId}`, '_blank')
}

async function handleImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  $q.dialog({ title: 'Import Database', message: 'This will overwrite existing data. Are you sure?', cancel: true }).onOk(async () => {
    isImporting.value = true
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api('/admin/db/import', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Import failed')
      $q.notify({ message: 'Import successful', color: 'positive' })
      await bandStore.fetchMembers()
    } catch (e: any) { $q.notify({ message: e.message || 'Import failed', color: 'negative' }) }
    finally {
      isImporting.value = false
      ;(event.target as HTMLInputElement).value = ''
    }
  })
}

// Calendar export/import
function exportCalendar() {
  const token = authStore.token
  const bandId = authStore.activeBandId
  const baseUrl = import.meta.env.VITE_API_URL || ''
  window.open(`${baseUrl}/api/admin/calendar/export?token=${token}&bandId=${bandId}`, '_blank')
}

async function handleCalendarImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  isCalendarImporting.value = true
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await api('/admin/calendar/import', { method: 'POST', body: formData })
    if (!res.ok) throw new Error('Import failed')
    const data = await res.json()
    $q.notify({ message: `Imported ${data.count || 0} events`, color: 'positive' })
  } catch (e: any) { $q.notify({ message: e.message || 'Calendar import failed', color: 'negative' }) }
  finally {
    isCalendarImporting.value = false
    ;(event.target as HTMLInputElement).value = ''
  }
}

onMounted(() => {
  bandStore.fetchMembers()
  fetchStatus()
})
</script>
