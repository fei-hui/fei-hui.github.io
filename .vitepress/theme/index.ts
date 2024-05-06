import { h, ref } from 'vue';
import { useRouter, type Theme } from 'vitepress';

// import fonts
import '@fontsource/noto-serif-sc/600.css';
import '@fontsource/noto-serif-sc/900.css';

// import styles
import 'vitepress/dist/client/theme-default/styles/base.css';
import 'vitepress/dist/client/theme-default/styles/vars.css';
import 'vitepress/dist/client/theme-default/styles/icons.css';
import 'vitepress/dist/client/theme-default/styles/utils.css';
import 'vitepress/dist/client/theme-default/styles/components/vp-doc.css';
import 'vitepress/dist/client/theme-default/styles/components/vp-code.css';
import 'vitepress/dist/client/theme-default/styles/components/vp-sponsor.css';
import 'vitepress/dist/client/theme-default/styles/components/custom-block.css';
import 'vitepress/dist/client/theme-default/styles/components/vp-code-group.css';

// import layouts
import Layout from './layout.vue';

// import components
import ImagePreview from './components/v-image-preview.vue';

// Theme config
const themeConfig: Theme = {
  Layout() {
    const key = ref(Date.now());
    const router = useRouter();

    // Update unique component key when route changed
    router.onAfterRouteChanged = () => {
      key.value = Date.now();
    };

    return h(Layout, { key: key.value });
  },
  enhanceApp({ app }) {
    app.component('v-image-preview', ImagePreview);
  },
};

export default themeConfig;
