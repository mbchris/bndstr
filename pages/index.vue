<template>
  <div class="page-home max-w-7xl mx-auto px-4 py-12 space-y-16">

    <!-- Quick Info Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Next Rehearsal Card -->
        <UCard v-if="rehearsalData?.nextRehearsal" class="hover:border-primary/30 transition-colors">
            <template #header>
                <div class="flex flex-col gap-2">
                    <div class="flex justify-between items-start">
                        <h3 class="font-bold text-xl flex items-center gap-2 text-primary">
                            <UIcon name="i-heroicons-musical-note" /> {{ t('home.nextRehearsal') }}
                        </h3>
                        <UButton 
                            v-if="userRole === 'admin'" 
                            icon="i-heroicons-pencil-square" 
                            size="xs" 
                            color="gray" 
                            variant="soft" 
                            @click="openRehearsalEdit" 
                            class="flex-shrink-0"
                        />
                    </div>
                    <div class="text-2xl font-black text-gray-800 dark:text-gray-100 flex items-center">
                        <UIcon name="i-heroicons-calendar" class="w-6 h-6 mr-2 opacity-50 text-primary" />
                        {{ formatDate(rehearsalData.nextRehearsal.startTime) }}
                    </div>
                </div>
            </template>
            <div class="space-y-6">
                <!-- Unavailability Warning moved here -->
                <div v-if="rehearsalData.nextRehearsal.unavailabilities?.length" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <div class="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm mb-1">
                        <UIcon name="i-heroicons-exclamation-triangle" /> {{ t('home.unavailTitle') }}
                    </div>
                    <p class="text-xs text-red-500">
                        {{ rehearsalData.nextRehearsal.unavailabilities.map(u => u.userName).join(', ') }} {{ rehearsalData.nextRehearsal.unavailabilities.length === 1 ? t('home.unavailSingle') : t('home.unavailMulti') }}
                    </p>
                </div>

                <div>
                    <p class="text-3xl font-black tracking-tight">
                        {{ formatTime(rehearsalData.nextRehearsal.startTime) }}
                    </p>
                    <Markdown :content="rehearsalData.nextRehearsal.description || t('rehearsal.generalPractice')" class="text-gray-500 mt-1 text-sm" />
                </div>

                <!-- Bierwart info in card -->
                <div 
                    v-if="bierwart" 
                    class="border-t border-gray-100 dark:border-gray-800 pt-6 mt-6 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-xl transition-colors p-4 -m-2 group relative overflow-hidden"
                    @click="openBierwartModal()"
                >
                    <div class="flex items-center gap-4 relative z-10">
                        <UAvatar :src="bierwart.image || ''" :alt="bierwart.name" size="lg" class="ring-2 ring-orange-100 dark:ring-orange-900 bg-white" />
                        <div class="flex-1">
                            <p class="text-[10px] font-black uppercase text-orange-500 tracking-wider mb-1 line-clamp-1">{{ t('home.onDuty') }}</p>
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="font-bold text-xl leading-none text-gray-900 dark:text-white">{{ bierwart.name }}</span>
                                <div class="flex items-center bg-orange-100/50 dark:bg-orange-900/30 rounded-full px-1 py-0.5 border border-orange-200 dark:border-orange-800 ml-auto">
                                    <UButton 
                                        icon="i-heroicons-minus-circle-16-solid" 
                                        variant="ghost" 
                                        color="orange" 
                                        size="xs" 
                                        class="p-0.5 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full transition-all active:scale-75"
                                        :loading="isAddingBeer"
                                        @click.stop="removeBeer(bierwart)"
                                    />
                                    <UBadge 
                                        :label="(bierwart.beerCount || 0).toString()" 
                                        color="orange" 
                                        variant="ghost" 
                                        size="xs" 
                                        class="font-black px-1 min-w-[1.5rem] text-center" 
                                    />
                                    <UButton 
                                        icon="i-heroicons-plus-circle-16-solid" 
                                        variant="ghost" 
                                        color="orange" 
                                        size="xs" 
                                        class="p-0.5 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full transition-all active:scale-125 hover:scale-110"
                                        :loading="isAddingBeer"
                                        @click.stop="addBeer(bierwart)"
                                    />
                                </div>
                            </div>
                            <p class="text-xs text-gray-400 mt-1 italic line-clamp-1">{{ t('home.hasDrinks') }}</p>
                        </div>
                        <UIcon name="i-heroicons-pencil" class="text-gray-200 group-hover:text-orange-400 w-4 h-4 transition-colors" />
                    </div>
                </div>
            </div>
        </UCard>
        <UCard v-else class="flex flex-col items-center justify-center p-12 text-center text-gray-500 border-dashed">
            <UIcon name="i-heroicons-calendar" class="w-12 h-12 mb-4 opacity-20" />
            <p class="italic">{{ t('home.noRehearsal') }}</p>
            <UButton to="/calendar" class="mt-4" color="primary" variant="ghost" size="sm">{{ t('home.scheduleOne') }}</UButton>
        </UCard>

        <!-- Upcoming Gigs Card -->
        <UCard class="hover:border-red-500/30 transition-colors">
            <template #header>
                <div class="flex justify-between items-center">
                    <h3 class="font-bold text-xl flex items-center gap-2 text-red-500">
                        <UIcon name="i-heroicons-rocket-launch" /> {{ t('home.upcomingGigs') }}
                    </h3>
                    <UButton 
                        v-if="userRole === 'admin'" 
                        icon="i-heroicons-pencil-square" 
                        size="xs" 
                        color="gray" 
                        variant="soft" 
                        @click="openGigEdit" 
                        class="flex-shrink-0"
                    />
                </div>
            </template>
            <div v-if="rehearsalData?.upcomingGigs?.length" class="space-y-4">
                <div v-for="gig in rehearsalData.upcomingGigs" :key="gig.id" class="flex items-center gap-4 p-3 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors group">
                    <div class="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-lg font-bold text-center min-w-[50px]">
                        <div class="text-[10px] uppercase leading-none">{{ new Date(gig.startTime).toLocaleString(dateLocale, { month: 'short' }) }}</div>
                        <div class="text-xl leading-none text-red-500">{{ new Date(gig.startTime).getDate() }}</div>
                        <div class="text-[8px] uppercase font-bold mt-1 text-red-400">{{ new Date(gig.startTime).toLocaleDateString(dateLocale, { weekday: 'short' }) }}</div>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-gray-900 dark:text-white group-hover:text-red-500 transition-colors">{{ gig.title }}</h4>
                            <UBadge v-if="gig.isTentative" color="gray" variant="soft" size="xs" class="font-bold uppercase tracking-widest text-[8px]">{{ t('calendar.tentative') }}</UBadge>
                        </div>
                        <Markdown :content="gig.description" class="text-xs text-gray-500 mt-0.5" />
                    </div>
                </div>
            </div>
            <div v-else class="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                <p class="text-sm italic">{{ t('home.noGigs') }}</p>
            </div>
        </UCard>

    </div>

    <!-- Rehearsal Edit Modal -->
    <UModal v-model="isRehearsalEditModalOpen">
        <UCard v-if="editedRehearsal">
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="font-bold text-lg flex items-center gap-2">
                        <UIcon name="i-heroicons-musical-note" class="text-primary" /> {{ t('home.editRehearsal') || 'Edit Rehearsal' }}
                    </h3>
                    <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isRehearsalEditModalOpen = false" />
                </div>
            </template>
            
            <div class="space-y-4">
                <UFormGroup :label="t('voting.songTitle')">
                    <UInput v-model="editedRehearsal.title" />
                </UFormGroup>
                <div class="grid grid-cols-2 gap-4">
                    <UFormGroup :label="t('calendar.startTime')">
                        <UInput v-model="editedRehearsal.startTimeFormatted" type="datetime-local" />
                    </UFormGroup>
                    <UFormGroup :label="t('calendar.endTime')">
                        <UInput v-model="editedRehearsal.endTimeFormatted" type="datetime-local" />
                    </UFormGroup>
                </div>
                <UFormGroup :label="t('calendar.description')">
                    <UTextarea v-model="editedRehearsal.description" autoresize :rows="4" :placeholder="t('calendar.descPlaceholder')" />
                </UFormGroup>
                
                <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                    <p class="text-[10px] font-bold uppercase text-gray-400 mb-2">{{ t('common.preview') || 'Preview' }}</p>
                    <Markdown :content="editedRehearsal.description" class="text-sm" />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <UButton color="gray" variant="ghost" @click="isRehearsalEditModalOpen = false">{{ t('common.cancel') }}</UButton>
                    <UButton color="primary" :loading="isSavingRehearsal" @click="saveRehearsal">{{ t('common.save') }}</UButton>
                </div>
            </template>
        </UCard>
    </UModal>

    <!-- Gig Edit Modal -->
    <UModal v-model="isGigEditModalOpen" :ui="{ width: 'max-w-3xl' }">
        <UCard :ui="{ body: { base: 'max-h-[70vh] overflow-y-auto' } }">
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="font-bold text-lg flex items-center gap-2">
                        <UIcon name="i-heroicons-rocket-launch" class="text-red-500" /> {{ t('home.manageGigs') }}
                    </h3>
                    <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isGigEditModalOpen = false" />
                </div>
            </template>
            
            <div class="space-y-8 p-1">
                <div v-for="(gig, index) in editedGigs" :key="gig.id || index" class="p-6 border border-gray-100 dark:border-gray-800 rounded-2xl space-y-5 bg-gray-50/50 dark:bg-gray-950/30 relative group">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-red-500 transition-colors">{{ t('home.gigNumber') }} #{{ index + 1 }}</span>
                        <UButton color="red" variant="soft" icon="i-heroicons-trash" size="xs" :ui="{ rounded: 'rounded-full' }" @click="removeGig(index)" />
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <UFormGroup :label="t('voting.songTitle')" class="md:col-span-2">
                            <UInput v-model="gig.title" icon="i-heroicons-tag" placeholder="Gig Title" />
                        </UFormGroup>
                        <UFormGroup :label="t('calendar.description')" class="md:col-span-2">
                            <UInput v-model="gig.description" icon="i-heroicons-document-text" />
                        </UFormGroup>
                        <UFormGroup :label="t('calendar.startTime')">
                            <UInput v-model="gig.startTimeFormatted" type="datetime-local" icon="i-heroicons-calendar" />
                        </UFormGroup>
                        <UFormGroup :label="t('calendar.endTime')">
                            <UInput v-model="gig.endTimeFormatted" type="datetime-local" icon="i-heroicons-calendar-days" />
                        </UFormGroup>
                    </div>
                </div>
                
                <div v-if="editedGigs.length === 0" class="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
                    <UIcon name="i-heroicons-rocket-launch" class="w-12 h-12 text-gray-200 dark:text-gray-800 mb-2" />
                    <p class="text-gray-400 italic">{{ t('home.noGigsScheduled') }}</p>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-between items-center">
                    <UButton color="gray" variant="soft" icon="i-heroicons-plus-circle" @click="addGig">{{ t('home.addNewGig') }}</UButton>
                    <div class="flex gap-3">
                        <UButton color="gray" variant="ghost" @click="isGigEditModalOpen = false">{{ t('common.cancel') }}</UButton>
                        <UButton color="primary" icon="i-heroicons-check" :loading="isSavingGigs" @click="saveGigs">{{ t('home.saveAll') }}</UButton>
                    </div>
                </div>
            </template>
        </UCard>
    </UModal>

    <!-- Bierwart Selection Modal -->
    <UModal v-model="isBierwartModalOpen">
        <UCard>
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="font-bold text-lg flex items-center gap-2">
                        <UIcon name="i-heroicons-beaker" class="text-orange-500" /> {{ t('home.bierwartMgmt') }}
                    </h3>
                    <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isBierwartModalOpen = false" />
                </div>
            </template>
            
            <div v-if="!bierwartToConfirm" class="space-y-2">
                <p class="text-xs text-gray-500 mb-4">{{ t('home.selectNewBierwart') || 'Select member to take over beverage duty:' }}</p>
                <div 
                    v-for="member in bandMembers" 
                    :key="member.id" 
                    class="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2"
                    :class="[
                        member.id === (bierwart ? bierwart.id : null) ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                    ]"
                    @click="bierwartToConfirm = member"
                >
                    <UAvatar :src="member.image || ''" :alt="member.name" size="sm" />
                    <span class="font-bold flex-1">{{ member.name }}</span>
                    <UIcon v-if="member.id === (bierwart ? bierwart.id : null)" name="i-heroicons-check-circle" class="text-orange-500" />
                </div>
            </div>

            <div v-else class="text-center py-6 space-y-6">
                <div class="flex flex-col items-center gap-4">
                    <UAvatar :src="bierwartToConfirm.image || ''" :alt="bierwartToConfirm.name" size="xl" class="ring-4 ring-orange-500/20" />
                    <div>
                        <p class="text-sm font-medium text-gray-500 italic">{{ t('home.confirmBierwartChange') || 'Are you sure you want to assign' }}</p>
                        <p class="text-2xl font-black text-orange-500">{{ bierwartToConfirm.name }}?</p>
                    </div>
                </div>
                
                <div class="flex flex-col gap-2">
                    <UButton block color="primary" size="lg" :loading="isSavingBierwart" @click="confirmBierwartSelection">
                        {{ t('common.confirm') || 'Confirm Assignment' }}
                    </UButton>
                    <UButton block color="gray" variant="ghost" @click="bierwartToConfirm = null">
                        {{ t('common.cancel') || 'Cancel' }}
                    </UButton>
                </div>
            </div>
        </UCard>
    </UModal>

    <!-- Celebration Animation -->
    <BeerRain :active="isBeerRainActive" @done="isBeerRainActive = false" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const { t, dateLocale } = useI18n();
const { formatDate, formatTime } = useFormatDate();

useHead({
  title: computed(() => t('home.title')),
  meta: [
    { name: 'description', content: 'bndstr — official band website. Music, rehearsals, and song voting.' },
  ],
})

const config = useRuntimeConfig();
const { data: session } = useAuth();
const { data: rehearsalData, refresh: refreshRehearsal } = await useFetch<any>('/api/rehearsals/next');
const { data: usersData, refresh: refreshUsers } = await useFetch<any[]>('/api/users');

const userRole = computed(() => {
    if (config.public.devMode) return 'admin';
    return (session.value?.user as any)?.role || 'user';
});

const bandMembers = computed(() => Array.isArray(usersData.value) ? usersData.value.filter(u => !u.isHidden) : []);

const isGigEditModalOpen = ref(false);
const isSavingGigs = ref(false);
const editedGigs = ref<any[]>([]);

const isRehearsalEditModalOpen = ref(false);
const isSavingRehearsal = ref(false);
const isAddingBeer = ref(false);
const isBeerRainActive = ref(false);
const editedRehearsal = ref<any>(null);

const isBierwartModalOpen = ref(false);
const isSavingBierwart = ref(false);
const bierwartToConfirm = ref<any>(null);

function formatForInput(dateStr: string | number) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function openGigEdit() {
    editedGigs.value = (rehearsalData.value?.upcomingGigs || []).map((g: any) => ({
        ...g,
        startTimeFormatted: formatForInput(g.startTime),
        endTimeFormatted: formatForInput(g.endTime || g.startTime)
    }));
    isGigEditModalOpen.value = true;
}

function addGig() {
    const now = new Date();
    const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    editedGigs.value.push({
        title: 'New Gig',
        description: 'TBD',
        type: 'gig',
        startTimeFormatted: formatForInput(future.toISOString()),
        endTimeFormatted: formatForInput(new Date(future.getTime() + 2 * 60 * 60 * 1000).toISOString())
    });
}

function removeGig(index: number) {
    editedGigs.value.splice(index, 1);
}

function openRehearsalEdit() {
    if (!rehearsalData.value?.nextRehearsal) return;
    const r = rehearsalData.value.nextRehearsal;
    editedRehearsal.value = {
        ...r,
        startTimeFormatted: formatForInput(r.startTime),
        endTimeFormatted: formatForInput(r.endTime || new Date(new Date(r.startTime).getTime() + 2 * 60 * 60 * 1000).toISOString())
    };
    isRehearsalEditModalOpen.value = true;
}

async function saveRehearsal() {
    isSavingRehearsal.value = true;
    try {
        await $fetch('/api/calendar', {
            method: 'PUT',
            body: {
                id: editedRehearsal.value.id,
                title: editedRehearsal.value.title,
                description: editedRehearsal.value.description,
                startTime: new Date(editedRehearsal.value.startTimeFormatted).getTime(),
                endTime: new Date(editedRehearsal.value.endTimeFormatted).getTime()
            }
        });
        await refreshRehearsal();
        isRehearsalEditModalOpen.value = false;
    } catch (e: any) {
        alert('Failed to save rehearsal: ' + (e.data?.message || e.message));
    } finally {
        isSavingRehearsal.value = false;
    }
}

async function saveGigs() {
    isSavingGigs.value = true;
    try {
        const originalGigIds = (rehearsalData.value?.upcomingGigs || []).map((g: any) => g.id);
        const newGigIds = editedGigs.value.filter(g => g.id).map(g => g.id);
        const removedIds = originalGigIds.filter((id: number) => !newGigIds.includes(id));

        for (const id of removedIds) {
            await $fetch('/api/calendar', { method: 'DELETE', query: { id } });
        }

        for (const gig of editedGigs.value) {
            const body = {
                id: gig.id,
                title: gig.title,
                description: gig.description,
                startTime: new Date(gig.startTimeFormatted).getTime(),
                endTime: new Date(gig.endTimeFormatted).getTime(),
                type: 'gig'
            };
            
            if (gig.id) {
                await $fetch('/api/calendar', { method: 'PUT', body });
            } else {
                await $fetch('/api/calendar', { method: 'POST', body });
            }
        }

        await refreshRehearsal();
        isGigEditModalOpen.value = false;
    } catch (e: any) {
        console.error(e);
        alert('Failed to save gigs: ' + (e.data?.message || e.message));
    } finally {
        isSavingGigs.value = false;
    }
}

function openBierwartModal() {
    bierwartToConfirm.value = null;
    isBierwartModalOpen.value = true;
}

async function confirmBierwartSelection() {
    if (!bierwartToConfirm.value || !rehearsalData.value?.nextRehearsal) return;
    isSavingBierwart.value = true;
    try {
        await $fetch('/api/calendar', {
            method: 'PUT',
            body: {
                id: rehearsalData.value.nextRehearsal.id,
                bierwartOverrideId: bierwartToConfirm.value.id
            }
        });
        await refreshRehearsal();
        isBierwartModalOpen.value = false;
    } catch (e: any) {
        alert('Failed to assign Bierwart: ' + (e.data?.message || e.message));
    } finally {
        isSavingBierwart.value = false;
    }
}

const bierwart = computed(() => {
    if (!rehearsalData.value?.nextRehearsal || bandMembers.value.length === 0) return null;
    
    const overrideId = rehearsalData.value.nextRehearsal.bierwartOverrideId;
    if (overrideId) {
        const overrideMember = bandMembers.value.find(m => m.id === overrideId);
        if (overrideMember) return overrideMember;
    }

    const rehearsalId = rehearsalData.value.nextRehearsal.id;
    const index = (rehearsalId - 1) % bandMembers.value.length;
    return bandMembers.value[index];
});

const toast = useToast();

const log = (msg: string, data?: any) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] [BIERWART-CLIENT] ${msg}`, data || '');
};

watch(bierwart, (newB) => {
    log('Bierwart changed:', newB?.name);
}, { immediate: true });

async function addBeer(member: any) {
    log('addBeer triggered for member:', member?.name);
    if (!member?.id || isAddingBeer.value) {
        log('addBeer aborted:', { hasId: !!member?.id, isAdding: isAddingBeer.value });
        return;
    }
    
    isAddingBeer.value = true;
    try {
        // Find latest count in reactive state
        const userInState = usersData.value?.find((u: any) => u.id === member.id);
        const currentCount = Number((userInState || member).beerCount || 0);
        const newCount = currentCount + 1;
        log('Incrementing beer:', { member: member.name, old: currentCount, new: newCount });
        
        await $fetch(`/api/users/${member.id}`, {
            method: 'PATCH',
            body: { beerCount: newCount }
        });
        
        // Robust local update
        if (usersData.value) {
           const idx = usersData.value.findIndex((u: any) => u.id === member.id);
           if (idx !== -1) {
              log('Updating local usersData at index:', idx);
              usersData.value[idx].beerCount = newCount;
           } else {
              log('Failed to find member in usersData for local update');
           }
        }
        
        // Trigger celebration!
        log('Triggering BeerRain animation...');
        isBeerRainActive.value = true;
        
        await refreshUsers();
        log('Users refreshed after increment');
        
        toast.add({
            title: t('admin.beerAdded') || 'Bier mitgebracht!',
            icon: 'i-heroicons-beaker',
            color: 'orange'
        });
    } catch (e: any) {
        log('addBeer error:', e);
        console.error('Beer counter error:', e);
        toast.add({
            title: 'Fehler beim Bierzählen',
            description: e.message,
            color: 'red'
        });
    } finally {
        isAddingBeer.value = false;
        log('addBeer finished');
    }
}

async function removeBeer(member: any) {
    log('removeBeer triggered for member:', member?.name);
    if (!member?.id || isAddingBeer.value) {
        log('removeBeer aborted:', { hasId: !!member?.id, isAdding: isAddingBeer.value });
        return;
    }
    
    const userInState = usersData.value?.find((u: any) => u.id === member.id);
    const currentCount = Number((userInState || member).beerCount || 0);
    if (currentCount <= 0) {
        log('removeBeer aborted: count is already 0');
        return;
    }
    
    isAddingBeer.value = true;
    try {
        const newCount = currentCount - 1;
        log('Decrementing beer:', { member: member.name, old: currentCount, new: newCount });
        
        await $fetch(`/api/users/${member.id}`, {
            method: 'PATCH',
            body: { beerCount: newCount }
        });
        
        if (usersData.value) {
           const idx = usersData.value.findIndex((u: any) => u.id === member.id);
           if (idx !== -1) {
              log('Updating local usersData at index:', idx);
              usersData.value[idx].beerCount = newCount;
           }
        }
        
        await refreshUsers();
        log('Users refreshed after decrement');
    } catch (e: any) {
        log('removeBeer error:', e);
        console.error('Beer counter remove error:', e);
    } finally {
        isAddingBeer.value = false;
        log('removeBeer finished');
    }
}
</script>
