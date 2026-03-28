<template>
  <div>
    <q-btn
      color="white"
      text-color="dark"
      icon="img:https://www.google.com/favicon.ico"
      label="Continue with Google"
      class="full-width q-mb-md"
      unelevated
      size="md"
      :loading="loadingGoogle"
      @click="loginGoogle"
    />

    <q-btn
      color="dark"
      text-color="white"
      icon="img:https://github.com/favicon.ico"
      label="Continue with GitHub"
      class="full-width q-btn-github"
      outline
      size="md"
      :loading="loadingGithub"
      @click="loginGithub"
    />

    <div v-if="error" class="q-mt-md text-negative text-center text-body2">
      {{ error }}
    </div>

    <div class="q-mt-lg text-caption text-grey-5 text-center">
      API_URL: {{ debugApiUrl }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authClient } from '../boot/auth'

const loadingGoogle = ref(false)
const loadingGithub = ref(false)
const error = ref<string | null>(null)
const debugApiUrl = (process.env.API_URL ?? '').trim() || '(empty)'

async function loginGoogle() {
  loadingGoogle.value = true
  error.value = null
  try {
    const result = await authClient.signIn.social({ provider: 'google', callbackURL: window.location.origin + '/' })
    if (result?.error) {
      throw new Error(result.error.message || 'Login failed')
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loadingGoogle.value = false
  }
}

async function loginGithub() {
  loadingGithub.value = true
  error.value = null
  try {
    const result = await authClient.signIn.social({ provider: 'github', callbackURL: window.location.origin + '/' })
    if (result?.error) {
      throw new Error(result.error.message || 'Login failed')
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loadingGithub.value = false
  }
}
</script>

<style scoped>
.q-btn-github {
  border-color: rgba(255, 255, 255, 0.35);
}
</style>
