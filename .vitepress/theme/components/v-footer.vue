<template>
  <footer class="footer">
    <p class="footer-copyright">
      Copyright {{ year }} © <a href="/">{{ author }}</a>
    </p>
  </footer>
</template>

<script setup lang="ts">
  import dayjs from 'dayjs';

  // import hooks
  import useDefineConfig from '../hooks/use-define-config';

  const year = dayjs().year();

  const { author } = useDefineConfig();
</script>

<style lang="less">
  .footer {
    padding-top: 4rem;
    padding-bottom: 2rem;

    .footer-copyright {
      font-size: 0.8rem;
      line-height: 2;

      a:hover {
        text-decoration: underline;
      }
    }
  }
</style>
