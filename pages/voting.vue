<template>
  <div class="px-4 py-8 max-w-7xl mx-auto space-y-8">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center z-10 pt-2 lg:pt-0 w-full">
            <h2 class="text-2xl font-bold">{{ t('voting.heading') }}</h2>
            <div class="flex gap-2">
                <UTooltip :text="t('voting.exportExcel')">
                    <UButton icon="i-heroicons-arrow-down-tray" color="gray" variant="ghost" @click="handleExport" />
                </UTooltip>
                <UTooltip :text="t('voting.suggestSong')">
                    <UButton icon="i-heroicons-plus" color="primary" @click="openAddModal" />
                </UTooltip>
            </div>
        </div>
      </template>

      <!-- Toolbar: sort & filter -->
      <div class="flex justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
         <UInput v-model="searchQuery" icon="i-heroicons-magnifying-glass" :placeholder="t('voting.filterSongs')" class="w-full max-w-sm mr-4" />
         <USelect v-model="sortBy" :options="[{label: t('voting.mostVotes'), value: 'votes'}, {label: t('voting.newest'), value: 'newest'}, {label: t('voting.customOrder'), value: 'custom'}]" class="w-40" />
      </div>
      
      <div v-if="filteredSongs?.length" class="space-y-1">
        <div v-for="song in filteredSongs" :key="song.id" class="flex flex-col p-3 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary/50 transition-colors bg-white dark:bg-gray-900 gap-3">
            <!-- Row 1: Info & Your Vote -->
            <div class="flex items-center gap-4 w-full">
                <!-- Controls (Pin/Reorder) -->
                <div class="flex items-center gap-1 shrink-0 border-r border-gray-100 dark:border-gray-800 pr-2">
                    <div v-if="sortBy === 'custom'" class="flex flex-col gap-0.5">
                        <UButton icon="i-heroicons-chevron-up" color="gray" variant="ghost" size="2xs" class="p-0.5" @click="moveSong(song, -1)" />
                        <UButton icon="i-heroicons-chevron-down" color="gray" variant="ghost" size="2xs" class="p-0.5" @click="moveSong(song, 1)" />
                    </div>
                    <UTooltip :text="song.isPinned ? t('voting.unpinSong') : t('voting.pinSong')">
                        <UButton :icon="song.isPinned ? 'i-heroicons-bookmark-20-solid' : 'i-heroicons-bookmark'" 
                                 :color="song.isPinned ? 'primary' : 'gray'" 
                                 variant="ghost" 
                                 size="xs" 
                                 @click="togglePin(song)" />
                    </UTooltip>
                </div>

                <!-- Thumbnail -->
                <div class="shrink-0">
                    <a v-if="song.spotifyUrl && song.thumbnailUrl" :href="song.spotifyUrl" target="_blank" class="relative group/thumb block">
                        <img :src="song.thumbnailUrl" class="w-12 h-12 rounded shadow-sm border border-gray-100 dark:border-gray-800 object-cover" />
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity rounded">
                            <UIcon name="i-heroicons-play-circle" class="text-white w-5 h-5" />
                        </div>
                    </a>
                    <a v-else-if="song.youtubeUrl && getYouTubeId(song.youtubeUrl)" :href="song.youtubeUrl" target="_blank" class="relative group/thumb block">
                        <img :src="`https://img.youtube.com/vi/${getYouTubeId(song.youtubeUrl)}/mqdefault.jpg`" class="w-12 h-12 rounded shadow-sm border border-gray-100 dark:border-gray-800 object-cover" />
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity rounded">
                            <UIcon name="i-heroicons-play-circle" class="text-white w-5 h-5" />
                        </div>
                    </a>
                    <div v-else class="w-12 h-12 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-gray-400" />
                    </div>
                </div>

                <!-- Title, Artist & Own Voting -->
                <div class="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2">
                            <h3 class="font-bold text-sm lg:text-base leading-tight truncate">{{ song.title }}</h3>
                            <UTooltip v-if="song.notes" :text="song.notes">
                                <UIcon name="i-heroicons-information-circle-solid" class="text-gray-400 w-4 h-4 cursor-help" />
                            </UTooltip>
                        </div>
                        <p class="text-[11px] lg:text-xs text-gray-500 font-medium truncate">{{ song.artist }}</p>
                        <div class="flex gap-2 mt-1">
                            <a v-if="song.spotifyUrl" :href="song.spotifyUrl" target="_blank" class="text-[10px] font-semibold uppercase text-green-500 hover:text-green-600 flex items-center gap-1"><UIcon name="i-heroicons-arrow-top-right-on-square" /> Spotify</a>
                            <a v-if="song.youtubeUrl" :href="song.youtubeUrl" target="_blank" class="text-[10px] font-semibold uppercase text-red-500 hover:text-red-600 flex items-center gap-1"><UIcon name="i-heroicons-arrow-top-right-on-square" /> YouTube</a>
                        </div>
                    </div>

                    <!-- Own Vote Buttons -->
                    <div class="flex items-center gap-1 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-lg self-start md:self-center shrink-0">
                        <UButton v-for="sc in [0, 1, 2, 3]" :key="sc"
                            :label="voteLabel(sc)"
                            :color="song.hasVoted === sc ? voteColor(sc) : 'gray'"
                            :variant="song.hasVoted === sc ? 'solid' : 'ghost'"
                            size="2xs"
                            class="font-bold px-2"
                            @click="toggleVote(song, sc)"
                        />
                    </div>
                </div>

                <!-- Final Actions & Stats -->
                <div class="flex items-center gap-3 shrink-0">
                    <div class="hidden sm:flex flex-col items-end min-w-[50px]">
                        <span class="text-lg font-black text-primary leading-none">{{ Number(song.voteAverage || 0).toFixed(1) }}</span>
                        <span class="text-[9px] text-gray-400 leading-none mt-1 uppercase">{{ song.voteCount }} {{ t('voting.votes') }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                        <UButton v-if="canEdit(song)" icon="i-heroicons-pencil-square" color="gray" variant="ghost" size="xs" @click="openEditModal(song)" />
                        <UButton v-if="userRole === 'admin' || currentUser?.id === song.addedBy" icon="i-heroicons-trash" color="red" variant="ghost" size="xs" @click="deleteSong(song)" />
                    </div>
                </div>
            </div>

            <!-- Row 2: Band Feedback -->
            <div class="flex items-center gap-4 border-t border-gray-100 dark:border-gray-800 pt-2 w-full">
                <div class="flex gap-2 lg:gap-4 overflow-x-auto pb-1 scrollbar-hide">
                    <div v-for="member in bandMembers" :key="member.id" class="flex flex-col items-center gap-1 group">
                        <UAvatar :alt="member.name" size="xs" :class="getMemberVoteClass(song, member.id)" class="ring-2 ring-white dark:ring-gray-900 bg-white transition-transform group-hover:scale-110" />
                        <span class="text-[10px] font-black leading-none" :class="getMemberVoteTextClass(song, member.id)">
                            {{ getMemberVoteScore(song, member.id) }}
                        </span>
                    </div>
                </div>
                
                <div v-if="!song.isSetlist" class="ml-auto">
                    <UTooltip :text="t('voting.sendToSetlist')">
                        <UButton icon="i-heroicons-arrow-right-circle" color="gray" variant="soft" size="xs" @click="openTransferModal(song)" label="Transfer" />
                    </UTooltip>
                </div>
            </div>
        </div>
      </div>
      <div v-else>
          <UAlert :title="t('voting.noSongs')" icon="i-heroicons-information-circle" />
      </div>
    </UCard>
    
    <!-- Song Modal (Add/Edit) -->
    <UModal v-model="isSongModalOpen">
      <UCard>
        <template #header>
           <h3 class="font-bold text-lg">{{ modalSong.id ? t('voting.editSong') : t('voting.suggestNew') }}</h3>
        </template>
        <form @submit.prevent="submitSong" class="space-y-4">
           <!-- Spotify URL first for quick lookup -->
           <UFormGroup :label="t('voting.spotifyUrl')">
              <div class="flex gap-2">
                <UInput 
                  v-model="modalSong.spotifyUrl" 
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
                  :disabled="!modalSong.spotifyUrl"
                  @click="lookupSpotify(true)"
                >
                  {{ t('voting.spotifyLookup') }}
                </UButton>
              </div>
              <p class="text-[11px] text-gray-400 mt-1.5 italic">{{ t('voting.lookupHint') }}</p>
              <p v-if="lookupError" class="text-[11px] text-red-500 mt-1 font-medium">{{ lookupError }}</p>
           </UFormGroup>
 
           <UFormGroup :label="t('voting.songTitle')" required>
              <UInput v-model="modalSong.title" required autofocus />
           </UFormGroup>
           <UFormGroup :label="t('voting.artist')" required>
              <UInput v-model="modalSong.artist" required />
           </UFormGroup>
           <UFormGroup :label="t('voting.youtubeUrl')">
              <UInput v-model="modalSong.youtubeUrl" type="url" placeholder="https://youtube.com/watch?v=..." />
           </UFormGroup>
           <UFormGroup :label="t('voting.notes')">
              <UTextarea v-model="modalSong.notes" autoresize placeholder="Optional notes for other members..." />
           </UFormGroup>
           <div class="flex justify-end gap-3 mt-8">
               <UButton color="gray" variant="ghost" @click="isSongModalOpen = false">{{ t('common.cancel') }}</UButton>
               <UButton type="submit" color="primary" :loading="isSubmitting">
                 {{ modalSong.id ? t('voting.updateBtn') : t('voting.suggestSong') }}
               </UButton>
           </div>
        </form>
      </UCard>
    </UModal>
    <!-- Transfer Modal -->
    <UModal v-model="isTransferModalOpen">
      <UCard>
        <template #header>
           <h3 class="font-bold text-lg">{{ t('voting.sendToSetlist') }}</h3>
        </template>
        <div v-if="songToTransfer" class="space-y-4">
           <p>{{ t('voting.confirmTransfer', { title: songToTransfer.title, artist: songToTransfer.artist }) }}</p>
           <p class="text-sm text-gray-500">{{ t('voting.currentScore', { score: Number(songToTransfer.voteAverage || 0).toFixed(1) }) }}</p>
           <div class="flex justify-end gap-3 mt-8">
               <UButton color="gray" variant="ghost" @click="isTransferModalOpen = false">{{ t('common.cancel') }}</UButton>
               <UButton color="primary" @click="transferToSetlist">{{ t('voting.confirmBtn') }}</UButton>
           </div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const config = useRuntimeConfig();

useHead({ title: computed(() => t('voting.title')) });

const { data: session } = useAuth();

const { data: songs, refresh } = await useFetch('/api/songs');
const { data: usersData } = await useFetch('/api/users');

const bandMembers = computed(() => Array.isArray(usersData.value) ? usersData.value.filter(u => !u.isHidden) : []);

const searchQuery = ref('');
const sortBy = ref('newest');

const isSongModalOpen = ref(false);
const isSubmitting = ref(false);
const modalSong = ref({ id: null as number | null, title: '', artist: '', spotifyUrl: '', youtubeUrl: '', notes: '' });

const isTransferModalOpen = ref(false);
const songToTransfer = ref<any>(null);

const votingId = ref<number | null>(null);

function openTransferModal(song: any) {
    songToTransfer.value = song;
    isTransferModalOpen.value = true;
}

function openAddModal() {
    modalSong.value = { id: null, title: '', artist: '', spotifyUrl: '', youtubeUrl: '', notes: '' };
    isSongModalOpen.value = true;
}

function openEditModal(song: any) {
    modalSong.value = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        spotifyUrl: song.spotifyUrl,
        youtubeUrl: song.youtubeUrl,
        notes: song.notes
    };
    isSongModalOpen.value = true;
}

const currentUser = computed(() => {
    if (config.public.devMode) return { id: 2, name: 'Chris', email: 'chris@example.org', role: 'admin' };
    return (session.value?.user as any);
});

const userRole = computed(() => {
    return currentUser.value?.role || 'user';
});

function canEdit(song: any) {
    if (userRole.value === 'admin') return true;
    return currentUser.value?.id === song.addedBy;
}

const filteredSongs = computed(() => {
    let list = Array.isArray(songs.value) ? songs.value.filter(s => s.type !== 'pause' && s.type !== 'tuning' && !s.isSetlist) : [];
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter((s:any) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
    }
    
    // Sort logic
    if (sortBy.value === 'votes') {
        list = [...list].sort((a:any, b:any) => (b.voteAverage || 0) - (a.voteAverage || 0));
    } else if (sortBy.value === 'custom') {
        // Sort by Pinned First, then ascending Position
        list = [...list].sort((a:any, b:any) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return a.position - b.position;
        });
    } else {
        list = [...list].sort((a:any, b:any) => b.id - a.id);
    }
    return list;
});

function voteLabel(score: number) {
    if (score === 0) return t('voting.veto');
    if (score === 1) return t('voting.ok');
    if (score === 2) return t('voting.good');
    return t('voting.great');
}

function voteColor(score: number): any {
    if (score === 0) return 'red';
    if (score === 1) return 'orange';
    if (score === 2) return 'primary';
    return 'green';
}

function getMemberVoteClass(song: any, userId: number) {
    const vote = song.allVotes?.find((v:any) => v.userId === userId);
    if (!vote || vote.score === null || vote.score === undefined) return 'ring-1 ring-gray-300 dark:ring-gray-700 opacity-40 grayscale';
    if (vote.score === 0) return 'ring-2 ring-red-500';
    if (vote.score === 1) return 'ring-2 ring-orange-500';
    if (vote.score === 2) return 'ring-2 ring-primary-500';
    if (vote.score === 3) return 'ring-2 ring-green-500';
    return '';
}

function getMemberVoteTextClass(song: any, userId: number) {
    const vote = song.allVotes?.find((v:any) => v.userId === userId);
    if (!vote || vote.score === null || vote.score === undefined) return 'text-gray-400 opacity-50';
    if (vote.score === 0) return 'text-red-500';
    if (vote.score === 1) return 'text-orange-500';
    if (vote.score === 2) return 'text-primary-500';
    if (vote.score === 3) return 'text-green-500';
    return '';
}

function getMemberVoteValue(song: any, userId: number) {
    const vote = song.allVotes?.find((v:any) => v.userId === userId);
    if (!vote || vote.score === null || vote.score === undefined) return '-';
    // Return text representation
    if (vote.score === 0) return t('voting.veto');
    if (vote.score === 1) return t('voting.ok');
    if (vote.score === 2) return t('voting.good');
    if (vote.score === 3) return t('voting.great');
    return '-';
}

function getMemberVoteScore(song: any, userId: number) {
    const vote = song.allVotes?.find((v:any) => v.userId === userId);
    if (!vote || vote.score === null || vote.score === undefined) return '-';
    return vote.score.toString();
}

function getSpotifyTrackId(url: string | null | undefined) {
    if (!url) return null;
    const match = url.match(/track[\/:]([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

function getYouTubeId(url: string | null | undefined) {
    if (!url) return null;
    let match = url.match(/v=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    return null;
}

const isLookingUp = ref(false);
const lookupError = ref('');

async function lookupSpotify(force = true) {
    const url = modalSong.value.spotifyUrl;
    if (!url || !url.includes('spotify.com')) return;
    
    // If not forced (e.g. auto-paste), skip if both fields are already filled
    if (!force && modalSong.value.title && modalSong.value.artist) return;
    
    isLookingUp.value = true;
    lookupError.value = '';
    
    console.log('[Spotify Lookup v3] Triggered for:', url);
    
    try {
        // Use our server-side proxy to avoid CORS and fetch-level issues
        const data = await $fetch('/api/songs/lookup', {
            params: { url }
        });
        
        console.log('[Spotify Lookup v3] Data received:', data);
        
        if (data && typeof data === 'object') {
            const castedData = data as { title?: string, author_name?: string };
            if (castedData.title) {
                // On explicit click (force), always overwrite. On paste, only fill if empty
                if (force || !modalSong.value.title) {
                    modalSong.value.title = castedData.title;
                }
            }
            if (castedData.author_name) {
                if (force || !modalSong.value.artist) {
                    modalSong.value.artist = castedData.author_name;
                }
            }
        } else {
            lookupError.value = t('voting.lookupFailed');
        }
    } catch (e: any) {
        console.warn('[Spotify Lookup v3] Failed:', e);
        lookupError.value = t('voting.lookupFailed');
    } finally {
        isLookingUp.value = false;
    }
}

function onSpotifyPaste(event: ClipboardEvent) {
    // Wait a tick for v-model to update, then auto-lookup
    setTimeout(() => {
        lookupSpotify(false);
    }, 100);
}

async function submitSong() {
    isSubmitting.value = true;
    try {
        if (modalSong.value.id) {
            await $fetch(`/api/songs/${modalSong.value.id}`, {
                method: 'PUT',
                body: modalSong.value
            });
        } else {
            await $fetch('/api/songs', {
                method: 'POST',
                body: modalSong.value
            });
        }
        isSongModalOpen.value = false;
        modalSong.value = { id: null, title: '', artist: '', spotifyUrl: '', youtubeUrl: '' };
        await refresh();
    } catch (e: any) {
        console.error(e);
        alert(e.data?.error || t('voting.failedAdd'));
    } finally {
        isSubmitting.value = false;
    }
}

async function toggleVote(song: any, score: number) {
    if (votingId.value) return;
    votingId.value = song.id;
    try {
        const wantsToRemove = song.hasVoted === score;
        await $fetch('/api/votes', {
            method: 'POST',
            body: {
                songId: song.id,
                score: wantsToRemove ? undefined : score,
                remove: wantsToRemove
            }
        });
        await refresh();
    } catch (e: any) {
        console.error(e);
        alert(e.data?.error || t('voting.failedVote'));
    } finally {
        votingId.value = null;
    }
}

async function transferToSetlist() {
    if(!songToTransfer.value) return;
    try {
        await $fetch(`/api/songs/${songToTransfer.value.id}`, {
            method: 'PUT',
            body: { isSetlist: true }
        });
        isTransferModalOpen.value = false;
        await refresh();
    } catch (e: any) {
        alert(t('voting.failedTransfer'));
    }
}

async function deleteSong(song: any) {
    if(!confirm(t('voting.failedDelete', { title: song.title }))) return;
    try {
        await $fetch(`/api/songs/${song.id}`, { method: 'DELETE' });
        await refresh();
    } catch(e) {
        alert(t('voting.failedDeleteMsg'));
    }
}

const { exportToExcel } = useExcelExport();
function handleExport() {
    const data = filteredSongs.value.map((song: any) => {
        const row: any = {
            'Title': song.title,
            'Artist': song.artist,
            'Average': Number(song.voteAverage || 0).toFixed(1),
            'Votes': song.voteCount,
            'Status': song.isPinned ? 'PINNED' : ''
        };
        
        // Add member votes
        bandMembers.value.forEach((member: any) => {
            row[member.name] = getMemberVoteValue(song, member.id);
        });
        
        return row;
    });
    exportToExcel(data, `bndstr_voting_${new Date().toISOString().split('T')[0]}`);
}
</script>
