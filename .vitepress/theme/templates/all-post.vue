<template>
  <v-header />
  <v-breadcrumb :items="[{ name: 'Posts' }]" />
  <ul class="all-post">
    <li class="all-post-group" v-for="[year, posts] in allPosts" :key="year">
      <p class="all-post-year">{{ year }}</p>
      <section class="all-post-item" v-for="post in posts" :key="post.path">
        <a :href="post.path" :title="post.title">{{ post.title }}</a>
        <time>{{ post.date }}</time>
      </section>
    </li>
  </ul>
  <v-footer />
</template>

<script setup lang="ts">
  import dayjs from 'dayjs';
  import { computed } from 'vue';

  // import components
  import vHeader from '../components/v-header.vue';
  import vFooter from '../components/v-footer.vue';
  import vBreadcrumb from '../components/v-breadcrumb.vue';

  // import hooks
  import useDefineConfig from '../hooks/use-define-config';

  const rootConf = useDefineConfig();
  const allPosts = computed(() => {
    const allPostData = rootConf.allPosts || [];

    return Object.entries(
      allPostData.reduce<Record<string, typeof allPostData>>(
        (flatPosts, post) => {
          const date = dayjs(post.date);
          const year = date.year();

          flatPosts[year] = flatPosts[year] || [];
          flatPosts[year].push({
            ...post,
            date: date.format('MM.DD'),
          });

          return flatPosts;
        },
        {}
      )
    ).sort(([x], [y]) => +y - +x);
  });
</script>

<style lang="less">
  .all-post {
    margin-top: 0.4rem;

    .all-post-group + .all-post-group {
      margin-top: 2rem;
    }

    .all-post-year {
      font-size: 1.5rem;
      line-height: 2;
    }

    .all-post-item {
      display: flex;
      line-height: 2;

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
