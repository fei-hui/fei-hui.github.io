import { reactive } from 'vue';

// import hooks
import { useData } from 'vitepress';

// import types
import type { PostFrontMatter } from 'scripts/create-define-config';

// Front matter types
type FrontMatter = Omit<PostFrontMatter, 'path'>;

/**
 * Front matter hooks
 */
function useFrontMatter() {
  const { page } = useData();

  return reactive(page.value.frontmatter as FrontMatter);
}

export default useFrontMatter;
