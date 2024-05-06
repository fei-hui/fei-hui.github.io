<template>
  <section class="empty">
    <img class="empty-image" :src="Embarrass" alt="empty-image" />
    <p class="empty-text">别急，已经在写了~ <del>新建文件夹 ing</del></p>
  </section>
</template>

<script setup lang="ts">
  // import images
  import Embarrass from '../assets/images/embarrass.svg';
</script>

<style lang="less">
  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    margin-top: 4rem;
    margin-bottom: 6rem;

    .empty-image {
      width: 4rem;
      margin-top: 2rem;
      margin-bottom: 2rem;
    }

    .empty-text {
      font-size: 1.2rem;
      text-align: center;

      del {
        display: block;
        margin-top: 0.8rem;
        font-size: 0.8rem;
        color: #999999;
      }
    }
  }
</style>
