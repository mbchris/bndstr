<template>
  <div class="px-4 py-8 max-w-7xl mx-auto space-y-8">
    <UCard>
      <template #header>
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            <div class="flex items-center gap-2">
                <h2 class="text-2xl font-bold">{{ t('setlist.heading') }}</h2>
                <USelectMenu v-model="selectedGigId" :options="[{label: 'Master Setlist', value: null}, ...gigOptions]" value-attribute="value" option-attribute="label" class="w-48 ml-4 lg:ml-8" />
            </div>
            <div class="flex gap-2">
                <UTooltip :text="t('setlist.exportExcel')"><UButton icon="i-heroicons-arrow-down-tray" color="gray" variant="ghost" @click="handleExport" /></UTooltip>
                <UTooltip :text="t('setlist.addPause')"><UButton icon="i-heroicons-clock" color="gray" variant="soft" @click="openSpecialModal('pause')" /></UTooltip>
                <UTooltip :text="t('setlist.changeTuning')"><UButton icon="i-heroicons-swatch" color="gray" variant="soft" @click="openSpecialModal('tuning')" /></UTooltip>
                <UTooltip :text="t('voting.suggestSong')"><UButton icon="i-heroicons-plus" color="primary" @click="openAddSongModal" /></UTooltip>
            </div>
        </div>
      </template>

      <!-- Toolbar: filter -->
      <div class="flex justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
         <UInput v-model="searchQuery" icon="i-heroicons-magnifying-glass" :placeholder="t('setlist.filterTitle')" class="w-full max-sm mr-4" />
         <USelect v-model="sortBy" :options="[{label: t('setlist.orderCustom'), value: 'custom'}, {label: t('setlist.orderTitle'), value: 'title'}, {label: t('setlist.orderArtist'), value: 'artist'}]" class="w-40" />
      </div>

       <div v-if="filteredSongs?.length" class="space-y-1">
          <div v-for="(item, index) in filteredSongs" :key="item.id" 
               class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-2 border border-gray-200 dark:border-gray-800 rounded-lg transition-all bg-white dark:bg-gray-900 group gap-2 lg:gap-4"
               :class="[
                   item.isPinned ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : '',
                   item.type !== 'song' ? 'border-dashed opacity-80' : ''
               ]">
            
            <div class="flex flex-row lg:flex-col items-center gap-2">
                <!-- Reorder Controls -->
                <div v-if="sortBy === 'custom'" class="flex lg:flex-col gap-1 items-center justify-center">
                    <UButton icon="i-heroicons-chevron-up" color="gray" variant="ghost" size="xs" class="p-0.5" :disabled="index === 0" @click="moveItem(index, -1)" />
                    <span class="text-[10px] font-bold text-gray-400 hidden lg:inline">{{ index + 1 }}</span>
                    <UButton icon="i-heroicons-chevron-down" color="gray" variant="ghost" size="xs" class="p-0.5" :disabled="index === filteredSongs.length - 1" @click="moveItem(index, 1)" />
                </div>
                
                <!-- Pin Control -->
                <UTooltip :text="item.isPinned ? t('setlist.unpin') : t('setlist.pin')">
                    <UButton 
                    :icon="item.isPinned ? 'i-heroicons-lock-closed' : 'i-heroicons-lock-open'" 
                    :color="item.isPinned ? 'primary' : 'gray'" 
                    variant="ghost" 
                    class="px-2" 
                    @click="togglePin(item)" 
                    />
                </UTooltip>
            </div>

            <!-- Main Content -->
            <div class="flex-1 min-w-0 w-full flex flex-col justify-center">
                <div v-if="item.type === 'song'" class="flex items-center gap-4">
                    <a v-if="item.spotifyUrl && item.thumbnailUrl" :href="item.spotifyUrl" target="_blank" class="flex-shrink-0 relative group/thumb">
                        <img :src="item.thumbnailUrl" class="w-12 h-12 rounded shadow-sm border border-gray-100 dark:border-gray-800 object-cover" />
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity rounded">
                            <UIcon name="i-heroicons-play-circle" class="text-white w-5 h-5" />
                        </div>
                    </a>
                    <a v-else-if="item.youtubeUrl && getYouTubeId(item.youtubeUrl)" :href="item.youtubeUrl" target="_blank" class="flex-shrink-0 relative group/thumb">
                         <img :src="`https://img.youtube.com/vi/${getYouTubeId(item.youtubeUrl)}/mqdefault.jpg`" class="w-12 h-12 rounded shadow-sm border border-gray-100 dark:border-gray-800 object-cover" />
                         <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity rounded">
                            <UIcon name="i-heroicons-play-circle" class="text-white w-5 h-5" />
                        </div>
                    </a>
                    <div v-else class="w-12 h-12 flex-shrink-0 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-gray-400" />
                    </div>

                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <h3 class="font-bold text-sm lg:text-base leading-tight truncate">{{ item.title }}</h3>
                            <div class="flex items-center gap-2 shrink-0">
                                <UButton 
                                    v-if="item.notes" 
                                    icon="i-heroicons-information-circle-20-solid" 
                                    color="gray" 
                                    variant="ghost" 
                                    size="xl"
                                    class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full" 
                                    @click="showNote(item.title, item.notes)"
                                />
                                <UButton 
                                    v-if="getPersonalNote(item.id)" 
                                    icon="i-heroicons-user-circle-20-solid" 
                                    color="primary" 
                                    variant="ghost" 
                                    size="xl"
                                    class="p-1 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-full" 
                                    @click="showNote(t('setlist.personalNotes') + ': ' + item.title, getPersonalNote(item.id))"
                                />
                            </div>
                        </div>
                        <p class="text-[11px] lg:text-xs text-gray-500 font-medium truncate mb-0.5">{{ item.artist }}</p>
                        <div class="flex gap-2 flex-wrap">
                            <a v-if="item.spotifyUrl" :href="item.spotifyUrl" target="_blank" class="text-[10px] font-semibold uppercase text-green-500 hover:text-green-600 flex items-center gap-1"><UIcon name="i-heroicons-arrow-top-right-on-square" /> Spotify</a>
                            <a v-if="item.youtubeUrl" :href="item.youtubeUrl" target="_blank" class="text-[10px] font-semibold uppercase text-red-500 hover:text-red-600 flex items-center gap-1"><UIcon name="i-heroicons-arrow-top-right-on-square" /> YouTube</a>
                            <span v-if="item.pitch !== 0" class="text-[10px] font-bold uppercase text-orange-500 border border-orange-500/30 px-1 rounded">Pitch: {{ item.pitch > 0 ? '+' : '' }}{{ item.pitch }}</span>
                        </div>
                    </div>
                </div>
                <div v-else-if="item.type === 'pause'" class="italic text-gray-500 flex items-center gap-2 py-2">
                    <UIcon name="i-heroicons-pause-circle" class="w-5 h-5" /> 
                    <span class="font-semibold text-sm">{{ item.title }}</span>
                    <UButton 
                        v-if="item.notes" 
                        icon="i-heroicons-information-circle-20-solid" 
                        color="gray" 
                        variant="ghost" 
                        size="xl"
                        class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full" 
                        @click="showNote(item.title, item.notes)"
                    />
                </div>
                <div v-else-if="item.type === 'tuning'" class="italic text-orange-500 flex items-center gap-2 py-2">
                    <UIcon name="i-heroicons-swatch" class="w-5 h-5" /> 
                    <span class="font-semibold text-sm">{{ item.title }}</span>
                    <UButton 
                        v-if="item.notes" 
                        icon="i-heroicons-information-circle-20-solid" 
                        color="gray" 
                        variant="ghost" 
                        size="xl"
                        class="p-1 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-full" 
                        @click="showNote(item.title, item.notes)"
                    />
                </div>
            </div>
            
            <!-- Actions -->
            <div class="flex items-center gap-2 justify-end self-end lg:self-center">
                <UButton icon="i-heroicons-adjustments-horizontal" color="gray" variant="ghost" size="xs" @click="openEditModal(item)" />
                <UTooltip v-if="item.type === 'song'" :text="t('setlist.moveToVoting')">
                    <UButton icon="i-heroicons-arrow-left-circle" color="gray" variant="ghost" size="xs" @click="removeFromSetlist(item)" />
                </UTooltip>
                <UButton v-else icon="i-heroicons-x-mark" color="red" variant="ghost" size="xs" @click="removeFromSetlist(item)" />
            </div>
         </div>
      </div>
      <div v-else class="text-center py-8 text-gray-500">
           {{ t('setlist.noItems') }}
      </div>
    </UCard>
    
    <UModal v-model="isAddSongModalOpen">
      <UCard>
        <template #header>
           <h3 class="font-bold text-lg">Add New Song to Master Setlist</h3>
        </template>
        <div class="space-y-4">
           <UFormGroup :label="t('voting.songTitle')" required>
               <UInput v-model="addSongForm.title" autofocus />
           </UFormGroup>
           <UFormGroup :label="t('voting.artist')" required>
               <UInput v-model="addSongForm.artist" />
           </UFormGroup>
           <div class="flex justify-end gap-3 mt-8">
               <UButton color="gray" variant="ghost" @click="isAddSongModalOpen = false">{{ t('common.cancel') }}</UButton>
               <UButton color="primary" @click="submitAddSong" :loading="isSaving">Add Song</UButton>
           </div>
        </div>
      </UCard>
    </UModal>
    
    <UModal v-model="isAddGigSongModalOpen" v-if="selectedGigId">
      <UCard>
        <template #header>
           <h3 class="font-bold text-lg">Add Master Songs to Gig Setlist</h3>
        </template>
        <div class="space-y-4">
           <UFormGroup label="Select Songs from Master Setlist" required>
               <USelectMenu v-model="selectedMasterSongIds" :options="masterSongOptions" value-attribute="value" option-attribute="label" searchable multiple placeholder="Select songs..." />
           </UFormGroup>
           <div class="flex gap-2">
               <UButton size="xs" color="gray" variant="soft" @click="selectedMasterSongIds = masterSongOptions.map(o => o.value)">Select All</UButton>
               <UButton size="xs" color="gray" variant="soft" @click="selectedMasterSongIds = []">Select None</UButton>
           </div>
           <div class="flex justify-end gap-3 mt-8">
               <UButton color="gray" variant="ghost" @click="isAddGigSongModalOpen = false">{{ t('common.cancel') }}</UButton>
               <UButton color="primary" @click="submitAddGigSong" :loading="isSaving" :disabled="!selectedMasterSongIds.length">Add to Gig</UButton>
           </div>
        </div>
       </UCard>
    </UModal>
    
    <UModal v-model="isNoteModalOpen">
      <UCard>
        <template #header>
            <div class="flex items-center justify-between">
                <h3 class="font-bold text-lg">{{ noteModalTitle }}</h3>
                <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" @click="isNoteModalOpen = false" />
            </div>
        </template>
        <div class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg min-h-[100px]">
            <Markdown v-if="noteModalContent" :content="noteModalContent" class="text-base prose dark:prose-invert max-w-none" />
            <div v-else class="text-gray-400 italic flex flex-col items-center justify-center py-8">
                <UIcon name="i-heroicons-document-text" class="w-12 h-12 mb-2 opacity-10" />
                {{ t('setlist.noItems') || 'Empty note' }}
            </div>
        </div>
        <template #footer>
            <div class="flex justify-end">
                <UButton color="gray" variant="soft" @click="isNoteModalOpen = false">{{ t('common.close') || 'Close' }}</UButton>
            </div>
        </template>
      </UCard>
    </UModal>

    <!-- Edit Song Modal -->
    <UModal v-model="isEditModalOpen">
      <UCard v-if="editingItem">
        <template #header>
           <h3 class="font-bold text-lg">Edit: {{ editingItem.title }}</h3>
        </template>
        <div class="space-y-4">
           <UFormGroup v-if="editingItem.type === 'song'" :label="t('voting.spotifyUrl')">
              <div class="flex gap-2">
                <UInput 
                  v-model="editingItem.spotifyUrl" 
                  type="url" 
                  placeholder="https://open.spotify.com/track/..." 
                  class="flex-1"
                  @paste="onSpotifyPaste"
                />
                <UButton 
                  type="button"
                  color="green" 
                  variant="soft" 
                  icon="i-heroicons-magnifying-glass"
                  :loading="isLookingUp"
                  :disabled="!editingItem.spotifyUrl"
                  @click="lookupSpotify(true)"
                >
                  {{ t('voting.spotifyLookup') }}
                </UButton>
              </div>
              <p class="text-[11px] text-gray-400 mt-1.5 italic">{{ t('voting.lookupHint') }}</p>
              <p v-if="lookupError" class="text-[11px] text-red-500 mt-1 font-medium">{{ lookupError }}</p>
           </UFormGroup>

           <UFormGroup v-if="editingItem.type === 'song'" :label="t('voting.songTitle')" required>
               <UInput v-model="editingItem.title" required />
           </UFormGroup>
           <UFormGroup v-if="editingItem.type === 'song'" :label="t('voting.artist')" required>
               <UInput v-model="editingItem.artist" required />
           </UFormGroup>
           <UFormGroup v-if="editingItem.type === 'song'" :label="t('voting.youtubeUrl')">
               <UInput v-model="editingItem.youtubeUrl" type="url" placeholder="https://youtube.com/watch?v=..." />
           </UFormGroup>
           
           <UFormGroup v-if="editingItem.type === 'song'" label="Pitch Shift (Semi-tones)">
               <div class="flex items-center gap-4">
                   <URange v-model="editingItem.pitch" :min="-5" :max="5" :step="1" class="flex-1" />
                   <div class="w-12 text-center font-bold text-lg border rounded bg-gray-50 dark:bg-gray-800 p-1">{{ editingItem.pitch > 0 ? '+' : '' }}{{ editingItem.pitch }}</div>
               </div>
           </UFormGroup>
           <UFormGroup label="Notes (For Setlist view)">
              <UTextarea v-model="editingItem.notes" autoresize />
           </UFormGroup>

           <UFormGroup :label="t('setlist.personalNotes')" :help="t('setlist.personalNotesHint')">
              <UTextarea v-model="editingItemPersonalNote" autoresize />
           </UFormGroup>
           
           <div class="flex justify-end gap-3 mt-8">
               <UButton color="gray" variant="ghost" @click="isEditModalOpen = false">{{ t('common.cancel') }}</UButton>
               <UButton type="button" color="primary" @click="saveItemEdit" :loading="isSaving">{{ t('setlist.saveChanges') }}</UButton>
           </div>
        </div>
      </UCard>
    </UModal>
    
    <!-- Special Element Modal (Pause/Tuning) -->
    <UModal v-model="isSpecialModalOpen">
      <UCard v-if="specialElementForm">
        <template #header>
            <h3 class="font-bold text-lg">{{ specialElementForm.type === 'pause' ? t('setlist.addPause') : t('setlist.changeTuning') }}</h3>
        </template>
        <div class="space-y-4">
            <UFormGroup :label="t('voting.songTitle')" required>
                <UInput v-model="specialElementForm.title" autofocus />
            </UFormGroup>
            <UFormGroup :label="t('voting.notes')">
                <UTextarea v-model="specialElementForm.notes" autoresize />
            </UFormGroup>
            <div class="flex justify-end gap-3 mt-8">
                <UButton color="gray" variant="ghost" @click="isSpecialModalOpen = false">{{ t('common.cancel') }}</UButton>
                <UButton color="primary" @click="submitSpecialElement" :loading="isSaving">{{ t('common.save') }}</UButton>
            </div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

useHead({ title: computed(() => t('setlist.title')) });

const selectedGigId = ref<number | null>(null);
const { data: gigsData } = await useFetch<any[]>('/api/gigs');
const gigOptions = computed(() => Array.isArray(gigsData.value) ? gigsData.value.map(g => {
    let dateStr = '';
    if (g.startTime) {
        try {
            dateStr = new Date(g.startTime).toISOString().split('T')[0];
        } catch (e) {}
    }
    return { label: dateStr ? `${dateStr} ${g.title}` : g.title, value: g.id };
}) : []);
const { data: songs, refresh: refreshSongs } = await useFetch<any[]>(() => {
    const id = (selectedGigId.value !== null && selectedGigId.value !== 'null') ? selectedGigId.value : null;
    return id ? `/api/gigs/${id}/songs` : '/api/songs';
}, {
    watch: [selectedGigId]
});

watch(selectedGigId, (newVal) => {
    if (newVal === 'null' || newVal === '') selectedGigId.value = null;
});
function songItemId(item: any) { return item.id; }
const { data: personalNotes, refresh: refreshNotes } = await useFetch<any[]>('/api/songs/notes');

async function refresh() {
    await Promise.all([refreshSongs(), refreshNotes()]);
}

const searchQuery = ref('');
const sortBy = ref('custom');
const isEditModalOpen = ref(false);
const editingItem = ref<any>(null);
const isSaving = ref(false);
const isLookingUp = ref(false);
const lookupError = ref('');
const editingItemPersonalNote = ref('');
const isAddSongModalOpen = ref(false);

const isNoteModalOpen = ref(false);
const noteModalTitle = ref('');
const noteModalContent = ref('');

function showNote(title: string, content: string) {
    noteModalTitle.value = title;
    noteModalContent.value = content;
    isNoteModalOpen.value = true;
}

const addSongForm = ref({ title: '', artist: '', spotifyUrl: '' });
function openAddSongModal() {
    if (selectedGigId.value) {
        isAddGigSongModalOpen.value = true;
    } else {
        addSongForm.value = { title: '', artist: '', spotifyUrl: '' };
        isAddSongModalOpen.value = true;
    }
}
async function submitAddSong() {
    isSaving.value = true;
    try {
        await $fetch('/api/songs', {
            method: 'POST',
            body: { ...addSongForm.value, position: filteredSongs.value.length, isSetlist: true }
        });
        isAddSongModalOpen.value = false;
        await refresh();
    } catch(e) { alert('Failed to add master song'); }
    finally { isSaving.value = false; }
}

const isAddGigSongModalOpen = ref(false);
const selectedMasterSongIds = ref<number[]>([]);
const { data: masterSongsData } = await useFetch<any[]>('/api/songs');
const masterSongOptions = computed(() => {
    return Array.isArray(masterSongsData.value) ? masterSongsData.value.filter(s => s.type === 'song' && s.isSetlist).map(s => ({label: s.title + ' - ' + s.artist, value: s.id})) : [];
});
async function submitAddGigSong() {
    isSaving.value = true;
    try {
        for (let i = 0; i < selectedMasterSongIds.value.length; i++) {
            const selection = selectedMasterSongIds.value[i];
            // Nuxt UI might bind the whole object instead of just the value, even with value-attribute
            const extractedId = (typeof selection === 'object' && selection !== null) ? (selection as any).value : selection;
            
            await $fetch('/api/gigs/' + selectedGigId.value + '/songs', {
                method: 'POST',
                body: { songId: extractedId, position: filteredSongs.value.length + i }
            });
        }
        isAddGigSongModalOpen.value = false;
        selectedMasterSongIds.value = [];
        await refresh();
    } catch(e: any) { 
        console.error(e);
        alert('Failed to add songs to gig: ' + e.message); 
    }
    finally { isSaving.value = false; }
}

function getPersonalNote(songId: number) {
    if (!personalNotes.value) return '';
    const note = personalNotes.value.find((n: any) => n.songId === songId);
    return note ? note.content : '';
}

const isSpecialModalOpen = ref(false);
const specialElementForm = ref<{type: 'pause' | 'tuning', title: string, notes: string} | null>(null);

const filteredSongs = computed(() => {
    let list = Array.isArray(songs.value) ? songs.value.filter((s:any) => (selectedGigId.value !== null && selectedGigId.value !== 'null') ? true : s.isSetlist) : [];
    
    if (sortBy.value === 'title') {
        list = [...list].sort((a:any, b:any) => a.title.localeCompare(b.title));
    } else if (sortBy.value === 'artist') {
        list = [...list].sort((a:any, b:any) => (a.artist || '').localeCompare(b.artist || ''));
    } else {
        // default custom drag sort: Pinned first, then by position
        list = [...list].sort((a:any, b:any) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return a.position - b.position;
        });
    }
    
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter((s:any) => s.title.toLowerCase().includes(q) || (s.artist && s.artist.toLowerCase().includes(q)));
    }
    
    return list;
});

function getSpotifyTrackId(url: string | null | undefined) {
    if (!url) return null;
    const match = url.match(/track[\/:]([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

function openSpecialModal(type: 'pause' | 'tuning') {
    specialElementForm.value = {
        type,
        title: type === 'pause' ? t('setlist.breakPause') : t('setlist.tuningChange'),
        notes: ''
    };
    isSpecialModalOpen.value = true;
}

async function submitSpecialElement() {
    if(!specialElementForm.value) return;
    isSaving.value = true;
    
    const newPos = filteredSongs.value.length;
    
    try {
        await $fetch('/api/songs', {
            method: 'POST',
            body: {
                title: specialElementForm.value.title,
                artist: 'Band',
                type: specialElementForm.value.type,
                notes: specialElementForm.value.notes,
                position: newPos,
                isSetlist: true
            }
        });
        isSpecialModalOpen.value = false;
        await refresh();
    } catch(e) {
        alert(t('setlist.failedAdd') + ' ' + specialElementForm.value.type);
    } finally {
        isSaving.value = false;
    }
}

async function removeFromSetlist(item: any) {
    if(!confirm(t('setlist.removeConfirm', { title: item.title }))) return;
    try {
        if(item.type !== 'song') {
            // Delete pauses/tunings completely
            await $fetch(`/api/songs/${item.id}`, { method: 'DELETE' });
        } else {
            // Just unflag songs
            await $fetch(`/api/songs/${item.id}`, { method: 'PUT', body: { isSetlist: false } });
        }
        await refresh();
    } catch(e) {
        alert(t('setlist.failedRemove'));
    }
}

async function moveItem(index: number, direction: number) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= filteredSongs.value.length) return;
    
    // We construct a shallow copy to manipulate array order visually
    const items = [...filteredSongs.value];
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;
    
    // Update positions functionally
    const updates = items.map((itm: any, idx: number) => ({ id: itm.id, position: idx }));
    
    try {
        // optimistically mutate local state to prevent bouncing
        if(songs.value){
           (songs.value as any[]).forEach((s:any) => {
               const found = updates.find(u => u.id === s.id);
               if(found) s.position = found.position;
           });
        }
        if (selectedGigId.value) {
            await $fetch(`/api/gigs/${selectedGigId.value}/songs/reorder`, { method: 'POST', body: updates });
        } else {
            await $fetch('/api/songs/reorder', { method: 'POST', body: updates });
        }
    } catch(e) {
        alert(t('setlist.failedReorder'));
        await refresh();
    }
}

async function togglePin(item: any) {
    try {
        await $fetch(`/api/songs/${item.id}`, { method: 'PUT', body: { isPinned: !item.isPinned } });
        await refresh();
    } catch(e) {
        alert(t('setlist.failedPin'));
    }
}

async function lookupSpotify(force = true) {
    if(!editingItem.value) return;
    const url = editingItem.value.spotifyUrl;
    if (!url || !url.includes('spotify.com')) return;
    
    // If not forced (e.g. auto-paste), skip if both fields are already filled
    if (!force && editingItem.value.title && editingItem.value.artist) return;
    
    isLookingUp.value = true;
    lookupError.value = '';
    
    try {
        const data: any = await $fetch('/api/songs/lookup', {
            params: { url }
        });
        
        if (data && typeof data === 'object') {
            if (data.title) {
                if (force || !editingItem.value.title) {
                    editingItem.value.title = data.title;
                }
            }
            if (data.author_name) {
                if (force || !editingItem.value.artist) {
                    editingItem.value.artist = data.author_name;
                }
            }
        } else {
            lookupError.value = t('voting.lookupFailed');
        }
    } catch (e: any) {
        lookupError.value = t('voting.lookupFailed');
    } finally {
        isLookingUp.value = false;
    }
}

function onSpotifyPaste(event: ClipboardEvent) {
    setTimeout(() => {
        lookupSpotify(false);
    }, 100);
}

function openEditModal(item: any) {
    editingItem.value = { ...item };
    editingItemPersonalNote.value = getPersonalNote(item.id);
    isEditModalOpen.value = true;
}

async function saveItemEdit() {
    isSaving.value = true;
    try {
        await $fetch(`/api/songs/${editingItem.value.id}`, {
            method: 'PUT',
            body: { 
               title: editingItem.value.title,
               artist: editingItem.value.artist,
               spotifyUrl: editingItem.value.spotifyUrl,
               youtubeUrl: editingItem.value.youtubeUrl,
               pitch: editingItem.value.pitch, 
               notes: editingItem.value.notes 
            }
        });
        
        // Save personal note if it changed
        const currentNote = getPersonalNote(editingItem.value.id);
        if (editingItemPersonalNote.value !== currentNote) {
            await $fetch('/api/songs/notes', {
                method: 'POST',
                body: {
                    songId: editingItem.value.id,
                    content: editingItemPersonalNote.value
                }
            });
        }

        isEditModalOpen.value = false;
        await refresh();
    } catch (e) {
        alert(t('setlist.failedSave'));
    } finally {
        isSaving.value = false;
    }
}

function getYouTubeId(url: string | null | undefined) {
    if (!url) return null;
    let match = url.match(/v=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    return null;
}

const { exportToExcel } = useExcelExport();
function handleExport() {
    const data = filteredSongs.value.map((item: any, idx: number) => {
        if (item.type === 'song') {
            return {
                '#': idx + 1,
                'Title': item.title,
                'Artist': item.artist,
                'Pitch': item.pitch !== 0 ? (item.pitch > 0 ? '+' : '') + item.pitch : '',
                'Notes': item.notes || '',
                'Personal Note': getPersonalNote(item.id)
            };
        } else {
            return {
                '#': idx + 1,
                'Title': item.title,
                'Artist': `[${item.type.toUpperCase()}]`,
                'Pitch': '',
                'Notes': item.notes || '',
                'Personal Note': ''
            };
        }
    });
    exportToExcel(data, `bndstr_setlist_${new Date().toISOString().split('T')[0]}`);
}
</script>
