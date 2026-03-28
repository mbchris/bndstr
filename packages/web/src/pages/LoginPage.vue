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
      <div>API_URL (raw): {{ debugApiUrlRaw }}</div>
      <div>API base (effective): {{ debugApiBase }}</div>
      <div>Auth URL (effective): {{ debugAuthUrl }}</div>
    </div>

    <div class="q-mt-md row q-col-gutter-sm">
      <div class="col-12 col-sm-6">
        <q-btn
          class="full-width"
          color="primary"
          outline
          size="sm"
          :loading="testingAuth"
          label="Test Auth Endpoint"
          @click="testAuthEndpoint"
        />
      </div>
      <div class="col-12 col-sm-6">
        <q-btn
          class="full-width"
          color="secondary"
          outline
          size="sm"
          :loading="testingBands"
          label="Test Bands Endpoint"
          @click="testBandsEndpoint"
        />
      </div>
    </div>

    <div v-if="debugOutput" class="q-mt-md text-caption text-grey-4 debug-output">
      {{ debugOutput }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authClient } from '../boot/auth'

const loadingGoogle = ref(false)
const loadingGithub = ref(false)
const error = ref<string | null>(null)
const testingAuth = ref(false)
const testingBands = ref(false)
const debugOutput = ref('')
const rawApiUrl = (process.env.API_URL ?? '').trim()
const debugApiUrlRaw = rawApiUrl || '(empty)'
const normalizedApiBase = (rawApiUrl || '').replace(/\/+$/, '').replace(/\/api$/, '')
const debugApiBase = normalizedApiBase || '(same-origin /api)'
const debugAuthUrl = normalizedApiBase ? `${normalizedApiBase}/api/auth` : '/api/auth'

function buildTestUrls(path: string): string[] {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const urls = new Set<string>()

  if (normalizedApiBase) {
    urls.add(`${normalizedApiBase}/api${normalizedPath}`)
  }
  urls.add(`/api${normalizedPath}`)

  return [...urls]
}

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

async function runEndpointTest(label: string, path: string) {
  const started = Date.now()
  const urls = buildTestUrls(path)
  const errors: string[] = []

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      const text = await res.text()
      const preview = text.length > 500 ? `${text.slice(0, 500)}...` : text
      debugOutput.value =
        `[${label}] OK\n` +
        `url=${url}\n` +
        `status=${res.status} ${res.statusText}\n` +
        `duration_ms=${Date.now() - started}\n` +
        `body=${preview || '(empty)'}`
      return
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      errors.push(`url=${url} error=${message}`)
    }
  }

  debugOutput.value =
    `[${label}] ERROR\n` +
    `duration_ms=${Date.now() - started}\n` +
    `window_origin=${window.location.origin}\n` +
    `api_url_raw=${debugApiUrlRaw}\n` +
    `${errors.join('\n') || 'No request attempts were made'}`
}

async function testAuthEndpoint() {
  testingAuth.value = true
  try {
    await runEndpointTest('Auth Test', '/auth/get-session')
  } finally {
    testingAuth.value = false
  }
}

async function testBandsEndpoint() {
  testingBands.value = true
  try {
    await runEndpointTest('Bands Test', '/bands')
  } finally {
    testingBands.value = false
  }
}
</script>

<style scoped>
.q-btn-github {
  border-color: rgba(255, 255, 255, 0.35);
}

.debug-output {
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.22);
}
</style>
