<template>
  <div class="markdown-body" v-html="parsed" />
</template>

<script setup lang="ts">
import { marked } from 'marked';
import { computed } from 'vue';

const props = defineProps<{ content?: string | null }>();

const parsed = computed(() => {
    if (!props.content) return '';
    try {
        // Simple synchronous parse
        return marked.parse(props.content, { breaks: true });
    } catch (e) {
        console.error('Markdown parse error:', e);
        return props.content;
    }
});
</script>

<style scoped>
.markdown-body :deep(p) { margin-bottom: 0.75rem; }
.markdown-body :deep(p:last-child) { margin-bottom: 0; }
.markdown-body :deep(ul) { list-style-type: disc; margin-left: 1.25rem; margin-bottom: 0.75rem; }
.markdown-body :deep(ol) { list-style-type: decimal; margin-left: 1.25rem; margin-bottom: 0.75rem; }
.markdown-body :deep(li) { margin-bottom: 0.25rem; }
.markdown-body :deep(strong) { font-weight: 700; }
.markdown-body :deep(em) { font-style: italic; }
.markdown-body :deep(a) { color: var(--color-primary-500); text-decoration: underline; }
.markdown-body :deep(code) { background: rgba(0,0,0,0.05); padding: 0.1rem 0.3rem; border-radius: 0.2rem; font-family: monospace; }
</style>
