<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <!-- Root UI Components -->
  <UModals />
  <UNotifications />
</template>

<script setup lang="ts">
useHead({
  link: [
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicons/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicons/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicons/favicon-16x16.png' },
    { rel: 'manifest', href: '/favicons/site.webmanifest' },
    { rel: 'shortcut icon', href: '/favicons/favicon.ico' }
  ]
})
</script>
