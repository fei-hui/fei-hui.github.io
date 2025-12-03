// import scripts
import { createDefineConfig } from './scripts/create-define-config';

// Export `vitepress` config
// wiki: https://vitepress.dev/reference/site-config
export default createDefineConfig({
  lang: 'zh-cn',
  srcDir: 'docs',
  cleanUrls: true,
  ignoreDeadLinks: true,
  markdown: {
    math: true,
    config(md) {
      // Overwrite image rules
      md.renderer.rules.image = function (tokens, idx, options, env, self) {
        const token = tokens[idx];

        const alt = token.content;
        const src = token.attrGet('src');

        const children = token.children || [];

        // Replace inline component
        return `<v-image-preview src="${src}" alt="${alt}">${self.renderToken(children, 0, options)}</v-image-preview>`;
      };
    },
  },
  contentProps: {
    class: 'vp-doc',
  },

  vite: {
    ssr: {
      noExternal: ['naive-ui'],
    },
  },

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
    [
      'meta',
      {
        name: 'google-site-verification',
        content: 'eYzWXqI9itQXscYhdHVPNbB-TaCJBylQgTrOpAJ3l94',
      },
    ],
  ],

  themeConfig: {
    title: '飞灰同学',
    author: 'Fei-hui',
    description: '书山有路勤为径，学海无涯苦作舟',
  },

  sitemap: {
    hostname: 'https://fei-hui.github.io',
  },
});
