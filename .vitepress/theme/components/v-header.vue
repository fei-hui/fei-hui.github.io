<template>
  <header class="header">
    <h2 v-if="title" class="header-title">{{ title }}</h2>
    <p v-if="description" class="header-description">{{ description }}</p>
  </header>
</template>

<script setup lang="ts">
  // import hooks
  import useDefineConfig from '../hooks/use-define-config';

  const { title, description } = useDefineConfig();
</script>

<style lang="less">
  .header {
    .header-title {
      font-size: 2rem;
      line-height: 1.6;
    }

    .header-description {
      font-size: 0.96rem;
      line-height: 1.6;
      color: #999999;
    }

    .header-content {
      overflow: hidden;
      margin-top: 2rem;
      font-size: 0.96rem;
      text-align: justify;

      p {
        margin: 0;
      }
    }
  }
</style>
