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
                <q-btn size="sm" color="primary" round dense icon="person_add" @click="showAddModal = true">
                  <q-tooltip>Add Member</q-tooltip>
                </q-btn>
              </div>
            </q-card-section>
            <q-table
              class="admin-members-table"
              flat
              :rows="bandStore.members"
              :columns="columns"
              row-key="id"
              :pagination="{ rowsPerPage: 0 }"
              :dense="$q.screen.lt.md"
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
          <!-- Band Logo -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold">Band Logo</div>
            </q-card-section>
            <q-card-section class="q-gutter-sm">
              <q-img
                v-if="logoPreviewSrc"
                :src="logoPreviewSrc"
                style="width: 100%; max-width: 420px; aspect-ratio: 830 / 460; border-radius: 10px"
                fit="contain"
              />
              <div v-else class="text-caption text-grey">No custom logo uploaded.</div>

              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-auto">
                  <q-btn
                    color="primary"
                    round
                    dense
                    icon="image"
                    :loading="logoProcessing"
                    @click="logoInputRef?.click()"
                  >
                    <q-tooltip>{{ pendingLogoDataUrl ? 'Change selection' : 'Select logo' }}</q-tooltip>
                  </q-btn>
                </div>
                <div class="col-12 col-sm-auto" v-if="pendingLogoDataUrl">
                  <q-btn
                    color="positive"
                    round
                    dense
                    icon="save"
                    :loading="logoUploading"
                    @click="uploadLogo"
                  >
                    <q-tooltip>Save logo</q-tooltip>
                  </q-btn>
                </div>
                <div class="col-12 col-sm-auto" v-if="authStore.activeBand?.logo">
                  <q-btn
                    color="negative"
                    outline
                    round
                    dense
                    icon="delete"
                    :loading="logoUploading"
                    @click="removeLogo"
                  >
                    <q-tooltip>Remove logo</q-tooltip>
                  </q-btn>
                </div>
              </div>

              <input
                ref="logoInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                style="display:none"
                @change="handleLogoSelected"
              />
              <div class="text-caption text-grey">
                Max 150KB. Uploaded logos are center-cropped to 830x460 and converted to WEBP.
              </div>
            </q-card-section>
          </q-card>

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
              <q-btn class="full-width" color="grey-8" icon="download" @click="exportDb">Download Backup</q-btn>
              <q-btn class="full-width" color="orange" outline icon="upload" :loading="isImporting" @click="importInputRef?.click()">Import SQL</q-btn>
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
              <q-btn class="full-width" color="grey-8" icon="download" @click="exportCalendar">Export JSON</q-btn>
              <q-btn class="full-width" color="blue" outline icon="upload" :loading="isCalendarImporting" @click="calendarImportRef?.click()">Import JSON</q-btn>
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
import { ref, onMounted, computed } from 'vue'
import { useQuasar, type QTableColumn } from 'quasar'
import { useBandStore } from '../stores/band'
import { useAuthStore } from '../stores/auth'
import { apiJson, api } from '../boot/api'

const $q = useQuasar()
const bandStore = useBandStore()
const authStore = useAuthStore()

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
const logoInputRef = ref<HTMLInputElement | null>(null)
const logoProcessing = ref(false)
const logoUploading = ref(false)
const pendingLogoDataUrl = ref<string | null>(null)

const logoPreviewSrc = computed(() => pendingLogoDataUrl.value ?? authStore.activeBand?.logo ?? null)
const MAX_LOGO_BYTES = 150 * 1024

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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Unable to read image'))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(blob)
  })
}

function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to encode logo image'))
        return
      }
      resolve(blob)
    }, 'image/webp', quality)
  })
}

async function createCroppedLogo(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Invalid image file'))
      image.src = url
    })

    const width = 830
    const height = 460
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Unable to process image')

    const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight)
    const drawWidth = img.naturalWidth * scale
    const drawHeight = img.naturalHeight * scale
    const offsetX = (width - drawWidth) / 2
    const offsetY = (height - drawHeight) / 2
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

    const qualities = [0.92, 0.86, 0.8, 0.74, 0.68, 0.62, 0.56]
    for (const quality of qualities) {
      const blob = await canvasToWebpBlob(canvas, quality)
      if (blob.size <= MAX_LOGO_BYTES) {
        return blobToDataUrl(blob)
      }
    }
    throw new Error('Image is too detailed to fit 150KB after cropping')
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function handleLogoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    $q.notify({ message: 'Please select an image file', color: 'negative' })
    return
  }

  logoProcessing.value = true
  try {
    pendingLogoDataUrl.value = await createCroppedLogo(file)
  } catch (e: any) {
    $q.notify({ message: e.message || 'Failed to process logo', color: 'negative' })
  } finally {
    logoProcessing.value = false
  }
}

async function uploadLogo() {
  if (!pendingLogoDataUrl.value) return
  logoUploading.value = true
  try {
    const result = await apiJson<{ logo: string | null }>('/admin/logo', {
      method: 'PUT',
      body: JSON.stringify({ logoDataUrl: pendingLogoDataUrl.value }),
    })
    authStore.setActiveBandLogo(result.logo ?? null)
    pendingLogoDataUrl.value = null
    $q.notify({ message: 'Logo updated', color: 'positive' })
  } catch (e: any) {
    $q.notify({ message: e.message || 'Failed to upload logo', color: 'negative' })
  } finally {
    logoUploading.value = false
  }
}

async function removeLogo() {
  $q.dialog({ title: 'Remove Logo', message: 'Remove the custom band logo?', cancel: true }).onOk(async () => {
    logoUploading.value = true
    try {
      await apiJson('/admin/logo', { method: 'DELETE' })
      authStore.setActiveBandLogo(null)
      pendingLogoDataUrl.value = null
      $q.notify({ message: 'Logo removed', color: 'positive' })
    } catch (e: any) {
      $q.notify({ message: e.message || 'Failed to remove logo', color: 'negative' })
    } finally {
      logoUploading.value = false
    }
  })
}

// DB export/import
async function downloadExport(path: string, fallbackFilename: string) {
  try {
    const res = await api(path, { method: 'GET' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error((err as { error?: string }).error || res.statusText)
    }

    const blob = await res.blob()
    const contentDisposition = res.headers.get('content-disposition') || ''
    const match = contentDisposition.match(/filename=\"?([^"]+)\"?/)
    const filename = match?.[1] || fallbackFilename

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    $q.notify({ message: e.message || 'Export failed', color: 'negative' })
  }
}

function exportDb() {
  downloadExport('/admin/db/export', 'bndstr-backup.json')
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
  downloadExport('/admin/calendar/export', 'calendar_export.json')
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

<style scoped>
@media (max-width: 600px) {
  .admin-members-table :deep(table) {
    font-size: 0.8rem;
  }

  .admin-members-table :deep(.q-table th),
  .admin-members-table :deep(.q-table td) {
    padding: 6px 8px;
  }
}
</style>
