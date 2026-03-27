<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center">
        <div class="q-pa-lg auth-card">
          <div class="text-center q-mb-xl">
            <div class="text-h4 text-weight-bold text-white" style="letter-spacing: -0.03em">bndstr</div>
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
}
</style>
