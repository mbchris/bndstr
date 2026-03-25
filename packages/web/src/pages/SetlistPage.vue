<template>
  <q-page padding>
    <div style="max-width: 1200px; margin: 0 auto">
      <q-card flat bordered>
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="row items-center q-gutter-sm">
              <div class="text-h5 text-weight-bold">Setlist</div>
              <q-select v-model="selectedGigId" :options="gigOptions" emit-value map-options dense outlined style="width: 200px" />
            </div>
            <div class="row q-gutter-sm">
              <q-btn flat round icon="download" @click="handleExport" />
              <q-btn flat round icon="pause_circle" @click="openSpecialModal('pause')" />
              <q-btn flat round icon="tune" @click="openSpecialModal('tuning')" />
              <q-btn round color="primary" icon="add" @click="openAddSongModal" />
            </div>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row q-gutter-sm q-mb-md">
            <q-input v-model="searchQuery" dense outlined placeholder="Filter songs..." class="col" clearable>
              <template #prepend><q-icon name="search" /></template>
            </q-input>
            <q-select v-model="sortBy" :options="sortOptions" emit-value map-options dense outlined style="width: 160px" />
          </div>

          <q-list v-if="filteredSongs.length" separator>
            <q-item
              v-for="(item, index) in filteredSongs"
              :key="item.id"
              class="q-pa-sm"
              :class="{
                'bg-blue-1': item.isPinned,
                'border-dashed': item.type !== 'song'
              }"
            >
              <!-- Reorder + Pin -->
              <q-item-section side>
                <div class="column items-center q-gutter-xs">
                  <template v-if="sortBy === 'custom'">
                    <q-btn flat round dense icon="keyboard_arrow_up" size="xs" :disable="index === 0" @click="moveItem(index, -1)" />
                    <span class="text-caption text-grey">{{ index + 1 }}</span>
                    <q-btn flat round dense icon="keyboard_arrow_down" size="xs" :disable="index === filteredSongs.length - 1" @click="moveItem(index, 1)" />
                  </template>
                  <q-btn flat round dense :icon="item.isPinned ? 'lock' : 'lock_open'" :color="item.isPinned ? 'primary' : 'grey'" size="sm" @click="togglePin(item)" />
                </div>
              </q-item-section>

              <!-- Thumbnail (songs only) -->
              <q-item-section v-if="item.type === 'song'" side>
                <a v-if="item.spotifyUrl && item.thumbnailUrl" :href="item.spotifyUrl" target="_blank">
                  <q-avatar rounded size="48px"><img :src="item.thumbnailUrl" /></q-avatar>
                </a>
                <a v-else-if="item.youtubeUrl && getYouTubeId(item.youtubeUrl)" :href="item.youtubeUrl" target="_blank">
                  <q-avatar rounded size="48px"><img :src="`https://img.youtube.com/vi/${getYouTubeId(item.youtubeUrl)}/mqdefault.jpg`" /></q-avatar>
                </a>
                <q-avatar v-else rounded size="48px" color="grey-3"><q-icon name="music_note" color="grey" /></q-avatar>
              </q-item-section>

              <!-- Content -->
              <q-item-section>
                <!-- Song content -->
                <template v-if="item.type === 'song'">
                  <q-item-label class="text-weight-bold">
                    {{ item.title }}
                    <q-icon v-if="item.notes" name="info" color="grey" size="xs" class="cursor-pointer q-ml-xs">
                      <q-tooltip>{{ item.notes }}</q-tooltip>
                    </q-icon>
                    <q-icon v-if="getPersonalNote(item.id)" name="person" color="primary" size="xs" class="cursor-pointer q-ml-xs" @click="showNote('Personal Notes: ' + item.title, getPersonalNote(item.id))">
                      <q-tooltip>Personal note</q-tooltip>
                    </q-icon>
                  </q-item-label>
                  <q-item-label caption>{{ item.artist }}</q-item-label>
                  <div class="row q-gutter-xs q-mt-xs">
                    <a v-if="item.spotifyUrl" :href="item.spotifyUrl" target="_blank" class="text-green text-caption text-weight-bold" style="text-decoration:none">Spotify</a>
                    <a v-if="item.youtubeUrl" :href="item.youtubeUrl" target="_blank" class="text-red text-caption text-weight-bold" style="text-decoration:none">YouTube</a>
                    <q-badge v-if="item.pitch !== 0" color="orange" outline class="text-caption">
                      Pitch: {{ item.pitch > 0 ? '+' : '' }}{{ item.pitch }}
                    </q-badge>
                  </div>
                </template>

                <!-- Pause content -->
                <template v-else-if="item.type === 'pause'">
                  <q-item-label class="text-grey text-italic">
                    <q-icon name="pause_circle" class="q-mr-xs" />
                    {{ item.title }}
                    <q-icon v-if="item.notes" name="info" color="grey" size="xs" class="cursor-pointer q-ml-xs" @click="showNote(item.title, item.notes)" />
                  </q-item-label>
                </template>

                <!-- Tuning content -->
                <template v-else-if="item.type === 'tuning'">
                  <q-item-label class="text-orange text-italic">
                    <q-icon name="tune" class="q-mr-xs" />
                    {{ item.title }}
                    <q-icon v-if="item.notes" name="info" color="orange" size="xs" class="cursor-pointer q-ml-xs" @click="showNote(item.title, item.notes)" />
                  </q-item-label>
                </template>
              </q-item-section>

              <!-- Actions -->
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn flat round dense icon="edit" size="sm" @click="openEditModal(item)" />
                  <q-btn v-if="item.type === 'song'" flat round dense icon="arrow_back" color="grey" size="sm" @click="removeFromSetlist(item)">
                    <q-tooltip>Move to Voting</q-tooltip>
                  </q-btn>
                  <q-btn v-else flat round dense icon="close" color="red" size="sm" @click="removeFromSetlist(item)" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <q-banner v-else rounded class="bg-grey-2">No items in the setlist yet.</q-banner>
        </q-card-section>
      </q-card>
    </div>

    <!-- Add Song to Master Setlist Dialog -->
    <q-dialog v-model="showAddSongModal">
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <div class="text-h6">Add New Song to Master Setlist</div>
          <q-space /><q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="addSongForm.title" label="Title" outlined dense autofocus />
          <q-input v-model="addSongForm.artist" label="Artist" outlined dense />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Add Song" :loading="isSaving" @click="submitAddSong" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Master Songs to Gig Dialog -->
    <q-dialog v-model="showAddGigSongModal">
      <q-card style="min-width: 450px">
        <q-card-section class="row items-center">
          <div class="text-h6">Add Master Songs to Gig Setlist</div>
          <q-space /><q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="selectedMasterSongIds"
            :options="masterSongOptions"
            emit-value
            map-options
            multiple
            use-chips
            outlined
            dense
            label="Select songs..."
            option-label="label"
            option-value="value"
          />
          <div class="row q-gutter-sm q-mt-sm">
            <q-btn flat dense size="sm" label="Select All" @click="selectedMasterSongIds = masterSongOptions.map(o => o.value)" />
            <q-btn flat dense size="sm" label="Select None" @click="selectedMasterSongIds = []" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Add to Gig" :loading="isSaving" :disable="!selectedMasterSongIds.length" @click="submitAddGigSong" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Note Viewer Dialog -->
    <q-dialog v-model="showNoteModal">
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ noteModalTitle }}</div>
          <q-space /><q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section>
          <Markdown v-if="noteModalContent" :content="noteModalContent" />
          <div v-else class="text-grey text-italic text-center q-pa-lg">Empty note</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Song Dialog -->
    <q-dialog v-model="showEditModal">
      <q-card v-if="editingItem" style="min-width: 450px">
        <q-card-section class="row items-center">
          <div class="text-h6">Edit: {{ editingItem.title }}</div>
          <q-space /><q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <template v-if="editingItem.type === 'song'">
            <div class="row q-gutter-sm">
              <q-input v-model="editingItem.spotifyUrl" label="Spotify URL" outlined dense class="col" @paste="onSpotifyPaste" />
              <q-btn color="green" icon="search" :loading="isLookingUp" :disable="!editingItem.spotifyUrl" @click="lookupSpotify(true)">Lookup</q-btn>
            </div>
            <div v-if="lookupError" class="text-red text-caption">{{ lookupError }}</div>
            <q-input v-model="editingItem.title" label="Title" outlined dense />
            <q-input v-model="editingItem.artist" label="Artist" outlined dense />
            <q-input v-model="editingItem.youtubeUrl" label="YouTube URL" outlined dense />
            <div class="row items-center q-gutter-md">
              <span class="text-caption">Pitch Shift (Semi-tones)</span>
              <q-slider v-model="editingItem.pitch" :min="-5" :max="5" :step="1" snap label class="col" />
              <q-badge color="grey-8" class="text-body2">{{ editingItem.pitch > 0 ? '+' : '' }}{{ editingItem.pitch }}</q-badge>
            </div>
          </template>
          <q-input v-model="editingItem.notes" label="Notes" type="textarea" outlined dense autogrow />
          <q-input v-model="editingItemPersonalNote" label="Personal Notes (only visible to you)" type="textarea" outlined dense autogrow />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save" :loading="isSaving" @click="saveItemEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Special Element (Pause/Tuning) Dialog -->
    <q-dialog v-model="showSpecialModal">
      <q-card v-if="specialElementForm" style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ specialElementForm.type === 'pause' ? 'Add Pause' : 'Change Tuning' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="specialElementForm.title" label="Title" outlined dense autofocus />
          <q-input v-model="specialElementForm.notes" label="Notes" type="textarea" outlined dense autogrow />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Add" :loading="isSaving" @click="submitSpecialElement" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useSongsStore, type Song } from '../stores/songs'
import { apiJson } from '../boot/api'
import Markdown from '../components/Markdown.vue'

const $q = useQuasar()
const songsStore = useSongsStore()

const searchQuery = ref('')
const sortBy = ref('custom')
const sortOptions = [
  { label: 'Custom order', value: 'custom' },
  { label: 'By title', value: 'title' },
  { label: 'By artist', value: 'artist' },
]

// Gig selection
const selectedGigId = ref<number | null>(null)
const gigs = ref<any[]>([])
const gigSongs = ref<Song[]>([])
const personalNotes = ref<any[]>([])

const gigOptions = computed(() => [
  { label: 'Master Setlist', value: null },
  ...gigs.value.map((g) => {
    let dateStr = ''
    if (g.startTime) {
      try { dateStr = new Date(g.startTime).toISOString().split('T')[0] } catch {}
    }
    return { label: dateStr ? `${dateStr} ${g.title}` : g.title, value: g.id }
  }),
])

// Active song list depends on gig selection
const activeSongs = computed(() => {
  if (selectedGigId.value) return gigSongs.value
  return songsStore.songs.filter((s) => s.isSetlist)
})

const filteredSongs = computed(() => {
  let list = [...activeSongs.value]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((s) => s.title.toLowerCase().includes(q) || (s.artist && s.artist.toLowerCase().includes(q)))
  }

  if (sortBy.value === 'title') list.sort((a, b) => a.title.localeCompare(b.title))
  else if (sortBy.value === 'artist') list.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''))
  else list.sort((a, b) => { if (a.isPinned && !b.isPinned) return -1; if (!a.isPinned && b.isPinned) return 1; return a.position - b.position })

  return list
})

// Master songs for gig song picker
const masterSongOptions = computed(() =>
  songsStore.songs
    .filter((s) => s.type === 'song' && s.isSetlist)
    .map((s) => ({ label: `${s.title} - ${s.artist}`, value: s.id }))
)

function getPersonalNote(songId: number) {
  const note = personalNotes.value.find((n: any) => n.songId === songId)
  return note ? note.content : ''
}

function getYouTubeId(url: string | null | undefined) {
  if (!url) return null
  let match = url.match(/v=([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  return null
}

// Data fetching
async function fetchGigs() {
  try { gigs.value = await apiJson<any[]>('/gigs') } catch { gigs.value = [] }
}

async function fetchGigSongs(gigId: number) {
  try { gigSongs.value = await apiJson<Song[]>(`/gigs/${gigId}/songs`) } catch { gigSongs.value = [] }
}

async function fetchPersonalNotes() {
  try { personalNotes.value = await apiJson<any[]>('/songs/notes') } catch { personalNotes.value = [] }
}

async function refreshAll() {
  const promises: Promise<void>[] = [songsStore.fetchSongs(), fetchPersonalNotes()]
  if (selectedGigId.value) promises.push(fetchGigSongs(selectedGigId.value))
  await Promise.all(promises)
}

watch(selectedGigId, (newVal) => {
  if (newVal) fetchGigSongs(newVal)
})

// Reorder
async function moveItem(index: number, direction: number) {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= filteredSongs.value.length) return

  const items = [...filteredSongs.value]
  ;[items[index], items[targetIndex]] = [items[targetIndex], items[index]]
  const updates = items.map((itm, idx) => ({ id: itm.id, position: idx }))

  try {
    if (selectedGigId.value) {
      await apiJson(`/gigs/${selectedGigId.value}/songs/reorder`, { method: 'POST', body: JSON.stringify(updates) })
      await fetchGigSongs(selectedGigId.value)
    } else {
      await songsStore.reorderSongs(updates)
    }
  } catch {
    $q.notify({ message: 'Reorder failed', color: 'negative' })
    await refreshAll()
  }
}

async function togglePin(item: Song) {
  try {
    await songsStore.updateSong(item.id, { isPinned: !item.isPinned } as any)
    await refreshAll()
  } catch {}
}

async function removeFromSetlist(item: Song) {
  $q.dialog({
    title: 'Remove',
    message: item.type !== 'song' ? `Delete "${item.title}"?` : `Move "${item.title}" back to voting?`,
    cancel: true,
  }).onOk(async () => {
    try {
      if (item.type !== 'song') {
        await songsStore.deleteSong(item.id)
      } else if (selectedGigId.value) {
        await apiJson(`/gigs/${selectedGigId.value}/songs/${item.id}`, { method: 'DELETE' })
        await fetchGigSongs(selectedGigId.value)
      } else {
        await songsStore.updateSong(item.id, { isSetlist: false } as any)
      }
      await refreshAll()
    } catch {
      $q.notify({ message: 'Failed to remove', color: 'negative' })
    }
  })
}

// Note viewer
const showNoteModal = ref(false)
const noteModalTitle = ref('')
const noteModalContent = ref('')

function showNote(title: string, content: string | null | undefined) {
  noteModalTitle.value = title
  noteModalContent.value = content || ''
  showNoteModal.value = true
}

// Add song to master setlist
const showAddSongModal = ref(false)
const addSongForm = ref({ title: '', artist: '' })
const isSaving = ref(false)

function openAddSongModal() {
  if (selectedGigId.value) {
    showAddGigSongModal.value = true
  } else {
    addSongForm.value = { title: '', artist: '' }
    showAddSongModal.value = true
  }
}

async function submitAddSong() {
  isSaving.value = true
  try {
    await songsStore.createSong({ title: addSongForm.value.title, artist: addSongForm.value.artist, position: filteredSongs.value.length, isSetlist: true } as any)
    showAddSongModal.value = false
    await refreshAll()
  } catch { $q.notify({ message: 'Failed to add song', color: 'negative' }) }
  finally { isSaving.value = false }
}

// Add master songs to gig setlist
const showAddGigSongModal = ref(false)
const selectedMasterSongIds = ref<number[]>([])

async function submitAddGigSong() {
  isSaving.value = true
  try {
    for (let i = 0; i < selectedMasterSongIds.value.length; i++) {
      await apiJson(`/gigs/${selectedGigId.value}/songs`, {
        method: 'POST',
        body: JSON.stringify({ songId: selectedMasterSongIds.value[i], position: filteredSongs.value.length + i }),
      })
    }
    showAddGigSongModal.value = false
    selectedMasterSongIds.value = []
    if (selectedGigId.value) await fetchGigSongs(selectedGigId.value)
  } catch (e: any) { $q.notify({ message: 'Failed to add songs to gig', color: 'negative' }) }
  finally { isSaving.value = false }
}

// Special element (pause/tuning)
const showSpecialModal = ref(false)
const specialElementForm = ref<{ type: 'pause' | 'tuning'; title: string; notes: string } | null>(null)

function openSpecialModal(type: 'pause' | 'tuning') {
  specialElementForm.value = { type, title: type === 'pause' ? 'Break / Pause' : 'Tuning Change', notes: '' }
  showSpecialModal.value = true
}

async function submitSpecialElement() {
  if (!specialElementForm.value) return
  isSaving.value = true
  try {
    await songsStore.createSong({
      title: specialElementForm.value.title,
      artist: 'Band',
      type: specialElementForm.value.type,
      notes: specialElementForm.value.notes,
      position: filteredSongs.value.length,
      isSetlist: true,
    } as any)
    showSpecialModal.value = false
    await refreshAll()
  } catch { $q.notify({ message: 'Failed to add ' + specialElementForm.value.type, color: 'negative' }) }
  finally { isSaving.value = false }
}

// Edit modal
const showEditModal = ref(false)
const editingItem = ref<any>(null)
const editingItemPersonalNote = ref('')
const isLookingUp = ref(false)
const lookupError = ref('')

function openEditModal(item: Song) {
  editingItem.value = { ...item }
  editingItemPersonalNote.value = getPersonalNote(item.id)
  showEditModal.value = true
}

async function lookupSpotify(force = true) {
  if (!editingItem.value) return
  const url = editingItem.value.spotifyUrl
  if (!url?.includes('spotify.com')) return
  if (!force && editingItem.value.title && editingItem.value.artist) return
  isLookingUp.value = true
  lookupError.value = ''
  try {
    const data = await apiJson<any>(`/songs/lookup?url=${encodeURIComponent(url)}`)
    if (data?.title && (force || !editingItem.value.title)) editingItem.value.title = data.title
    if (data?.artist && (force || !editingItem.value.artist)) editingItem.value.artist = data.artist
  } catch { lookupError.value = 'Lookup failed' }
  finally { isLookingUp.value = false }
}

function onSpotifyPaste() { setTimeout(() => lookupSpotify(false), 100) }

async function saveItemEdit() {
  isSaving.value = true
  try {
    await songsStore.updateSong(editingItem.value.id, {
      title: editingItem.value.title,
      artist: editingItem.value.artist,
      spotifyUrl: editingItem.value.spotifyUrl,
      youtubeUrl: editingItem.value.youtubeUrl,
      pitch: editingItem.value.pitch,
      notes: editingItem.value.notes,
    } as any)

    // Save personal note if changed
    const currentNote = getPersonalNote(editingItem.value.id)
    if (editingItemPersonalNote.value !== currentNote) {
      await apiJson('/songs/notes', { method: 'POST', body: JSON.stringify({ songId: editingItem.value.id, content: editingItemPersonalNote.value }) })
    }

    showEditModal.value = false
    await refreshAll()
  } catch { $q.notify({ message: 'Failed to save', color: 'negative' }) }
  finally { isSaving.value = false }
}

// Export
function handleExport() {
  import('xlsx').then(({ utils, writeFile }) => {
    const data = filteredSongs.value.map((item, idx) => {
      if (item.type === 'song') {
        return { '#': idx + 1, Title: item.title, Artist: item.artist, Pitch: item.pitch !== 0 ? (item.pitch > 0 ? '+' : '') + item.pitch : '', Notes: item.notes || '', 'Personal Note': getPersonalNote(item.id) }
      }
      return { '#': idx + 1, Title: item.title, Artist: `[${item.type.toUpperCase()}]`, Pitch: '', Notes: item.notes || '', 'Personal Note': '' }
    })
    const ws = utils.json_to_sheet(data)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Setlist')
    writeFile(wb, `bndstr_setlist_${new Date().toISOString().split('T')[0]}.xlsx`)
  })
}

onMounted(() => {
  songsStore.fetchSongs()
  fetchGigs()
  fetchPersonalNotes()
})
</script>
