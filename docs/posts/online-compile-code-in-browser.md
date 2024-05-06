---
title: 如何在浏览器中在线编译代码
author: Fei-hui
template: post
keywords: Node.js, Typescript, 代码编译, ESBuild, Vite
description: 记录如何基于 esbuild-wasm 实现在浏览器中编译和运行代码
date: 2022/12/02
---

之前在折腾 [微信云函数底层实现的合理乱猜](./implementation-of-wechat-cloud-function.md) 这篇文章的时候，实现了云函数 SDK 模拟调用云函数这个功能。调试这个功能的时候，发现性能不是很理想，接口响应普遍在 10s 左右。经过相关功能的排查，主要是在服务器编译代码这块性能不佳。

![在线编译流程](/assets/online-compile-code-in-browser/online-compile-code.jpg)

于是调整了技术方案。调整之后，整体流程就变成了在 Web IDE（ 使用了 `monaco-editor` 编辑器 ）中编辑代码，当监听到保存事件时，直接编译代码然后上传到服务器，服务器只负责执行。

### 技术实现

整个流程中最重要的就是编译这一步，于是搜索了一番，找到了能够在浏览器进行代码编译的 2 个 npm 库：`esbuild-wasm` 、 `@rollup/browser`，本文选择使用 `esbuild-wasm` 进行编译。

ESBuild 是用 Go 语言编写的，为了能够与 Node.js 环境集成，底层的代码编译模块以 WebAssembly 的形式编译成了 `esbuild-wasm` 这个 npm 包，使相关的代码编译逻辑能够跑在 js 的环境中。

下面是使用 `Vite` 构建工具搭建的 `esbuild-wasm` 的最小功能闭环（ 初始化 + 代码编译 ）：

```ts
import * as ESBuild from 'esbuild-wasm';

/** 是否已加载 */
let initialized = false;

/** 全局加载实例 */
let initPromise: Promise<void> | null = null;

/** 初始化 ESBuild */
async function initialize() {
  // 已加载则不重复加载
  if (initialized) return;

  // 全局共用一个加载实例，防止重复加载
  if (initPromise === null) {
    initPromise = ESBuild.initialize({
      worker: true,
      wasmURL: new URL(
        '/node_modules/esbuild-wasm/esbuild.wasm',
        import.meta.url
      ),
    });
  }

  try {
    // 等待加载完成
    await initPromise;

    initialized = true;
    console.log('ESBuild init success');
  } catch (e) {
    console.log('ESBuild init failure', e);
  }
}

/** 编译代码 */
async function transform() {
  try {
    // 等待初始化完成
    await initialize();

    // 编译代码
    const { outputFiles = [] } = await ESBuild.build({
      bundle: true,
      format: 'cjs',
      target: 'es6',
      platform: 'browser',
      entryPoints: ['App.tsx'],
    });

    console.log('Code compile success', outputFiles);
  } catch (e) {
    console.log('Code compile failure', e);
  }
}
```

在解决代码编译的问题之后，还存在着文件读写的问题。ESBuild 需要借助 Node.js 的 `fs` / `path` 等能力完成文件的读写，而浏览器并没有提供这些能力，所以需要手动实现在内存中读写文件的操作，即虚拟文件系统 `VFS` 。

```ts
class VFS {
  /** 统一文件路径 */
  public normalizePath(path: string) {}

  /** 读文件 */
  public readFile(path: string) {}

  /** 写文件 */
  public writeFile(path: string, content: string) {}
}
```

处理好文件读写的问题之后，结合 ESBuild 的插件机制便可以实现读取代码内容的功能，同时也需要处理好各个文件之间的依赖、引入关系，还有处理引入的第三方依赖。

```ts
{
  name: 'compile-in-browser',
  setup: build => {
    // 处理各类文件的依赖、引入关系
    build.onResolve({ filter: /.*/ }, args => {
      const { kind, path } = args;
      const { dependencies = {} } = options;

      switch (kind) {
        // 入口文件路径解析
        case 'entry-point': {
          return { path: vfs.normalizePath(path) };
        }
        // 引入文件
        case 'import-statement': {
          // 依赖解析
          if (dependencies[path]) {
            return { path, external: true };
          }

          // 本地文件解析
          if (vfs.readFile(path)) {
            return { path: vfs.normalizePath(path) };
          }

          return null;
        }
        default: {
          return null;
        }
      }
    });

    // 读取 js/jsx/ts/tsx 对应的文件内容
    build.onLoad({ filter: /.(j|t)sx?/ }, args => ({
      loader: 'tsx',
      contents: vfs.readFile(args.path) || '',
    }));

    // 读取 css 文件内容并转换为 style 样式
    build.onLoad({ filter: /.css/ }, args => {
      const cssFile = vfs.readFile(args.path) || '';

      if (cssFile) {
        // 处理文件名，./App.css → App.css
        const fileName = vfs
          .normalizePath(args.path)
          .replace(/^\//, '');
        const fileContents = [
          '(() => {',
          `  let style = document.querySelector("style[data-file='${fileName}']");`,
          '  if (!style) {',
          `    style = document.createElement('style');`,
          '    style.type = "text/css";',
          `    style.setAttribute("data-file", ${JSON.stringify(fileName)});`,
          '    document.head.appendChild(style);',
          '  }',
          `  style.innerHTML = ${JSON.stringify(cssFile)};`,
          '})()',
        ].join('\n');

        return {
          loader: 'js',
          contents: fileContents,
        };
      }

      return null;
    });
  },
}
```

### 完整代码

处理完代码编译的问题，实现步骤里就只剩下沙箱这个功能还没实现。本文主要讨论代码编译的实现，云函数部分的实现也与本文有很大的出入，所以沙箱直接用 iframe 标签的 `sandbox` 属性实现。

::: code-group

```html [iframe.html]
<!doctype html>
<html lang="zh-cn">
  <head>
    <meta charset="UTF-8" />
    <title>Sandbox Example</title>
  </head>
  <body>
    <iframe
      sandbox="allow-scripts"
      srcdoc='
      <!DOCTYPE html>
      <html lang="zh-cn">
        <body>
          <div id="app"></div>
        </body>
        <!-- 构建时需要处理这个地址 -->
        <script type="module" src="/src/main.ts"></script>
      </html>
    '
    ></iframe>
  </body>
</html>
```

```ts [main.ts]
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';

import { transform } from './esbuild';

async function bootstrap() {
  const render = await transform({
    entry: 'main.ts',
    files: {
      'App.tsx': `
        import React, { useState } from 'react';
        
        import './App.css';
        
        const App: React.FC = () => {
          const [count, setCount] = useState(0);
          return (
            <div className='App'>
              <h1>Hello World</h1>
              <p>Count: {count}</p>
              <button onClick={() => setCount(C => C + 1)}>increment</button>
              <button onClick={() => setCount(C => C - 1)}>decrement</button>
            </div>
          )
        };
        
        export default App;
      `,
      'App.css': `
        .App {
          margin: 0;
          padding: 0;
          color: red;
        }
      `,
      'main.ts': `
        import React from 'react'
        import ReactDOM from 'react-dom/client'
        import App from './App.tsx'
        
        ReactDOM.createRoot(document.getElementById('app')!).render(
          <React.StrictMode>
            <App />
          </React.StrictMode>
        )
      `,
    },
    dependencies: {
      react: React,
      'react-dom': ReactDOM,
      'react-dom/client': ReactDOMClient,
    },
  });

  render();
}

bootstrap();
```

```ts [vfs.ts]
/** VFS 配置 */
interface VFSOptions {
  /** VFS 根目录 */
  root?: string;
  /** 文件列表 */
  files: Record<string, string>;
}

class VFS {
  // 根目录
  private root: string;

  // 文件列表
  private files: Record<string, string> = {};

  /** 虚拟文件系统 */
  constructor(options: VFSOptions) {
    const { root = '.', files = {} } = options;

    this.root = root;

    // 初始化文件路径
    this.files = Object.keys(files).reduce((allFiles, path) => {
      const normalizedPath = this.normalizePath(path);
      allFiles[normalizedPath] = files[path];
      return allFiles;
    }, {});
  }

  /** 统一文件路径 */
  public normalizePath(path: string): string {
    // ./utils.ts → /utils.ts
    let normalizedPath = path.startsWith(this.root)
      ? path.substring(this.root.length)
      : path;

    // 确保所有路径都是以 / 开头
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }

    // 处理全部带 ./ 的路径
    normalizedPath = normalizedPath.replace(/^\.\/+/, '/');

    return normalizedPath;
  }

  /** 读文件 */
  public readFile(path: string) {
    const normalizedPath = this.normalizePath(path);
    return this.files[normalizedPath];
  }

  /** 写文件 */
  public writeFile(path: string, content: string) {
    const normalizedPath = this.normalizePath(path);
    this.files[normalizedPath] = content;
  }
}

export default VFS;
```

```ts [esbuild.ts]
import * as ESBuild from 'esbuild-wasm';

// 引入工具方法
import VFS from './vfs';

/** 代码编译配置 */
interface TransformOptions {
  /** 入口文件名 */
  entry: string;
  /** 待编译文件 */
  files: Record<string, string>;
  /** 依赖 */
  dependencies?: Record<string, any>;
}

/** 是否已加载 */
let initialized = false;

/** 全局加载实例 */
let initPromise: Promise<void> | null = null;

/** 初始化 ESBuild */
async function initialize() {
  // 已加载则不重复加载
  if (initialized) return;

  // 全局共用一个加载实例，防止重复加载
  if (initPromise === null) {
    initPromise = ESBuild.initialize({
      worker: true,
      wasmURL: new URL(
        '/node_modules/esbuild-wasm/esbuild.wasm',
        import.meta.url
      ),
    });
  }

  try {
    // 等待加载完成
    await initPromise;

    initialized = true;
    console.log('ESBuild init success');
  } catch (e) {
    console.log('ESBuild init failure', e);
  }
}

initialize();

/** 代码编译 */
export async function transform(options: TransformOptions) {
  try {
    // 等待初始化完成
    await initialize();

    // 录入虚拟文件系统
    const vfs = new VFS({ files: options.files });

    // 编译代码
    const { outputFiles = [] } = await ESBuild.build({
      bundle: true,
      format: 'cjs',
      target: 'es6',
      platform: 'browser',
      entryPoints: [options.entry],
      plugins: [
        {
          name: 'compile-in-browser',
          setup: build => {
            // 处理各类文件的依赖、引入关系
            build.onResolve({ filter: /.*/ }, args => {
              const { kind, path } = args;
              const { dependencies = {} } = options;

              switch (kind) {
                // 入口文件路径解析
                case 'entry-point': {
                  return { path: vfs.normalizePath(path) };
                }
                // 引入文件
                case 'import-statement': {
                  // 依赖解析
                  if (dependencies[path]) {
                    return { path, external: true };
                  }

                  // 本地文件解析
                  if (vfs.readFile(path)) {
                    return { path: vfs.normalizePath(path) };
                  }

                  return null;
                }
                default: {
                  return null;
                }
              }
            });

            // 读取 js/jsx/ts/tsx 对应的文件内容
            build.onLoad({ filter: /.(j|t)sx?/ }, args => ({
              loader: 'tsx',
              contents: vfs.readFile(args.path) || '',
            }));

            // 读取 css 文件内容并转换为 style 样式
            build.onLoad({ filter: /.css/ }, args => {
              const cssFile = vfs.readFile(args.path) || '';

              if (cssFile) {
                // 处理文件名，./App.css → App.css
                const fileName = vfs
                  .normalizePath(args.path)
                  .replace(/^\//, '');
                const fileContents = [
                  '(() => {',
                  `  let style = document.querySelector("style[data-file='${fileName}']");`,
                  '  if (!style) {',
                  `    style = document.createElement('style');`,
                  '    style.type = "text/css";',
                  `    style.setAttribute("data-file", ${JSON.stringify(fileName)});`,
                  '    document.head.appendChild(style);',
                  '  }',
                  `  style.innerHTML = ${JSON.stringify(cssFile)};`,
                  '})()',
                ].join('\n');

                return {
                  loader: 'js',
                  contents: fileContents,
                };
              }

              return null;
            });
          },
        },
      ],
    });

    const compiledCode = outputFiles[0].text;

    console.log('Code compile success', compiledCode);

    // 包装 require 方法注入传入的依赖
    const requireFn = (dependency: string) => {
      const dependencies = options.dependencies || {};
      return dependencies[dependency];
    };
    const compiledFn = new Function('require', compiledCode);

    return () => compiledFn(requireFn);
  } catch (e) {
    console.log('Code compile failure', e);
  }
}
```

:::

附：因为 ESBuild 内置了 React 组件的处理，所以本文没有涉及对 React 组件编译的内容。如果使用 Angular / Vue 或者其他框架，则需要手动编译这些组件的代码。

### 参考资料

- [Code Kitchen 🧑‍🍳](https://freewheel.github.io/code-kitchen/home)
- [Bundling for the browser](https://esbuild.github.io/getting-started/#bundling-for-the-browser)
