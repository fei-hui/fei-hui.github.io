---
title: 初识 StyleX 及上手体验之后的感受
author: Fei-hui
template: post
keywords: CSS, React, Vite, StyleX
description: StyleX 是 Facebook 开源的 CSS-in-JS 框架，本文主要讨论 StyleX 的上手体验及体验后的个人感受
date: 2023/12/24 14:14
---

StyleX 是 Facebook 开源的 CSS-in-JS 框架，整体的用法与 React Native 的 `StyleSheet.create` 方法相同，能够得到类似于 Tailwind CSS 的原子样式。

从官方文档来看，StyleX 主要解决的是 CSS 样式冲突、相互覆盖的问题，StyleX 底层会将样式拆分成原子样式，由程序保证相同的原子样式全局共用一个样式，样式名由程序保证唯一性。

### 上手体验

照着官方文档手撸了 Hello World 的例子，不同于 Tailwind CSS 提供了最终产物，StyleX 是在编程过程中生成全局唯一的样式，所以需要在项目脚手架引入对应的编译插件。

我用的是 `Vite` 构建的项目，但是官方并没有提供对应的编译插件，用 rollup 插件编译会报语法报错；不过好在社区有大佬在 StyleX 发布的几天后开源了 `vite-plugin-stylex` 插件。

::: code-group

```tsx [index.tsx]
import { createRoot } from 'react-dom/client';
import { create, props } from '@stylexjs/stylex';

// 全局样式
import './index.css';

const root = createRoot(document.getElementById('root')!);

// 局部样式
const styles = create({
  container: {
    display: 'flex',
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: {
    fontSize: '3rem',
  },
  // 伪类/伪元素
  red: {
    color: 'rgb(255,0,0)',
    ':hover': {
      color: 'rgba(255,0,0,0.6)',
    },
  },
  // 动态入参
  colorTransition: (delay?: number) => ({
    transition: `color ${delay || 0.3}s ease`,
  }),
});

root.render(
  <section {...props(styles.container)}>
    <h1 {...props(styles.h1, styles.red, styles.colorTransition(0.5))}>
      Hello World!
    </h1>
  </section>
);
```

```css [index.css]
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

```ts [vite.config.ts]
import { defineConfig } from 'vite';

import React from '@vitejs/plugin-react';
import StyleX from 'vite-plugin-stylex';

export default defineConfig({
  plugins: [React(), StyleX()],
});
```

:::

最终效果：

![最终效果](/assets/start-with-style-x-and-personal-feeling/stylex-result.png)

StyleX 说明了最近几年前端技术的一个发展方向：极致化，专门解决某一特定领域的问题，在这个基础上追求速度要飞快、生成体积要小。类似的情况还有各类构建工具，`Vite` / `Rspack` / `Bun` 也如雨后春笋地冒出来。

### 上手感受

我个人感觉 StyleX 比 Tailwind CSS 更好用一些，大幅度减少了上手门槛，毕竟 Tailwind CSS 需要记忆大量的样式规律。

但 StyleX 也有一些问题，比如：没有解决 CSS-in-JS 从出现到现在都有的一些弊病。不过我也不是什么技术大拿，技术好用易上手就足够了。

### 参考资料

- [Introducing StyleX](https://stylexjs.com/blog/introducing-stylex/)
- [StyleX 是什么? 解决了什么问题? 适用在什么场景?](https://www.explainthis.io/zh-hans/swe/stylex-intro)
