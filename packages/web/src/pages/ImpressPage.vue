<template>
  <q-page class="impress-page">
    <div class="impress-content q-pa-md">
      <div class="impress-card">
        <Markdown :content="impressMarkdown" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import Markdown from '../components/Markdown.vue'

const impressMarkdown = `# Impress

Impressum
Angaben gemäß § 5 TMG
Four Keys Interactive GbR
Seestr. 110
71067 Sindelfingen

Vertreten durch:
Michael Mew
Christian Schneider
Niklas Arens
Christian Muellerschoen

Kontakt
Telefon: +49 (0)7031 / 68 80 421
E-Mail: contact@4ki.app

Umsatzsteuer-ID
Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
beantragt

Wirtschafts-ID
Wirtschaftsidentifikationsnummer gemäß § 139 c Abgabenordnung:
beantragt

Redaktionell Verantwortlicher
Christian Schneider und Christian Müllerschön
Seestr. 110
71067 Sindelfingen

EU-Streitschlichtung
Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr/.
Unsere E-Mail-Adresse finden Sie oben im Impressum.

Verbraucher­streit­beilegung/Universalschlichtungs­stelle
Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.`
</script>

<style scoped>
.impress-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.impress-content {
  flex: 1;
  max-width: 980px;
  margin: 0 auto;
  width: 100%;
}

.impress-card {
  background: rgba(148, 163, 184, 0.12);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 12px;
  padding: 24px;
}
</style>
