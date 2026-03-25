<template>
  <div class="layout-default min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
    <!-- Header -->
    <header class="sticky top-0 z-50 backdrop-blur-md bg-white/75 dark:bg-gray-950/75 border-b border-gray-200 dark:border-gray-800">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3">
          <img src="~/assets/bndstr_rect_bl.png" alt="bndstr Logo" class="h-8 w-auto object-contain dark:hidden">
          <img src="~/assets/bndstr_rect_wh.png" alt="bndstr Logo" class="h-8 w-auto object-contain hidden dark:block">
          <span class="font-bold text-xl tracking-tight hidden sm:block"></span>
        </NuxtLink>

        <!-- Navigation Links (Desktop) -->
        <div class="hidden md:flex items-center gap-6">
          <NuxtLink v-for="link in links" :key="link.to" :to="link.to" active-class="text-primary font-semibold" class="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
            {{ link.label }}
          </NuxtLink>
        </div>

        <!-- Auth / Settings -->
        <div class="flex items-center gap-2 sm:gap-4">
            <!-- Theme Switcher -->
            <UButton
              variant="ghost"
              color="gray"
              size="sm"
              :icon="colorMode.value === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'"
              @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
            />

            <!-- Language Switcher -->
            <UButton 
              variant="ghost" 
              color="gray" 
              size="sm"
              class="font-bold text-xs uppercase tracking-wider"
              @click="toggleLocale"
            >
              {{ locale === 'en' ? 'DE' : 'EN' }}
            </UButton>

            <!-- Mobile Menu -->
            <UButton 
              variant="ghost" 
              color="gray" 
              class="md:hidden order-last" 
              size="lg"
              @click="isMenuOpen = true" 
            >
              <template #leading>
                <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
              </template>
              <span class="sr-only">{{ t('nav.menu') }}</span>
            </UButton>

            <template v-if="authStatus === 'authenticated'">
                <UDropdown :items="userDropdownItems" :popper="{ placement: 'bottom-end' }">
                    <UAvatar :src="user?.image || ''" :alt="user?.name || user?.email || 'User'" size="sm" />
                </UDropdown>
            </template>
            <template v-else>
               <UButton color="primary" variant="solid" :label="t('nav.login')" @click="signIn(undefined as any)" />
            </template>
        </div>
      </nav>
    </header>

    <!-- Mobile Slideover Menu -->
    <USlideover v-model="isMenuOpen">
      <div class="p-6 flex flex-col h-full bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between mb-10">
          <NuxtLink to="/" class="flex items-center gap-3" @click="isMenuOpen = false">
             <span class="font-bold text-xl tracking-tight text-primary">bndstr</span>
          </NuxtLink>
          <UButton 
            color="gray" 
            variant="ghost" 
            icon="i-heroicons-x-mark" 
            size="lg"
            @click="isMenuOpen = false" 
          />
        </div>
        
        <nav class="flex flex-col gap-4">
          <NuxtLink 
            v-for="link in links" 
            :key="link.to" 
            :to="link.to" 
            active-class="bg-primary/10 text-primary font-bold"
            class="px-4 py-3 rounded-xl text-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-between group"
            @click="isMenuOpen = false"
          >
            {{ link.label }}
            <UIcon name="i-heroicons-chevron-right" class="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NuxtLink>
        </nav>

        <!-- Theme Switcher Mobile -->
        <div class="mt-6 px-4">
            <UButton block variant="soft" color="gray" @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'">
                <template #leading>
                    <UIcon :name="colorMode.value === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'" class="w-5 h-5 mr-2" />
                </template>
                {{ colorMode.value === 'dark' ? 'Dark Mode' : 'Light Mode' }}
            </UButton>
        </div>

        <!-- Language Switcher Mobile -->
        <div class="mt-4 px-4">
            <UButton block variant="soft" color="gray" @click="toggleLocale">
                {{ locale === 'en' ? '🇩🇪 Deutsch' : '🇬🇧 English' }}
            </UButton>
        </div>

        <div class="mt-auto pt-10 border-t border-gray-100 dark:border-gray-800">
            <template v-if="authStatus === 'authenticated'">
                <div class="flex items-center gap-4 mb-6">
                    <UAvatar :src="user?.image || ''" size="md" />
                    <div>
                        <p class="font-bold">{{ user?.name }}</p>
                        <p class="text-xs text-gray-500">{{ user?.email }}</p>
                    </div>
                </div>
                <UButton block color="gray" variant="ghost" icon="i-heroicons-arrow-left-on-rectangle" @click="signOut">
                    {{ t('nav.signOut') }}
                </UButton>
            </template>
            <template v-else>
                <UButton block color="primary" icon="i-heroicons-user" @click="signIn(undefined as any)">
                    {{ t('nav.signIn') }}
                </UButton>
            </template>
        </div>
      </div>
    </USlideover>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800 py-8 text-center text-sm text-gray-500 mt-12">
      <p>&copy; {{ new Date().getFullYear() }} bndstr. {{ t('common.allRightsReserved') }}</p>
      <p v-if="config.public.commitId" class="mt-1 text-[10px] font-mono opacity-30">{{ config.public.commitId.substring(0, 7) }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const colorMode = useColorMode();

const { t, locale, setLocale } = useI18n();
const { status, data, signIn, signOut } = useAuth()
const config = useRuntimeConfig()
const isDevMode = config.public.devMode
const isMenuOpen = ref(false)

function toggleLocale() {
    setLocale(locale.value === 'en' ? 'de' : 'en');
}

const user = computed(() => {
    if (isDevMode) {
        return { name: 'Chris', email: 'chris@example.org', image: '' }
    }
    return data.value?.user
})

const authStatus = computed(() => {
    if (isDevMode) return 'authenticated'
    return status.value
})

const userRole = computed(() => {
    if (isDevMode) return 'admin';
    return (data.value?.user as any)?.role || 'user';
});

const links = computed(() => {
  const baseLinks = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.calendar'), to: '/calendar' },
    { label: t('nav.setlist'), to: '/setlist' },
    { label: t('nav.voting'), to: '/voting' },
    { label: t('nav.bendAStand'), to: '/stand' }
  ];
  
  if (userRole.value === 'admin') {
    baseLinks.splice(5, 0, { label: t('nav.admin'), to: '/admin' });
  }
  
  return baseLinks;
});

const userDropdownItems = computed(() => [
  [{
    label: user.value?.email || t('common.signedIn'),
    slot: 'account',
    disabled: true
  }],
  [{
    label: t('nav.signOut'),
    icon: 'i-heroicons-arrow-left-on-rectangle',
    click: () => signOut()
  }]
]);
</script>
