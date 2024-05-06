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

/**
 * Create `defineConfig` for `.vitepress`
 *
 * @param config Define config
 */
function createDefineConfig(config: DefineConfig) {
  // Inject all posts
  config.themeConfig = config.themeConfig || {};
  config.themeConfig.allPosts = readAllPosts<PostFrontMatter>();

  // Initial root config
  config.title = config.title || config.themeConfig.title;
  config.description = config.description || config.themeConfig.description;

  return config;
}

export default createDefineConfig;
