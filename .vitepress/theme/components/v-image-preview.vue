<template>
  <!-- CSR -->
  <n-image v-if="inBrowser" class="image-preview" :src="src" :alt="alt" />

  <!-- SSR -->
  <img v-else class="image-preview" :src="src" :alt="alt" />
</template>

<script setup lang="ts">
  import { inBrowser, defineClientComponent } from 'vitepress';

  const NImage = defineClientComponent(() =>
    import('naive-ui/es/image').then(c => c.NImage)
  );

  const { src, alt } = defineProps<{ src: string; alt?: string }>();
</script>

<style lang="less">
  .image-preview {
    display: block;
  }

  .n-image-preview-container .n-image-preview-toolbar .n-base-icon {
    width: auto;
  }
</style>
