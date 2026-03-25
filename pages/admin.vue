<template>
  <div class="px-4 py-8 max-w-7xl mx-auto space-y-8">
     <div class="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <UIcon name="i-heroicons-cog-8-tooth" class="w-8 h-8 text-primary" />
        <h2 class="text-2xl font-bold">{{ t('admin.heading') }}</h2>
     </div>
     
     <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div class="lg:col-span-2">
           <UCard>
              <template #header>
                  <div class="flex justify-between items-center">
                      <h3 class="font-bold">{{ t('admin.bandMembers') }}</h3>
                      <UButton size="xs" color="gray" variant="solid" icon="i-heroicons-user-plus" @click="isAddModalOpen = true">{{ t('common.add') }}</UButton>
                  </div>
              </template>
              <UTable :rows="users || []" :columns="columns">
                 <template #isHidden-data="{ row }">
                    <UBadge v-if="row.isHidden" color="gray" variant="solid" size="xs">{{ t('admin.isHidden') }}</UBadge>
                    <span v-else>-</span>
                 </template>
                 <template #actions-data="{ row }">
                    <div class="flex gap-1 items-center">
                       <UButton color="gray" variant="ghost" icon="i-heroicons-pencil-square" size="xs" @click="openEdit(row)" />
                       <UButton color="red" variant="ghost" icon="i-heroicons-trash" size="xs" :loading="removingId === row.id" @click="removeUser(row.id)" />
                    </div>
                 </template>
              </UTable>
           </UCard>
         </div>
         
         <div class="lg:col-span-1">
           <UCard>
              <template #header>
                 <h3 class="font-bold">{{ t('admin.systemStatus') }}</h3>
              </template>
              <div class="space-y-2 text-sm">
                  <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                      <span class="text-gray-500">{{ t('admin.database') }}</span>
                      <UBadge color="green" variant="subtle">{{ t('admin.connected') }}</UBadge>
                  </div>
                  <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                      <span class="text-gray-500">OIDC Google</span>
                      <UBadge v-if="sysStatus?.google" color="green" variant="subtle">{{ t('admin.connected') }}</UBadge>
                      <UBadge v-else color="gray" variant="subtle">{{ t('admin.pendingConfig') }}</UBadge>
                  </div>
                  <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                      <span class="text-gray-500">OIDC GitHub</span>
                      <UBadge v-if="sysStatus?.github" color="green" variant="subtle">{{ t('admin.connected') }}</UBadge>
                      <UBadge v-else color="gray" variant="subtle">{{ t('admin.pendingConfig') }}</UBadge>
                  </div>
                  <div class="flex justify-between items-center py-2">
                      <span class="text-gray-500">{{ t('admin.buildVersion') }}</span>
                      <span class="text-xs font-mono text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">{{ useRuntimeConfig().public.commitId }}</span>
                  </div>
              </div>
           </UCard>

            <UCard class="mt-8">
               <template #header>
                  <h3 class="font-bold">{{ t('admin.dbManagement') }}</h3>
               </template>
               <div class="space-y-4 pt-2">
                   <div class="flex flex-col gap-2">
                       <UButton 
                         block 
                         color="gray" 
                         variant="solid" 
                         icon="i-heroicons-arrow-down-tray" 
                         @click="exportDb"
                       >
                           {{ t('admin.downloadBackup') }}
                       </UButton>
                       
                       <div class="relative">
                           <input 
                             type="file" 
                             ref="importInput" 
                             class="hidden" 
                             accept=".sql,.db" 
                             @change="handleImport" 
                           />
                           <UButton 
                             block 
                             color="orange" 
                             variant="soft" 
                             icon="i-heroicons-arrow-up-tray" 
                             :loading="isImporting"
                             @click="importInput?.click()"
                           >
                               {{ t('admin.importSql') }}
                           </UButton>
                       </div>
                       <p class="text-[10px] text-gray-400 italic text-center px-4">
                           {{ t('admin.sqlWarning') }}
                       </p>
                   </div>
               </div>
            </UCard>
 
             <UCard class="mt-8">
                <template #header>
                   <h3 class="font-bold">{{ t('admin.calendarMgmt') }}</h3>
                </template>
                <div class="space-y-4 pt-2">
                    <div class="flex flex-col gap-2">
                        <UButton 
                          block 
                          color="gray" 
                          variant="solid" 
                          icon="i-heroicons-document-arrow-down" 
                          @click="exportCalendar"
                        >
                            {{ t('admin.exportJson') }}
                        </UButton>
                        
                        <div class="relative">
                            <input 
                              type="file" 
                              ref="calendarImportInput" 
                              class="hidden" 
                              accept=".json" 
                              @change="handleCalendarImport" 
                            />
                            <UButton 
                              block 
                              color="blue" 
                              variant="soft" 
                              icon="i-heroicons-document-arrow-up" 
                              :loading="isCalendarImporting"
                              @click="calendarImportInput?.click()"
                            >
                                {{ t('admin.importJson') }}
                            </UButton>
                        </div>
                        <p class="text-[10px] text-gray-400 italic text-center px-4">
                            {{ t('admin.jsonHint') }}
                        </p>
                    </div>
                </div>
             </UCard>
          </div>
     </div>
     
     <UModal v-model="isAddModalOpen">
        <UCard>
            <template #header>
               <h3 class="font-bold">{{ t('admin.addMember') }}</h3>
            </template>
            <form class="space-y-4" @submit.prevent="addUser">
                <UFormGroup :label="t('admin.name')" required>
                   <UInput v-model="newUser.name" required />
                </UFormGroup>
                <UFormGroup :label="t('admin.emailLogin')" required>
                   <UInput v-model="newUser.email" type="email" required />
                </UFormGroup>
                <UFormGroup :label="t('admin.role')">
                   <USelect v-model="newUser.role" :options="['user', 'admin']" />
                </UFormGroup>
                 <UFormGroup :help="t('admin.hiddenHint')">
                    <UCheckbox v-model="newUser.isHidden" :label="t('admin.isHidden')" />
                 </UFormGroup>
                 <UFormGroup :label="t('admin.beerCount')">
                    <UInput v-model="newUser.beerCount" type="number" />
                 </UFormGroup>
                <div class="flex justify-end gap-2 mt-4">
                    <UButton color="gray" variant="ghost" @click="isAddModalOpen = false">{{ t('common.cancel') }}</UButton>
                    <UButton type="submit" color="primary" :loading="isSubmitting">{{ t('common.add') }}</UButton>
                </div>
            </form>
        </UCard>
     </UModal>

     <UModal v-model="isEditModalOpen">
        <UCard>
            <template #header>
               <h3 class="font-bold">{{ t('admin.editMember') }}</h3>
            </template>
            <form v-if="editingUser" class="space-y-4" @submit.prevent="updateUser">
                <UFormGroup :label="t('admin.name')" required>
                   <UInput v-model="editingUser.name" required />
                </UFormGroup>
                <UFormGroup :label="t('admin.emailLogin')" required>
                   <UInput v-model="editingUser.email" type="email" required />
                </UFormGroup>
                <UFormGroup :label="t('admin.role')">
                   <USelect v-model="editingUser.role" :options="['user', 'admin']" />
                </UFormGroup>
                 <UFormGroup :help="t('admin.hiddenHint')">
                    <UCheckbox v-model="editingUser.isHidden" :label="t('admin.isHidden')" />
                 </UFormGroup>
                 <UFormGroup :label="t('admin.beerCount')">
                    <UInput v-model="editingUser.beerCount" type="number" />
                 </UFormGroup>
                <div class="flex justify-end gap-2 mt-4">
                    <UButton color="gray" variant="ghost" @click="isEditModalOpen = false">{{ t('common.cancel') }}</UButton>
                    <UButton type="submit" color="primary" :loading="isSubmitting">{{ t('common.save') }}</UButton>
                </div>
            </form>
        </UCard>
     </UModal>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const { status, data: session } = useAuth();
const router = useRouter();

// Protection: Redirect if not admin
if (process.client) {
    const role = (session.value?.user as any)?.role || 'user';
    const isDev = useRuntimeConfig().public.devMode;
    if (role !== 'admin' && !isDev) {
        router.push('/');
    }
}

useHead({ title: computed(() => t('admin.title')) });

const columns = [
  { key: 'name', label: t('admin.name') },
  { key: 'email', label: t('admin.emailWhitelist') },
  { key: 'role', label: t('admin.role') },
  { key: 'isHidden', label: t('admin.isHidden') },
  { key: 'beerCount', label: t('admin.beerCount') },
  { key: 'actions', label: '' }
];

const { data: users, refresh } = await useFetch<any[]>('/api/users');
const { data: sysStatus } = await useFetch<any>('/api/admin/status');

const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isSubmitting = ref(false);
const isImporting = ref(false);
const newUser = ref({ name: '', email: '', role: 'user', isHidden: false, beerCount: 0 });
const editingUser = ref<any>(null);
const removingId = ref<number | null>(null);
const importInput = ref<HTMLInputElement | null>(null);
const calendarImportInput = ref<HTMLInputElement | null>(null);
const isCalendarImporting = ref(false);

function exportDb() {
    window.open('/api/admin/db/export', '_blank');
}

function exportCalendar() {
    window.open('/api/admin/calendar/export', '_blank');
}

async function handleCalendarImport(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    isCalendarImporting.value = true;
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res: any = await $fetch('/api/admin/calendar/import', {
            method: 'POST',
            body: formData
        });
        alert(t('admin.importJsonSuccess', { count: res.count }));
        router.push('/calendar');
    } catch (e: any) {
        console.error(e);
        alert(e.data?.message || t('admin.failedJsonImport'));
    } finally {
        isCalendarImporting.value = false;
        event.target.value = '';
    }
}

async function handleImport(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm(t('admin.importWarningConfirm'))) {
        event.target.value = '';
        return;
    }

    isImporting.value = true;
    const formData = new FormData();
    formData.append('file', file);

    try {
        await $fetch('/api/admin/db/import', {
            method: 'POST',
            body: formData
        });
        alert(t('admin.importSuccess'));
        await refresh();
    } catch (e: any) {
        console.error(e);
        alert(e.data?.message || t('admin.failedImport'));
    } finally {
        isImporting.value = false;
        event.target.value = '';
    }
}

async function addUser() {
    isSubmitting.value = true;
    try {
        await $fetch('/api/users', {
            method: 'POST',
            body: newUser.value
        });
        isAddModalOpen.value = false;
        newUser.value = { name: '', email: '', role: 'user', isHidden: false };
        await refresh();
    } catch (e: unknown) {
        alert((e as { data?: { error?: string } }).data?.error || t('admin.failedAdd'));
    } finally {
        isSubmitting.value = false;
    }
}

function openEdit(user: any) {
    editingUser.value = { ...user };
    isEditModalOpen.value = true;
}

async function updateUser() {
    if (!editingUser.value) return;
    isSubmitting.value = true;
    try {
        await $fetch(`/api/users/${editingUser.value.id}`, {
            method: 'PATCH',
            body: {
                name: editingUser.value.name,
                email: editingUser.value.email,
                role: editingUser.value.role,
                isHidden: editingUser.value.isHidden
            }
        });
        isEditModalOpen.value = false;
        await refresh();
    } catch (e: any) {
        console.error(e);
        const errorMsg = e.data?.message || e.data?.statusMessage || e.message || t('admin.failedUpdate');
        alert(errorMsg);
    } finally {
        isSubmitting.value = false;
    }
}

async function removeUser(id: number) {
    if (!confirm(t('admin.removeConfirm'))) return;
    removingId.value = id;
    try {
        await $fetch('/api/users', {
            method: 'DELETE',
            query: { id }
        });
        await refresh();
    } catch (e: unknown) {
        alert((e as { data?: { error?: string } }).data?.error || t('admin.failedRemove'));
    } finally {
        removingId.value = null;
    }
}
</script>
