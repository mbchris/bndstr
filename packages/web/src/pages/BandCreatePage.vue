<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card class="q-pa-lg" style="min-width: 360px">
      <q-card-section>
        <div class="text-h6 q-mb-md">Create a new band</div>

        <q-input
          v-model="form.name"
          label="Band name"
          outlined
          dense
          class="q-mb-sm"
          @update:model-value="autoSlug"
        />

        <q-input
          v-model="form.slug"
          label="URL slug (a-z, 0-9, -)"
          outlined
          dense
          class="q-mb-md"
          :rules="[v => /^[a-z0-9-]+$/.test(v) || 'Only lowercase letters, numbers, and hyphens']"
        />

        <q-btn
          label="Create band"
          color="primary"
          unelevated
          class="full-width"
          :loading="loading"
          :disable="!form.name || !form.slug"
          @click="submit"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiJson } from '../boot/api'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)

const form = reactive({ name: '', slug: '' })

function autoSlug(name: string) {
  form.slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function submit() {
  loading.value = true
  try {
    const band = await apiJson<{ id: number; name: string; slug: string; plan: string }>('/bands', {
      method: 'POST',
      body: JSON.stringify(form),
    })
    // Refresh band list and switch to new band
    const bands = await apiJson<typeof authStore.bands>('/bands')
    authStore.setBands(bands)
    authStore.setActiveBand(band.id)
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>
