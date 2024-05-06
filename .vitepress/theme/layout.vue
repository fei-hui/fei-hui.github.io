<template>
  <component v-if="template && templates[template]" :is="templates[template]" />
  <not-found v-else />
</template>

<script setup lang="ts">
  import { type DefineComponent } from 'vue';

  // import templates
  import Home from './templates/home.vue';
  import Post from './templates/post.vue';
  import Archive from './templates/archive.vue';
  import AllPost from './templates/all-post.vue';
  import NotFound from './templates/not-found.vue';

  // import hooks
  import useFrontMatter from './hooks/use-front-matter';

  const fm = useFrontMatter();

  const template = fm.template || '';
  const templates: Record<string, DefineComponent<{}, {}, any>> = {
    home: Home,
    post: Post,
    archive: Archive,
    allPost: AllPost,
  };
</script>

<style lang="less">
  * {
    -webkit-tap-highlight-color: transparent;
  }

  body {
    font-family: 'Noto Serif SC', serif, monospace;
  }

  #app {
    width: 100%;
    max-width: 680px;
    margin-right: auto;
    margin-left: auto;
    padding: 3.2rem 1rem 0;
  }
</style>
