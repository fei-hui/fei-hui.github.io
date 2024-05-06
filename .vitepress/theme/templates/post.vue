<template>
  <v-header />
  <v-breadcrumb
    :items="[{ name: 'Posts', path: '/posts/' }, { name: title }]"
  />
  <article class="post">
    <section class="post-meta">
      <h1 class="post-meta-title">{{ title }}</h1>
      <section class="post-meta-info">
        <span>{{ author || defaultAuthor || '' }}</span>
        <span>{{ date }}</span>
      </section>
    </section>
    <v-content />
    <section class="post-link">
      <p class="post-link-item">
        <span>上一篇：</span>
        <a v-if="link.prev" :href="link.prev.path">{{ link.prev.title }}</a>
        <span v-else>没有了</span>
      </p>
      <p class="post-link-item">
        <span>下一篇：</span>
        <a v-if="link.next" :href="link.next.path">{{ link.next.title }}</a>
        <span v-else>没有了</span>
      </p>
    </section>
  </article>
  <v-footer />
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  // import components
  import vHeader from '../components/v-header.vue';
  import vFooter from '../components/v-footer.vue';
  import vContent from '../components/v-content.vue';
  import vBreadcrumb from '../components/v-breadcrumb.vue';

  // import hooks
  import useFrontMatter from '../hooks/use-front-matter';
  import useDefineConfig from '../hooks/use-define-config';

  const { title, author, date } = useFrontMatter();
  const { allPosts, author: defaultAuthor } = useDefineConfig();

  const link = computed(() => {
    const index = allPosts.findIndex(post => post.title === title);
    return {
      prev: allPosts[index - 1] || null,
      next: allPosts[index + 1] || null,
    };
  });
</script>

<style lang="less">
  .post {
    margin-top: 1.4rem;

    .post-meta {
      margin-bottom: 2rem;
      padding-bottom: 1.6rem;
      border-bottom: 1px solid #e3e3e3;

      .post-meta-title {
        font-size: 1.6rem;
        line-height: 1.8;
      }

      .post-meta-info {
        margin-top: 0.4rem;
        font-size: 0.78rem;
        color: #a3a3a3;

        span + span {
          margin-left: 0.68rem;
        }
      }
    }

    .post-link {
      margin-top: 4rem;
      padding-top: 2rem;
      font-size: 0.88rem;
      line-height: 2;
      color: #555555;
      border-top: 1px solid #e3e3e3;

      .post-link-item {
        span:last-child {
          color: #999999;
        }
      }

      a:hover {
        text-decoration: underline;
      }
    }

    .vp-doc {
      font-size: 0.88rem;

      h4 {
        margin-top: 16px;
      }

      p {
        text-align: justify;
      }

      strong {
        font-weight: 900;
      }

      blockquote > p {
        font-size: inherit;
      }

      :not(pre, h1, h2, h3, h4, h5, h6) > code {
        display: inline-block;
        padding: 3px;
        font-size: 0.8rem;
        line-height: 1;
        transform: translateY(-1px);
        background-color: transparent;
      }

      h1 > code,
      h2 > code,
      h3 > code,
      h4 > code,
      h5 > code,
      h6 > code {
        padding: 0 6px;
        font-size: 96%;
        font-weight: normal;
        background-color: transparent;
        color: var(--vp-c-red-2);
      }

      .custom-block {
        p {
          line-height: 28px;
        }

        code {
          color: var(--vp-c-red-2);
        }

        .custom-block-title {
          font-size: 120%;
          line-height: 2;
        }
      }

      .header-anchor {
        margin-left: -0.7em;
        font-size: 1.3rem;
      }

      @media (max-width: 600px) {
        .vp-block,
        .vp-code-group,
        div[class*='language-'] {
          margin-right: -1rem;
          margin-left: -1rem;
        }
      }

      .vp-code-group .tabs,
      .custom-block div[class*='language-'],
      .vp-code-group div[class*='language-'] {
        margin-right: initial;
        margin-left: initial;
      }
    }
  }
</style>
