<template>
  <v-header />
  <v-breadcrumb :items="[{ name: 'Archive' }]" />
  <h2 class="archive-title">{{ archive || '' }}</h2>
  <ul class="archive-list" v-if="allPosts.length > 0">
    <li class="archive-item" v-for="post in allPosts" :key="post.path">
      <a :href="post.path" :title="post.title">{{ post.title }}</a>
      <time>{{ post.date }}</time>
    </li>
  </ul>
  <v-empty v-else />
  <v-footer />
</template>

<script setup lang="ts">
  import dayjs from 'dayjs';
  import { computed } from 'vue';
  import { useRoute } from 'vitepress';

  // import components
  import vEmpty from '../components/v-empty.vue';
  import vHeader from '../components/v-header.vue';
  import vFooter from '../components/v-footer.vue';
  import vBreadcrumb from '../components/v-breadcrumb.vue';

  // import hooks
  import useDefineConfig from '../hooks/use-define-config';

  // import enums
  import { TECHNOLOGIES } from '../../../constants';

  // import types
  import type { PostFrontMatter } from '../../scripts/create-define-config';

  const route = useRoute();
  const rootConf = useDefineConfig();

  const archive = computed(() => {
    const { archive } = route.data.params || { archive: '' };
    return Object.values(TECHNOLOGIES).find(
      technology => technology.toLowerCase() === archive.toLowerCase()
    );
  });
  const allPosts = computed(() => {
    const allPostData = rootConf.allPosts || [];
    const { archive } = route.data.params || { archive: '' };

    return allPostData.reduce<PostFrontMatter[]>((allPosts, post) => {
      const archives = post.keywords.map(keyword => keyword.toLowerCase());

      if (archives.includes(archive)) {
        allPosts.push({
          ...post,
          date: dayjs(post.date).format('YYYY.MM.DD'),
        });
      }

      return allPosts;
    }, []);
  });
</script>

<style lang="less">
  .archive-title {
    padding-top: 0.4rem;
    padding-bottom: 1rem;
    font-size: 1.8rem;
    line-height: 1.6;
  }

  .archive-list {
    margin-top: 0.4rem;

    .archive-item {
      display: flex;
      line-height: 2.3;

      a {
        flex: 1;
        overflow: hidden;
        padding-right: 1rem;
        font-size: 0.92rem;
        word-break: break-all;
        white-space: nowrap;
        text-overflow: ellipsis;

        &:hover {
          text-decoration: underline;
        }
      }

      time {
        font-size: 0.88rem;
        color: #a9a9b3;
      }
    }
  }
</style>
