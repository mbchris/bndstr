<template>
  <div class="login-page-wrap">
    <q-btn
      v-if="isDebugMode"
      class="debug-icon-btn"
      icon="bug_report"
      round
      dense
      flat
      color="grey-4"
      @click="showDebugDialog = true"
    />

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

    <div v-if="isDebugMode" class="q-mt-sm">
      <q-btn
        class="full-width"
        color="grey-7"
        text-color="white"
        outline
        size="sm"
        icon="bug_report"
        label="Open Debug"
        @click="showDebugDialog = true"
      />
    </div>

    <div v-if="error" class="q-mt-md text-negative text-center text-body2">
      {{ error }}
    </div>

    <q-dialog v-if="isDebugMode" v-model="showDebugDialog">
      <q-card class="debug-card">
        <q-card-section class="row items-center q-pb-sm">
          <div class="text-subtitle1">Debug Info</div>
          <q-space />
          <q-btn dense flat round icon="close" @click="showDebugDialog = false" />
        </q-card-section>
        <q-separator />
        <q-card-section class="debug-content text-caption">
          <div>DEBUG_MODE (raw): {{ debugModeRaw }}</div>
          <div>Native platform: {{ isNative }}</div>
          <div>Platform: {{ platform }}</div>
          <div>Window origin: {{ windowOrigin }}</div>
          <div>Window href: {{ windowHref }}</div>
          <div>API_URL (raw): {{ debugApiUrlRaw }}</div>
          <div>API base (effective): {{ debugApiBase }}</div>
          <div>Auth URL (effective): {{ debugAuthUrl }}</div>
          <div>MOBILE_CALLBACK_URL (raw): {{ debugMobileCallbackUrlRaw }}</div>
          <div>Social callback (effective): {{ socialCallbackUrl }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-sm">
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
        </q-card-section>
        <q-card-section v-if="debugOutput" class="q-pt-none">
          <div class="debug-output">
            {{ debugOutput }}
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { authClient } from '../boot/auth'

const loadingGoogle = ref(false)
const loadingGithub = ref(false)
const error = ref<string | null>(null)
const testingAuth = ref(false)
const testingBands = ref(false)
const debugOutput = ref('')
const showDebugDialog = ref(false)
const isDebugMode = (process.env.DEBUG_MODE ?? '').toLowerCase() === 'true'
const debugModeRaw = process.env.DEBUG_MODE ?? '(unset)'
const isNative = Capacitor.isNativePlatform()
const platform = Capacitor.getPlatform()
const windowOrigin = window.location.origin
const windowHref = window.location.href
const rawApiUrl = (process.env.API_URL ?? '').trim()
const debugApiUrlRaw = rawApiUrl || '(empty)'
const normalizedApiBase = (rawApiUrl || '').replace(/\/+$/, '').replace(/\/api$/, '')
const debugApiBase = normalizedApiBase || '(same-origin /api)'
const debugAuthUrl = normalizedApiBase ? `${normalizedApiBase}/api/auth` : '/api/auth'
const mobileCallbackUrlRaw = (process.env.MOBILE_CALLBACK_URL ?? '').trim()
const debugMobileCallbackUrlRaw = mobileCallbackUrlRaw || '(empty)'
const nativeCallbackUrl = mobileCallbackUrlRaw || 'org.capacitor.bndstr://localhost/login'
const socialCallbackUrl = isNative ? nativeCallbackUrl : `${window.location.origin}/`
const nativeOauthStartUrlBase = normalizedApiBase ? `${normalizedApiBase}/api/mobile-auth/start` : ''

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
    if (isNative) {
      await startNativeSocialLogin('google')
    } else {
      const result = await authClient.signIn.social({ provider: 'google', callbackURL: socialCallbackUrl })
      if (result?.error) {
        throw new Error(result.error.message || 'Login failed')
      }
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
    if (isNative) {
      await startNativeSocialLogin('github')
    } else {
      const result = await authClient.signIn.social({ provider: 'github', callbackURL: socialCallbackUrl })
      if (result?.error) {
        throw new Error(result.error.message || 'Login failed')
      }
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loadingGithub.value = false
  }
}

async function startNativeSocialLogin(provider: 'google' | 'github') {
  if (!nativeOauthStartUrlBase) {
    throw new Error('Native OAuth requires API_URL to be configured')
  }

  const startUrl =
    `${nativeOauthStartUrlBase}?provider=${encodeURIComponent(provider)}` +
    `&callbackURL=${encodeURIComponent(socialCallbackUrl)}` +
    `&errorCallbackURL=${encodeURIComponent(socialCallbackUrl)}`

  const popup = window.open(startUrl, '_blank', 'noopener,noreferrer')
  if (!popup) {
    window.location.href = startUrl
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
.login-page-wrap {
  position: relative;
}

.q-btn-github {
  border-color: rgba(255, 255, 255, 0.35);
}

.debug-icon-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  z-index: 2;
}

.debug-card {
  width: min(92vw, 760px);
  max-height: 86vh;
}

.debug-content {
  white-space: pre-wrap;
  word-break: break-word;
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
