<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center bg-grey-10">
        <div class="q-pa-lg auth-card">
          <div class="text-center q-mb-xl">
            <div class="text-h4 text-weight-bold text-white">bndstr</div>
            <div class="text-body2 text-grey-5 q-mt-xs">Band management for musicians</div>
          </div>
          <router-view />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface-raised, #16213e);
  border-radius: var(--radius, 12px);
  border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
}
</style>
