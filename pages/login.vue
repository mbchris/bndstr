<template>
  <div class="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-950 relative">
    <!-- Language Toggle -->
    <button 
      class="absolute top-4 right-4 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors"
      @click="setLocale(locale === 'en' ? 'de' : 'en')"
    >
      {{ locale === 'en' ? '🇩🇪 DE' : '🇬🇧 EN' }}
    </button>
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <img src="~/assets/bndstr_rect_bl.png" alt="bndstr Logo" class="h-16 w-auto dark:hidden">
        <img src="~/assets/bndstr_rect_wh.png" alt="bndstr Logo" class="h-16 w-auto hidden dark:block">
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white font-display">
        {{ t('login.title') }}
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        {{ t('login.subtitle') }}
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-gray-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-800">
        <div class="space-y-4">
          <UButton
            block size="lg" color="white" variant="solid"
            class="flex justify-center items-center gap-3 py-3 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-semibold"
            @click="handleSignIn('google')"
          >
            <template #leading>
              <UIcon name="i-simple-icons-google" class="w-5 h-5 text-[#4285F4]" />
            </template>
            {{ t('login.google') }}
          </UButton>

          <UButton
            block size="lg" color="black" variant="solid"
            class="flex justify-center items-center gap-3 py-3 hover:bg-gray-800 dark:hover:bg-gray-700 transition-all font-semibold"
            @click="handleSignIn('github')"
          >
            <template #leading>
              <UIcon name="i-simple-icons-github" class="w-5 h-5" />
            </template>
            {{ t('login.github') }}
          </UButton>

          <!-- Dev Bypass Button -->
          <UButton
            v-if="runtimeConfig.public.devMode"
            block size="lg" color="white" variant="solid"
            class="flex justify-center items-center gap-3 py-3 ring-1 ring-gray-200 dark:ring-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-bold text-gray-700 dark:text-gray-300"
            @click="handleDevLogin"
          >
            <template #leading>
              <UIcon name="i-heroicons-beaker" class="w-5 h-5 text-purple-500" />
            </template>
            Dev Login (Admin)
          </UButton>
        </div>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-900 text-gray-500">{{ t('login.authorizedOnly') }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="error" class="mt-4 p-3 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center border border-red-200 dark:border-red-800">
          {{ errorMsg }}
        </div>

        <div class="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          <UButton color="gray" variant="ghost" size="sm" icon="i-heroicons-arrow-left-on-rectangle" @click="handleSignOut">
            {{ t('login.clearSession') }}
          </UButton>
          <p class="mt-2 text-[10px] text-gray-400">
            {{ t('login.clearSessionHint') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t, locale, setLocale } = useI18n();
const { signIn, signOut } = useAuth()
const route = useRoute()

const error = computed(() => route.query.error)
const errorMsg = computed(() => {
  if (error.value === 'Signin') return t('login.errorSignin')
  if (error.value === 'OAuthSignin') return t('login.errorSignin')
  if (error.value === 'OAuthCallback') return t('login.errorOAuth')
  if (error.value === 'OAuthCreateAccount') return t('login.errorCreateAccount')
  if (error.value === 'EmailSignin') return t('login.errorEmail')
  if (error.value === 'CredentialsSignin') return t('login.errorCredentials')
  return t('login.errorGeneric')
})

const handleSignIn = async (provider: string) => {
  try {
    await signIn(provider, { callbackUrl: '/' })
  } catch (e) {
    console.error('Sign in error:', e)
  }
}

const runtimeConfig = useRuntimeConfig()
const handleDevLogin = async () => {
  try {
    // Specifically use the 'credentials' provider with a mock email
    await signIn('credentials', { 
      email: 'schneider.chris@gmx.de',
      callbackUrl: '/' 
    })
  } catch (e) {
    console.error('Dev login error:', e)
  }
}

const handleSignOut = async () => {
  try {
    await signOut({ callbackUrl: '/login', redirect: true })
  } catch (e) {
    console.error('Sign out error:', e)
  }
}

definePageMeta({
  layout: false,
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/',
  }
})

useHead({
  title: 'Login — bndstr'
})
</script>
