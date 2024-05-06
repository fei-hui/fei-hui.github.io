---
template: home
---

<script setup lang="ts">
  import dayjs from 'dayjs';
  import { ref, computed } from 'vue';

  // import constants
  import { TECHNOLOGIES } from '../constants';
 
  // import icons
  import css from '../.vitepress/theme/assets/icons/css.svg';
  import vue from '../.vitepress/theme/assets/icons/vue.svg';
  import html from '../.vitepress/theme/assets/icons/html.svg';
  import rust from '../.vitepress/theme/assets/icons/rust.svg';
  import vite from '../.vitepress/theme/assets/icons/vite.svg';
  import react from '../.vitepress/theme/assets/icons/react.svg';
  import nodejs from '../.vitepress/theme/assets/icons/nodejs.svg';
  import typescript from '../.vitepress/theme/assets/icons/typescript.svg';

  const start_year = ref(2017);
  const today_year = ref(dayjs().year());
  const since_year = computed(() => today_year.value - start_year.value);

  const technologies = ref([
    { name: TECHNOLOGIES.HTML, icon: html },
    { name: TECHNOLOGIES.CSS, icon: css },
    { name: TECHNOLOGIES.TYPESCRIPT, icon: typescript },
    { name: TECHNOLOGIES.REACT, icon: react },
    { name: TECHNOLOGIES.VUE, icon: vue },
    { name: TECHNOLOGIES.NODEJS, icon: nodejs },
    { name: TECHNOLOGIES.VITE, icon: vite },
  ]);

  const learning_technologies = ref([
    { name: TECHNOLOGIES.RUST, icon: rust },
  ]);
</script>

<style lang="less">
  .technology-title {
    margin-top: 0.8rem !important;
    margin-bottom: 0.4rem !important;
  }

  .technology-list {
    margin-left: -0.6rem;

    & + .technology-title {
      margin-top: 0.6rem !important;
    }

    .technology-item {
      display: inline-flex;
      align-items: center;
      margin-left: 0.6rem;
      margin-bottom: 0.6rem;
      padding: 0.2rem 0.6rem 0.2rem 0.56rem;
      background-color: #f0f5ff;
      line-height: 1;
      border-radius: 6px;
      text-decoration: none;
      color: var(--vp-c-text-1)!important;
      transition: background-color .4s ease;

      &:hover {
        background-color: #c0cfed;
      }

      img {
        margin-left: -0.1rem;
        margin-right: 0.3rem;
      }

      span {
        font-size: 0.86rem;
      }
    }
  }
</style>

我是飞灰同学，一名 {{ since_year }} 年工作经验（ {{ start_year }} - {{ today_year }} ）的 Web 前端开发工程师，参与过多个百万级 PV 项目的架构设计、功能开发及性能优化，在 Web 前端、微信小程序、低代码等领域有着丰富的设计/开发经验。

<p class="technology-title">技术栈：</p>

<section class="technology-list">
  <a v-for="technology in technologies" :key="technology.name" class="technology-item" :href="`/archive/${technology.name.toLowerCase()}`">
    <img :src="technology.icon" width="20" height="20" />
    <span>{{ technology.name }}</span>
  </a>
</section>

<p class="technology-title">正在学习：</p>

<section class="technology-list">
  <a v-for="technology in learning_technologies" :key="technology.name" class="technology-item" :href="`/archive/${technology.name.toLowerCase()}`">
    <img :src="technology.icon" width="20" height="20" />
    <span>{{ technology.name }}</span>
  </a>
</section>
