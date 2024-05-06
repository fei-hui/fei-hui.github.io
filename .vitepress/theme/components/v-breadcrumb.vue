<template>
  <section class="breadcrumb">
    <a class="breadcrumb-link" href="/">Home</a>
    <template v-for="item in items" :key="item.path">
      <span class="breadcrumb-separator">/</span>
      <a v-if="item.path" class="breadcrumb-link" :href="item.path">{{
        item.name
      }}</a>
      <span v-else class="breadcrumb-link">{{ item.name }}</span>
    </template>
  </section>
</template>

<script setup lang="ts">
  interface Breadcrumb {
    name: string;
    path?: string;
  }

  const { items = [] } = defineProps<{ items: Breadcrumb[] }>();
</script>

<style lang="less">
  .breadcrumb {
    display: flex;
    margin-top: 2rem;
    margin-bottom: 0.4rem;
    margin-left: 0.04rem;

    .breadcrumb-link {
      display: inline-block;
      flex: 1;
      overflow: hidden;
      max-width: fit-content;
      font-size: 0.8rem;
      color: #666666;
      word-break: break-all;
      text-overflow: ellipsis;
      vertical-align: top;
      text-wrap: nowrap;
    }

    a.breadcrumb-link:hover {
      text-decoration: underline;
    }

    .breadcrumb-separator {
      display: inline-block;
      margin-right: 0.4rem;
      margin-left: 0.38rem;
      font-size: 0.78rem;
      color: #d3d3d3;
      vertical-align: top;
    }
  }
</style>
