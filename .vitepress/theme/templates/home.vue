<template>
  <v-header />
  <section class="index-intro">
    <h4 class="index-intro-title">
      <span class="index-intro-icon">
        <img :src="Rose" alt="Oops! It's you" width="26" height="26" />
      </span>
      <span>About me</span>
    </h4>
    <Content class="index-intro-content" />
  </section>
  <dl class="index-post-list">
    <dt class="index-post-title">
      <span class="index-post-icon">
        <img :src="Trophy" alt="Recent posts" width="26" height="26" />
      </span>
      <span>Posts</span>
    </dt>
    <dd class="index-post-item" v-for="post in latestPosts" :key="post.path">
      <a class="index-post-link" :href="post.path">{{ post.title }}</a>
      <time class="index-post-date">{{ post.date }}</time>
    </dd>
    <dd class="index-post-more">
      <a href="/posts/">+ All Posts</a>
    </dd>
  </dl>
  <v-footer />
</template>

<script setup lang="ts">
  import dayjs from 'dayjs';
  import { computed } from 'vue';

  // import images
  import Rose from '../assets/images/rose.svg';
  import Trophy from '../assets/images/trophy.svg';

  // import components
  import vHeader from '../components/v-header.vue';
  import vFooter from '../components/v-footer.vue';

  // import hooks
  import useDefineConfig from '../hooks/use-define-config';

  const { allPosts = [] } = useDefineConfig();

  const latestPosts = computed(() => {
    return allPosts.slice(0, 10).map(post => ({
      ...post,
      date: dayjs(post.date).format('YYYY.MM.DD'),
    }));
  });
</script>

<style lang="less">
  .index-intro {
    margin-top: 3.6rem;

    .index-intro-title {
      display: flex;
      align-items: center;
      margin-bottom: 1.2rem;
      font-size: 1.42rem;
      font-weight: 500;
      line-height: 1;
    }

    .index-intro-icon {
      margin-right: 0.6rem;
    }

    .index-intro-content {
      text-align: justify;

      p {
        margin: 0;
        margin-bottom: 0.6rem;
      }
    }
  }

  .index-post-list {
    margin-top: 3.2rem;
    margin-bottom: 2rem;

    .index-post-title {
      display: flex;
      align-items: center;
      margin-bottom: 1.2rem;
      font-size: 1.42rem;
      font-weight: 500;
      line-height: 1;
    }

    .index-post-icon {
      margin-right: 0.6rem;
    }

    .index-post-item {
      display: flex;
      margin: 0;
      font-size: 0.96rem;
      line-height: 2.1;
    }

    .index-post-link {
      flex: 1;
      overflow: hidden;
      padding-right: 1rem;
      word-break: break-all;
      white-space: nowrap;
      text-overflow: ellipsis;

      &:hover {
        text-decoration: underline;
      }
    }

    .index-post-date {
      font-size: 0.88rem;
      color: #a9a9b3;
    }

    .index-post-more {
      margin: 1.6rem 0 0;
      text-align: center;

      a {
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
</style>
