import dayjs from 'dayjs';

// import types
import type { UserConfig } from 'vitepress';

// import utils
import { readAllPosts } from './read-posts';

/**
 * FrontMatter for post
 */
export interface PostFrontMatter {
  path: string;
  date: string;
  title: string;
  author: string;
  template: string;
  keywords: string[];
  description: string;
}

export interface ThemeConfig {
  logo?: string;
  title?: string;
  author?: string;
  description?: string;
  allPosts: PostFrontMatter[];
}

/**
 * Define config
 */
export interface DefineConfig extends UserConfig<Partial<ThemeConfig>> {}

interface PostSiteMapConf extends PostFrontMatter {
  lastmod: string;
  priority: number;
}

/**
 * Create `defineConfig` for `.vitepress`
 *
 * @param config Define config
 */
export function createDefineConfig(config: DefineConfig) {
  // Inject all posts
  config.themeConfig = config.themeConfig || {};
  config.themeConfig.allPosts = readAllPosts<PostFrontMatter>();

  // Initial root config
  config.title = config.title || config.themeConfig.title;
  config.description = config.description || config.themeConfig.description;

  const { transformHtml, ...defineConf } = config;

  const allPages = new Array<PostSiteMapConf>();
  const defineConfig = defineConf as DefineConfig;

  defineConfig.transformHtml = async (code, id, ctx) => {
    // archive/html.md → /archive/html
    const data = ctx.pageData;
    const conf = data.frontmatter || {};
    const path = `/${data.relativePath.replace(/((^|\/)index)?\.md$/, '$2')}`;
    const page = {
      path,
      date: conf.date || '',
      title: conf.title || '',
      author: conf.author || '',
      lastmod: dayjs(conf.date).toISOString(),
      priority: 0,
      template: conf.template || '',
      keywords: (conf.keywords || '').split(', ').filter((l: string) => l),
      description: conf.description || '',
    };

    switch (page.template) {
      case 'home': {
        page.priority = 1.0;
        break;
      }
      case 'allPost': {
        page.priority = 0.8;
        break;
      }
      case 'archive': {
        page.priority = 0.7;
        break;
      }
      default: {
        page.priority = 0.6;
        break;
      }
    }

    if (!path.includes('404')) {
      allPages.push(page);
    }

    if (transformHtml) {
      await transformHtml(code, id, ctx);
    }
  };

  if (defineConfig.sitemap && defineConfig.sitemap.hostname) {
    defineConfig.sitemap.transformItems = () => {
      return allPages
        .sort((x, y) => y.priority - x.priority)
        .map(page => ({
          url: page.path,
          lastmod: page.lastmod,
          priority: page.priority,
        }));
    };
  }

  return defineConfig;
}
