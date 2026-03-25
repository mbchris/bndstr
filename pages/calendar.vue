<template>
  <div class="px-4 py-8 max-w-7xl mx-auto space-y-8">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold">{{ t('nav.calendar') }}</h2>
            <UButton :label="t('calendar.today')" color="gray" variant="subtle" size="sm" @click="goToToday" />
        </div>
      </template>

      <!-- Navigation Header -->
      <div class="flex items-center justify-center mb-8 gap-4">
          <UButton icon="i-heroicons-chevron-left" color="gray" variant="ghost" @click="prevMonth" />
          <h3 class="text-xl font-semibold text-center w-48">{{ currentMonthData.name }} {{ currentMonthData.year }}</h3>
          <UButton icon="i-heroicons-chevron-right" color="gray" variant="ghost" @click="nextMonth" />
      </div>

      <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-2 md:p-4">
        <div class="grid grid-cols-7 gap-1 text-center font-medium text-gray-500 text-sm mb-2">
          <div v-for="d in tv('calendar.days')" :key="d">{{ d }}</div>
        </div>
        
        <div class="grid grid-cols-7 gap-1">
          <!-- Calendar Days -->
            <div v-for="dayData in allDays" :key="dayData.year + '-' + dayData.month + '-' + dayData.day" 
                 class="min-h-[80px] md:min-h-[100px] border border-gray-100 dark:border-gray-800 p-1 relative rounded group hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                 :class="{ 'opacity-40 bg-gray-50 dark:bg-gray-900': !dayData.isCurrentMonth }"
                 @click="handleDayClick(dayData)">
             
             <!-- Day Number -->
             <span class="text-xs font-medium" :class="{'text-primary font-bold': isToday(dayData.year, dayData.month, dayData.day)}">
                  {{ dayData.day }}
             </span>
             
             <!-- Events List -->
             <div class="mt-1 space-y-1 overflow-hidden" style="max-height: calc(100% - 20px);">
                 <template v-for="(event, eIdx) in getEvents(dayData.year, dayData.month, dayData.day)" :key="event.id">
                     <div v-if="eIdx < 3"
                          class="text-[10px] leading-tight truncate px-1 py-0.5 rounded cursor-pointer mb-0.5 flex justify-between items-center"
                          :class="[
                              event.type === 'rehearsal' ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100' : 
                              event.type === 'gig' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' :
                              event.type === 'event' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
                              event.userId ? 'border-l-2 border-indigo-500' : ''
                          ]"
                          :title="event.title"
                          @click.stop="editEvent(event)">
                         <span class="truncate flex-1">{{ event.title }}</span>
                         <span v-if="event.isTentative" class="mr-1 opacity-70" title="Tentative">?</span>
                         <span v-if="event.ownerName" class="text-[8px] font-bold uppercase ml-1 opacity-70 shrink-0" title="Owner">{{ event.ownerName.substring(0,2) }}</span>
                     </div>
                 </template>
                 <div v-if="getEvents(dayData.year, dayData.month, dayData.day).length > 3" class="text-[9px] text-gray-400 font-semibold px-1">
                     + {{ getEvents(dayData.year, dayData.month, dayData.day).length - 3 }} more
                 </div>
             </div>
          </div>
        </div>
      </div>
    </UCard>
    
    <!-- Event Modal -->
    <UModal v-model="isModalOpen">
      <UCard>
        <template #header>
           <h3 class="font-bold text-lg">{{ editingEvent ? t('calendar.editEvent') : t('calendar.createEvent') }}</h3>
        </template>

        <form @submit.prevent="saveEvent" class="space-y-4">
           <UFormGroup :label="t('voting.songTitle')" required>
              <UInput v-model="form.title" required autofocus />
           </UFormGroup>

           <div class="flex gap-4">
               <UFormGroup :label="t('calendar.typeLabel')" class="flex-1">
                  <USelect v-model="form.type" :options="[
                     { label: t('calendar.typeRehearsal'), value: 'rehearsal' },
                     { label: t('calendar.typeGig'), value: 'gig' },
                     { label: t('calendar.typeEvent'), value: 'event' },
                     { label: t('calendar.typeUnavail'), value: 'unavailability' }
                  ]" />
               </UFormGroup>
               <UFormGroup :label="t('calendar.ownerLabel')" class="flex-1">
                  <USelectMenu v-model="form.userId" :options="ownerOptions" value-attribute="value" option-attribute="label" />
               </UFormGroup>
           </div>
           
           <div class="flex gap-4">
               <UFormGroup :label="t('calendar.startTime')" required class="flex-1">
                  <UInput v-model="form.startTime" type="datetime-local" required />
               </UFormGroup>
               <UFormGroup :label="t('calendar.endTime')" required class="flex-1">
                  <UInput v-model="form.endTime" type="datetime-local" required />
               </UFormGroup>
           </div>
           
           <UFormGroup :label="t('calendar.description')">
              <UTextarea v-model="form.description" autoresize :rows="4" :placeholder="t('calendar.descPlaceholder')" />
           </UFormGroup>

           <UCheckbox v-model="form.isTentative" :label="t('calendar.tentativeLabel')" />

           <div class="flex justify-between items-center mt-8">
               <div class="flex items-center gap-2">
                   <UButton v-if="editingEvent" type="button" icon="i-heroicons-trash" color="red" variant="ghost" @click="deleteEvent">{{ t('common.delete') }}</UButton>
                   <UButton v-if="editingEvent" type="button" icon="i-heroicons-arrow-down-tray" color="gray" variant="ghost" @click="exportIcal(editingEvent)">iCal</UButton>
               </div>
               <div class="flex gap-3">
                   <UButton color="gray" variant="ghost" @click="isModalOpen = false">{{ t('common.cancel') }}</UButton>
                   <UButton type="submit" color="primary" :loading="isSaving">{{ t('common.save') }}</UButton>
               </div>
           </div>
        </form>
      </UCard>
    </UModal>

    <!-- Day View Modal (Mobile optimization) -->
    <UModal v-model="isDayViewModalOpen">
      <UCard v-if="selectedDayData" :ui="{ body: { padding: 'p-0' } }">
        <template #header>
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">
                  {{ new Date(selectedDayData.year, selectedDayData.month, selectedDayData.day).toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' }) }}
                </span>
                <h3 class="font-black text-2xl tracking-tight text-gray-900 dark:text-white">
                    {{ new Date(selectedDayData.year, selectedDayData.month, selectedDayData.day).toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric' }) }}
                </h3>
              </div>
              <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" size="lg" square @click="isDayViewModalOpen = false" class="rounded-full" />
            </div>
        </template>

        <div class="divide-y divide-gray-100 dark:divide-gray-800">
            <div v-if="selectedDayEvents.length">
                <div v-for="event in selectedDayEvents" :key="event.id" 
                    class="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer flex justify-between items-center group transition-colors"
                    @click="openEditFromDayView(event)">
                    <div class="flex items-start gap-4">
                        <!-- Type Indicator Dot -->
                        <div class="mt-2 w-3 h-3 rounded-full shrink-0 shadow-lg" :class="[
                            event.type === 'rehearsal' ? 'bg-primary-500 shadow-primary-500/20' : 
                            event.type === 'gig' ? 'bg-orange-500 shadow-orange-500/20' :
                            event.type === 'event' ? 'bg-green-500 shadow-green-500/20' : 'bg-gray-400 shadow-gray-400/20'
                        ]"></div>
                        
                        <div>
                            <div class="flex items-center gap-2">
                                <div class="font-black text-xl group-hover:text-primary-500 transition-colors tracking-tight">{{ event.title }}</div>
                                <UBadge v-if="event.isTentative" color="gray" variant="soft" size="xs" class="font-bold uppercase tracking-widest text-[8px]">{{ t('calendar.tentative') }}</UBadge>
                            </div>
                            <div class="flex flex-wrap items-center gap-x-2 gap-y-2 mt-2">
                                <div class="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                                    <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
                                    <span>{{ formatTime(event.startTime) }} <span v-if="event.endTime">— {{ formatTime(event.endTime) }}</span></span>
                                </div>
                                <div class="flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg" :class="[
                                    event.type === 'rehearsal' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' :
                                    event.type === 'gig' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' :
                                    event.type === 'event' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                ]">
                                    <UIcon :name="event.type === 'rehearsal' ? 'i-heroicons-musical-note' : event.type === 'gig' ? 'i-heroicons-microphone' : 'i-heroicons-star'" class="w-3.5 h-3.5" />
                                    <span>{{ getEventLabel(event.type) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <UIcon name="i-heroicons-arrow-right" class="text-gray-300 group-hover:text-primary-500 transition-all group-hover:translate-x-1" />
                </div>
            </div>
            <div v-else class="text-center py-16 text-gray-400 flex flex-col items-center gap-3">
                <UIcon name="i-heroicons-calendar" class="w-12 h-12 opacity-20" />
                <span class="italic font-medium">{{ t('home.noEventsScheduled') || 'No events for this day.' }}</span>
            </div>
        </div>

        <!-- Actions -->
        <div class="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <UButton block color="primary" variant="solid" icon="i-heroicons-plus-circle-16-solid" size="xl" class="rounded-2xl font-black text-lg py-4 shadow-xl shadow-primary-500/10" @click="openCreateFromDayView">
                {{ t('calendar.createEvent') }}
            </UButton>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const { t, tv, dateLocale } = useI18n();

useHead({ title: computed(() => t('calendar.title')) });

const { exportEventToIcal } = useIcalExport();
const config = useRuntimeConfig();

function exportIcal(event: any) {
    if (!event) return;
    exportEventToIcal(event, config.public.siteUrl as string);
}

const { data: usersData } = await useFetch<any[]>('/api/users');
const bandMembers = computed(() => Array.isArray(usersData.value) ? usersData.value.filter(u => !u.isHidden) : []);
const ownerOptions = computed(() => [
    { label: t('calendar.ownerAll'), value: null },
    ...bandMembers.value.map(u => ({ label: u.name, value: u.id }))
]);

const currentDate = ref(new Date());

const currentMonthData = computed(() => {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    const date = new Date(year, month, 1);
    const name = date.toLocaleString(dateLocale.value, { month: 'long' });
    const startDay = date.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    return { name, year, monthIndex: month, startDay, days: daysInMonth };
});

const allDays = computed(() => {
    const days = [];
    const year = currentMonthData.value.year;
    const month = currentMonthData.value.monthIndex;
    const startDay = currentMonthData.value.startDay;
    
    // Previous month padding
    const prevMonthDate = new Date(year, month, 0);
    const daysInPrevMonth = prevMonthDate.getDate();
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();
    for (let i = 0; i < startDay; i++) {
        days.push({ 
            day: daysInPrevMonth - startDay + i + 1, 
            month: prevMonth, 
            year: prevYear, 
            isCurrentMonth: false 
        });
    }
    
    // Current month
    for (let i = 1; i <= currentMonthData.value.days; i++) {
        days.push({ 
            day: i, 
            month: month, 
            year: year, 
            isCurrentMonth: true 
        });
    }
    
    // Next month padding
    const nextMonthDate = new Date(year, month + 1, 1);
    const nextMonth = nextMonthDate.getMonth();
    const nextYear = nextMonthDate.getFullYear();
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push({ 
            day: i, 
            month: nextMonth, 
            year: nextYear, 
            isCurrentMonth: false 
        });
    }
    
    return days;
});

const isToday = (year: number, month: number, day: number) => {
    const t = new Date();
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
};

function prevMonth() {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
}

function nextMonth() {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
}

function goToToday() {
    currentDate.value = new Date();
}

const { data: events, refresh } = await useFetch<any[]>('/api/calendar');

const getEvents = (year: number, month: number, day: number) => {
    if (!events.value) return [];
    
    // Create timestamps for the start and end of the day to compare against the event range
    const dayStart = new Date(year, month, day, 0, 0, 0, 0).getTime();
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999).getTime();
    
    return events.value.filter(e => {
        const eventStart = new Date(e.startTime).getTime();
        const eventEnd = new Date(e.endTime || e.startTime).getTime();
        
        // Return true if the event has any overlap with the day
        return eventStart <= dayEnd && eventEnd >= dayStart;
    });
};

const isModalOpen = ref(false);
const isDayViewModalOpen = ref(false);
const isSaving = ref(false);
const editingEvent = ref<any>(null);
const selectedDayData = ref<any>(null);
const form = ref({
    title: '',
    description: '',
    type: 'rehearsal',
    userId: null as number | null,
    startTime: '',
    endTime: '',
    isTentative: false
});

const { formatTime } = useFormatDate();

function getEventLabel(type: string) {
    if (type === 'rehearsal') return t('calendar.typeRehearsal');
    if (type === 'gig') return t('calendar.typeGig');
    if (type === 'event') return t('calendar.typeEvent');
    if (type === 'unavailability') return t('calendar.typeUnavail');
    return type;
}

const selectedDayEvents = computed(() => {
    if (!selectedDayData.value) return [];
    return getEvents(selectedDayData.value.year, selectedDayData.value.month, selectedDayData.value.day);
});

// Utility to format Date to datetime-local string (YYYY-MM-DDThh:mm)
function toDatetimeLocal(date: Date) {
    const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
}

function handleDayClick(dayData: any) {
    selectedDayData.value = dayData;
    const dayEvents = getEvents(dayData.year, dayData.month, dayData.day);
    
    if (dayEvents.length > 0) {
        isDayViewModalOpen.value = true;
    } else {
        openModal(dayData.year, dayData.month, dayData.day);
    }
}

function openModal(year: number, month: number, day: number) {
    editingEvent.value = null;
    const start = new Date(year, month, day, 18, 0); // Default to 6 PM
    const end = new Date(year, month, day, 20, 0); // Default 2 hours
    form.value = {
        title: '',
        description: '',
        type: 'rehearsal',
        userId: null,
        startTime: toDatetimeLocal(start),
        endTime: toDatetimeLocal(end),
        isTentative: false
    };
    isModalOpen.value = true;
}

function openCreateFromDayView() {
    isDayViewModalOpen.value = false;
    if (selectedDayData.value) {
        openModal(selectedDayData.value.year, selectedDayData.value.month, selectedDayData.value.day);
    }
}

function openEditFromDayView(event: any) {
    isDayViewModalOpen.value = false;
    editEvent(event);
}

function editEvent(event: any) {
    editingEvent.value = event;
    form.value = {
        title: event.title,
        description: event.description || '',
        type: event.type,
        userId: event.userId || null,
        startTime: toDatetimeLocal(new Date(event.startTime)),
        endTime: toDatetimeLocal(new Date(event.endTime)),
        isTentative: event.isTentative || false
    };
    isModalOpen.value = true;
}

async function saveEvent() {
    isSaving.value = true;
    try {
        const payload = {
            ...form.value,
            startTime: new Date(form.value.startTime).getTime(),
            endTime: new Date(form.value.endTime).getTime()
        };

        if (editingEvent.value) {
            await $fetch('/api/calendar', {
                method: 'PUT',
                body: { id: editingEvent.value.id, ...payload }
            });
        } else {
            await $fetch('/api/calendar', {
                method: 'POST',
                body: payload
            });
        }
        await refresh();
        isModalOpen.value = false;
    } catch (e: any) {
        alert(t('calendar.failedSave'));
    } finally {
        isSaving.value = false;
    }
}

async function deleteEvent() {
    if (!editingEvent.value || !confirm(t('calendar.confirmDelete'))) return;
    try {
        await $fetch('/api/calendar', {
            method: 'DELETE',
            query: { id: editingEvent.value.id }
        });
        await refresh();
        isModalOpen.value = false;
    } catch (e) {
        alert(t('calendar.failedDelete'));
    }
}
</script>
