<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-col-gutter-sm q-mb-md">
      <div class="col">
        <div class="text-h5">Billing</div>
        <div class="text-caption text-grey-6">
          Current plan:
          <span class="text-weight-bold">{{ currentPlanLabel }}</span>
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          outline
          color="primary"
          icon="manage_accounts"
          label="Manage subscription"
          :disable="!isOwner || loadingPortal"
          :loading="loadingPortal"
          @click="openPortal"
        />
      </div>
    </div>

    <q-banner v-if="!isOwner" class="bg-grey-9 text-white q-mb-md rounded-borders">
      Only band owners can change subscription plans.
    </q-banner>

    <div class="row q-col-gutter-md">
      <div v-for="plan in plans" :key="plan.id" class="col-12 col-md-4">
        <q-card bordered flat>
          <q-card-section>
            <div class="text-h6">{{ plan.name }}</div>
            <div class="text-subtitle1 q-mt-sm">
              {{ formatPlanPrice(plan) }}
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="text-caption text-grey-7 q-mb-xs">Limits</div>
            <div class="text-body2">Bands: {{ formatLimit(plan.limits.bands) }}</div>
            <div class="text-body2">Songs: {{ formatLimit(plan.limits.songs) }}</div>
            <div class="text-body2">Members: {{ formatLimit(plan.limits.members) }}</div>
          </q-card-section>

          <q-card-actions align="right">
            <q-chip
              v-if="currentPlan === plan.id"
              color="primary"
              text-color="white"
              size="sm"
              icon="check"
              label="Current plan"
            />

            <q-btn
              v-else
              color="primary"
              :outline="plan.id === 'free'"
              :label="plan.id === 'free' ? 'Free plan' : `Choose ${plan.name}`"
              :disable="!isOwner || loadingCheckout || plan.id === 'free'"
              :loading="loadingCheckout && selectedPlan === plan.id"
              @click="startCheckout(plan.id)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Notify } from 'quasar'
import { useRoute } from 'vue-router'
import { apiJson } from '../boot/api'
import { useAuthStore } from '../stores/auth'

type PlanId = 'free' | 'band' | 'pro'

type Plan = {
  id: PlanId
  name: string
  price: number
  currency: string
  limits: {
    bands: number | null
    songs: number | null
    members: number | null
  }
}

const authStore = useAuthStore()
const route = useRoute()

const plans = ref<Plan[]>([])
const currentPlan = ref<PlanId>('free')
const loadingCheckout = ref(false)
const loadingPortal = ref(false)
const selectedPlan = ref<PlanId | null>(null)

const isOwner = computed(() => authStore.activeBand?.role === 'owner')

const currentPlanLabel = computed(() => {
  const plan = plans.value.find((p) => p.id === currentPlan.value)
  return plan?.name ?? currentPlan.value
})

function formatLimit(value: number | null) {
  return value === null ? 'Unlimited' : String(value)
}

function formatPlanPrice(plan: Plan) {
  if (plan.price === 0) return 'Free'
  return `${plan.price} ${plan.currency}/month`
}

async function loadBilling() {
  try {
    const data = await apiJson<{ currentPlan: PlanId; plans: Plan[] }>('/billing/plans')
    currentPlan.value = data.currentPlan
    plans.value = data.plans
    const memberships = await apiJson<typeof authStore.bands>('/bands')
    authStore.setBands(memberships)
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to load billing data',
    })
  }
}

async function startCheckout(plan: PlanId) {
  if (plan === 'free') return
  loadingCheckout.value = true
  selectedPlan.value = plan
  try {
    const data = await apiJson<{ url: string }>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    })
    if (data.url) {
      window.location.href = data.url
      return
    }
    throw new Error('Checkout URL missing')
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to create checkout session',
    })
  } finally {
    loadingCheckout.value = false
    selectedPlan.value = null
  }
}

async function openPortal() {
  loadingPortal.value = true
  try {
    const data = await apiJson<{ url: string }>('/billing/portal')
    if (data.url) {
      window.location.href = data.url
      return
    }
    throw new Error('Portal URL missing')
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to open billing portal',
    })
  } finally {
    loadingPortal.value = false
  }
}

onMounted(() => {
  if (route.query.checkout === 'success') {
    Notify.create({ type: 'positive', message: 'Checkout completed. Refreshing billing status.' })
  } else if (route.query.checkout === 'cancel') {
    Notify.create({ type: 'warning', message: 'Checkout was canceled.' })
  }
  loadBilling()
})
</script>
