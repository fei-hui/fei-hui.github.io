import path from 'path';
import dayjs from 'dayjs';
import matter from 'gray-matter';

import { globSync } from 'glob';

type MarkdownMeta<T> = T & { path: string; keywords: string[] };

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DOCS_DIR = path.resolve(ROOT_DIR, 'docs');

type ReadPostOptions = {
  /**
   * Only read post
   */
  onlyPost?: boolean;
};

/**
 * Get all post
 */
export function readAllPosts<T>(options?: ReadPostOptions) {
  const { onlyPost = true } = options || {};

  // Match:
  // 1. docs/about.md
  // 2. docs/posts/posts-1.md
  // 3. docs/sponsor/index.md
  const allPostPaths = globSync(['*.md', '**/*.md'], {
    cwd: DOCS_DIR,
    absolute: true,
    ignore: ['index.md'],
  });

  const allPosts = allPostPaths.reduce<Record<string, any>[]>(
    (allPosts, postPath) => {
      const markdown = matter.read(postPath);
      const allowGet = onlyPost ? markdown.data.template === 'post' : true;

      if (allowGet && markdown.data) {
        allPosts.push({
          ...markdown.data,

          // Split keywords
          // 1. 'hello' → ['hello']
          // 2. ['hello'] → ['hello']
          // 3. 'hello,world' → ['hello', 'world']
          keywords: Array.isArray(markdown.data.keywords)
            ? markdown.data.keywords
            : (markdown.data.keywords || '')
                .split(',')
                .map((keyword: string) => keyword.trim()),

          // Remove markdown affix
          // 1. docs/about.md → /about
          // 2. docs/posts/posts-1.md → /posts/posts-1
          // 3. docs/sponsor/index.md → /sponsor/
          path: postPath
            .replace(DOCS_DIR, '')
            .replace(/(index)?.md$/, '')
            .trim(),
        } as MarkdownMeta<T>);
      }

      return allPosts;
    },
    []
  );

  return allPosts.sort((x, y) =>
    dayjs(x.date).isBefore(dayjs(y.date)) ? 1 : -1
  ) as MarkdownMeta<T>[];
}
