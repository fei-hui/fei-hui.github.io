import { reactive } from 'vue';

// import hooks
import { useData } from 'vitepress';

// import types
import type { ThemeConfig } from 'scripts/create-define-config';

export type PostList = ThemeConfig['allPosts'];

/**
 * Define config hooks
 */
function useDefineConfig() {
  const { theme } = useData();

  return reactive<ThemeConfig>(theme.value);
}

export default useDefineConfig;
