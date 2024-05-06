---
title: html-to-image 页面截图的实践和踩坑记录
author: Fei-hui
template: post
keywords: Typescript, html-to-image, html2canvas, Web 网页截图
description: 记录 html-to-image 实现截图的原理，以及使用 html-to-image 替换 html2canvas 实现页面截图的步骤和踩坑记录
date: 2023/07/14
---

手头有个 C 端旧项目使用 html2canvas 实现页面截图的功能，但是 html2canvas 截图慢、不支持 CSS3 的滤镜/阴影等属性、背景图模糊导致了很多的客诉。

趁着最近这个项目重构的机会，打算用 html-to-image 替换 html2canvas 来重新实现页面截图的相关逻辑。

### 实现原理

html-to-image 与 html2canvas 最大的不同是两者的实现：

1. html2canvas 会将指定 DOM 节点转换为可以解析的图像数据，然后将图像数据绘制到 canvas 上
2. html-to-image 则是将 HTML + CSS 代码直接传入 SVG 标签的 `foreignObject` 元素，然后将 SVG 转换为 base64 地址

SVG 标签的 `foreignObject` 元素允许传入 HTML/XHTML 的代码，如 `<h1>Hello World!</h1>` ，相当于可以在 SVG 标签中渲染 HTML + CSS 的页面外观。

```xml
<svg xmlns="http://www.w3.org/2000/svg">
  <foreignObject width="120" height="50">
    <body xmlns="http://www.w3.org/1999/xhtml">
      <h1>Hello World!</h1>
    </body>
  </foreignObject>
</svg>
```

不仅如此，img 标签原生支持 SVG 资源的引用，可以借用这个特性实现对 DOM 节点的预览，也可以将生成的整个 SVG 节点通过 canvas 导出为 jpeg/png 格式的图片，从而实现和 html2canvas 一样的功能。

```ts
// 创建一个标签节点
const createElement = (label: keyof HTMLElementTagNameMap, content: string) => {
  const element = document.createElement(label);
  element.innerText = content;
  return element;
};

// 获取节点截图的 base64 地址
const createScreenshotBase64 = (sourceNode: HTMLElement) => {
  // 克隆节点，防止影响旧节点，但同时会降低性能
  const cloneNode = sourceNode.cloneNode(true) as HTMLElement;

  // 设置 SVG 协议标头
  cloneNode.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

  // 返回 SVG 的 base64 地址
  return `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="auto" height="auto"><foreignObject x="0" y="0" width="100%" height="100%">${new XMLSerializer().serializeToString(
    cloneNode
  )}</foreignObject></svg>`;
};

// 页面截图的逻辑
const img = document.createElement('img');

img.src = createScreenshotBase64(createElement('h1', 'Hello World!'));
img.load = () => {
  // 导出为图片
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = img.width;
  canvas.height = img.height;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(blob => {
    const previewUrl = window.URL.createObjectURL(blob);
    console.log(previewUrl);
  });
};

document.body.appendChild(img);
```

对比起 html2canvas ，html-to-image 利用 SVG 的原生能力实现了页面截图的功能，CSS3 的支持程度、整体的性能表现、截图清晰度都优于 html2canvas ，同时兼容性也非常好。

![SVG <foreignObject> 兼容性](/assets/html-to-image-record-of-practice-and-pitfalls-on-mobile/svg-foreign-object-compatibility.jpg)

除此之外，html-to-image 底层还做了更多事情：

1. 递归克隆每个 DOM 节点
2. 计算节点和每个子节点的样式，并将其复制到相应的克隆节点中
3. 找到所有可能的静态文件资源（图片/字体），然后解析文件 URL 并下载相应文件，以 base64 地址的形式内联在样式中
4. 处理所有 CSS 样式放入 `style` 元素，然后加到克隆节点里
5. 将克隆节点序列化为 XML ，将 XML 包入 `foreignObject` 中，然后包入 SVG 转换为 base64 地址

### 功能实现

html-to-image 的 api 设计比较简洁，直接调用 `toPng` / `toJpeg` 方法就可以得到对应图片格式的截图地址。

```ts{5}
import { toJpeg } from 'html-to-image';

const screenshot = async (element: HTMLElement) => {
  try {
    const jpegBase64 = await toJpeg(element);
    console.log('Screenshot Success', jpegBase64);
  } catch (error) {
    console.error('Screenshot Error', error);
  }
};
```

### 踩坑记录

不管是 html2canvas 还是 html-to-image，都应当保证图片、字体这类静态资源在通过 `fetch` 方法访问时不会出现跨域的情况，跨域会导致截图失败或者某部分空白的情况产生。

#### 1. 静态资源地址中没有文件格式无法被截取到

这个问题出现在项目重构初期时，重构项目还没有足够的静态资源，于是只能使用旧项目的静态资源。旧项目有非常严格的防盗链策略，项目里不管图片/字体/视频都是 `cdn.demo.com/assets/xxxxx-xxxxx-xxxxx-xxxxx` 这种链接格式。

而 html-to-image 会读取 url 的文件格式后缀名作为 base64 的格式前缀，格式错误导致了这部分静态资源无法被截取出来。

```ts
// https://github.com/bubkoo/html-to-image/blob/master/src/dataurl.ts
export function makeDataUrl(content: string, mimeType: string) {
  return `data:${mimeType};base64,${content}`;
}

// https://github.com/bubkoo/html-to-image/blob/master/src/mimes.ts
const mimes = {
  // ...
  png: 'image/png',
};

// 从 url 中提取文件的后缀名，如 xxx.xxx.com/xxx/xxx.png → png
function getExtension(url: string): string {
  const match = /\.([^./]*?)$/g.exec(url);
  return match ? match[1] : '';
}

export function getMimeType(url: string): string {
  const extension = getExtension(url).toLowerCase();
  return mimes[extension] || '';
}
```

#### 2. 当页面存在较多的字体文件时，使用手机截图时页面会非常卡顿

在截图功能的开发中，发现当页面上有几种中文字体时，这个时候截图页面会非常卡顿，同时手机发烫严重。经过对源码的排查，受限于 SVG 标签只能加载本地资源的同源策略限制，html-to-image 内部会将各类静态资源转换为 base64 并内嵌到 SVG 标签中，这导致了同时转换多个字体占据了大量的手机内存从而导致页面卡顿。

```ts{15,17}
// https://github.com/bubkoo/html-to-image/blob/master/src/embed-resources.ts
export async function embed(
  cssText: string,
  resourceURL: string,
  baseURL: string | null,
  options: Options,
  getContentFromUrl?: (url: string) => Promise<string>,
): Promise<string> {
  try {
    const resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL
    const contentType = getMimeType(resourceURL)
    let dataURL: string
    if (getContentFromUrl) {
      const content = await getContentFromUrl(resolvedURL)
      dataURL = makeDataUrl(content, contentType)
    } else {
      dataURL = await resourceToDataURL(resolvedURL, contentType, options)
    }
    return cssText.replace(toRegex(resourceURL), `$1${dataURL}$3`)
  } catch (error) {
    // pass
  }
  return cssText
}
```

对此，官方也给出 `fontEmbedCSS` 这个配置字段，允许开发者自行处理字体文件的样式。这样便可以通过 `opentype.js` 这一类的字体库，在项目编译时对项目使用到的字体文件进行裁剪压缩，然后将这部分字体文件替换为 base64 格式存储，提高运行时的截图性能。

::: code-group

```html [html]
<style type="text/css">
  @font-face {
    font-family: 'Demo-GB Regular';
    src: url('data:font/woff;base64,T1RUTwAJAIAAAwAQQ0ZGIJmih9oAAAWEAAASlk9TLzJlUvePAAABAAAAAGBjbWFwtHvSYwAABIgAAADcaGVhZB7I5nMAAACcAAAANmhoZWEB8QDRAAAA1AAAACRobXR4FbUA6AAAGBwAAABgbWF4cAAYUAAAAAD4AAAABm5hbWVQevkuAAABYAAAAydwb3N0AAMAAAAABWQAAAAgAAEAAAABAABx7qUaXw889QADAQAAAAAA31nT6AAAAADfWdPoAAH/3AD9AM8AAAADAAIAAAAAAAAAAQAAAOX/tQAAAQAAAQADAQkAAQAAAAAAAAAAAAAAAAAAABgAAFAAABgAAAADAOYB9AAFAAACigK7AAAAjAKKArsAAAHfADEBAgAAAAAAAAAAAAAAAAAAAAEIAAAAAAAAAAAAAABYWFhYAEAAUo/QAOX/tQAAAM8AJAAAAAEAAAAAAHMAwgAAAAAAAAAAACIBngABAAAAAAAAAAEAbQABAAAAAAABABYAAAABAAAAAAACAAcAQgABAAAAAAADACABKQABAAAAAAAEAB4AVwABAAAAAAAFAAsBCAABAAAAAAAGAB0AsQABAAAAAAAHAAEAbQABAAAAAAAIAAEAbQABAAAAAAAJAAEAbQABAAAAAAAKAAEAbQABAAAAAAALAAEAbQABAAAAAAAMAAEAbQABAAAAAAANAAEAbQABAAAAAAAOAAEAbQABAAAAAAAQABYAAAABAAAAAAARAAcAQgADAAEECQAAAAIAoQADAAEECQABACwAFgADAAEECQACAA4ASQADAAEECQADAEABSQADAAEECQAEADwAdQADAAEECQAFABYBEwADAAEECQAGADoAzgADAAEECQAHAAIAoQADAAEECQAIAAIAoQADAAEECQAJAAIAoQADAAEECQAKAAIAoQADAAEECQALAAIAoQADAAEECQAMAAIAoQADAAEECQANAAIAoQADAAEECQAOAAIAoQADAAEECQAQACwAFgADAAEECQARAA4ASUZaSGFuWmhlbkd1YW5nQmlhb1MtR0IARgBaAEgAYQBuAFoAaABlAG4ARwB1AGEAbgBnAEIAaQBhAG8AUwAtAEcAQlJlZ3VsYXIAUgBlAGcAdQBsAGEAckZaSGFuWmhlbkd1YW5nQmlhb1MtR0IgUmVndWxhcgBGAFoASABhAG4AWgBoAGUA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iwiLiwVpiwWLZgX3F7AVaIsFi2YFwYsFi50Fi5iFkX6LCIuLBQ73lPeM90gVi4sFi1EF+xmLBYvHBYuclZOeiwiLiwXUiwWei5aCjHkIVogVi4sFY4sFi3MFwYsFi5QFi5WGkIKLCDtGFfcciwWLagVdiwWLdQW5iwWLagVdiwWLeAW6iwWLfwWLfIOEfIsIi4sF+wmLBYutBbqLBYuSBYuThY9+iwiLiwVxiwWLrAW4iwWLlAWLlIWPfosIi4sFcosFi6wFhroVi2kFbYsFi/svBWSLBYv3FQWLnYSUfYoIi4sFgIsFi60Fq4sFi5QFi5GGjoGLCIuLBXuLBYurBeyLBYt/BYp/hoSBigiLiwWAiwWLeQWpiwUn+0gVi/caBZeLBZKLj4WLfgiLiwWLKAWLgYeGgooIi4sFgYsF19wVi4sFi5qMl42VCIuLBY2WjpCOiwiLiwWOi42GjYAIi4sFjYGMf4t8CIuLBYt8in+JgAiLiwWJgYmGiIsIi4sFiIuIkImVCIuLBYmWipeLmggO95SVaBWL91EFi6eamaiLCIuLBcaLBYuWBbaLBYuABeuLBYtpBftdiwWL+0EFi3uDg3yLCIuLBXmLBcb3LxWLqgX3IYsFoIqTf4Z0CIuLBXNwBZSLBZ6LlICLdQiLiwWLVQVkiwWLrQWLmIWRf4sIi4sFfIsFi0sFi4WJhYeGCIuLBYaGhIiDiwiLiwVSiwWLrAWpiwWOjI6MjYwIi4sFjI2MjYuOCIuLBYuiBYubhJN8igiLiwVciwWLrQWkiwV8oAW9iwWVfZOEkosIi4sFkYuXlp2gCIuLBfsHiwUO95Te9zwVi64F9y+LBYtoBfsviwWBchX3RYsFi2gFLYsFa1AF1IsFkIyNjouRCIuLBYCqBbWLBZZcBYx4g4J6iwiLiwX7CYsFd46CmI2kCIuLBau/BWaLBYuuBYJ0FYshBYyEjoaSiAiLiwX3RYsFi30Fi36DhHuLCIuLBfshiwWBjYOQhpMIi4sFi4GEhn6LCIuLBXeLBYv3KAV9iwWLrQWoiwWci5OCi3kIi4sFXMsVi4sFi5GNkJCQCIuLBZCQkI2RiwiLiwWSi5CJkIYIi4sFj4aNhouFCIuLBYuFiYWHhgiLiwWGh4aJhIsIi4sFhYuGjYaPCIuLBYaQiZGLkQgO95T3du8Vi/sCBYuFiYWHhgiL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')
      format('woff');
  }
</style>
<p style="font-family: 'Demo-GB Regular';">
  组件实例是 React 应用程序运行时组件被实例化后的状态
</p>
```

```ts [ts]
import { toJpeg } from 'html-to-image';

const screenshot = async (element: HTMLElement) => {
  try {
    const fontFamily = 'Demo-GB Regular'; // [!code ++]
    const fontBase64 = 'data:font/woff;base64,xxx'; // [!code ++]

    const jpegBase64 = await toJpeg(element, {
      fontEmbedCSS: `@font-face{font-family:"${fontFamily}";src:url('${fontBase64}') format('woff');}`, // [!code ++]
    });

    console.log('Screenshot Success', jpegBase64);
  } catch (error) {
    console.error('Screenshot Error', error);
  }
};
```

:::

最终效果：

![截图的最终效果](/assets/html-to-image-record-of-practice-and-pitfalls-on-mobile/screenshot-result.png)

#### 3. iOS 调用 toPng / toJpeg 生成的截图不完整

在功能开发的过程中，我发现 iOS 系统上通过 `toJpeg` 进行截图，发现截出来的图片内容有缺失/空白，社区内也有不少人遇到了类似的问题：

1. [Not all images are loading when saving image to jpeg on iOS](https://github.com/bubkoo/html-to-image/issues/52)
2. [PNG image rendering as blank on IOS 13 view option](https://github.com/bubkoo/html-to-image/issues/66)
3. [Generating a Blank Image in Safari Browser](https://github.com/bubkoo/html-to-image/issues/199)
4. [SVG with image not working in Safari](https://github.com/bubkoo/html-to-image/issues/214)
5. [Image is not showing in some cases iOS, Safari](https://github.com/bubkoo/html-to-image/issues/361)

引发这个问题的原因具体不明。但从社区的讨论来看，Firefox 和 Safari 处理 SVG 传入 Canvas 并输出图片的过程与 Chrome 不一样，第一次调用有概率会导致图片内容缺失/空白，多次生成之后就正常了，但具体生成几次才能输出完整的图片还要看具体情况。我个人使用 iPhone 测试过，有些时候需要 2 次，有些时候需要 3 次，并不稳定。

```ts
import { toJpeg } from 'html-to-image';

const screenshot = async (element: HTMLElement) => {
  try {
    // 第一次调用 toJpeg 生成图片
    const url = await toJpeg(element);
    const img = document.createElement('img');

    img.src = url;

    document.body.appendChild(img);

    const createJpeg = () =>
      new Promise<string>(resolve => {
        img.onload = () => {
          // 再次调用 toJpeg 生成图片
          toJpeg(element).then(dataUrl => {
            resolve(dataUrl);
            document.body.removeChild(img);
          });
        };
      });

    const jpegBase64 = await createJpeg();
    console.log('Screenshot Success', jpegBase64);
  } catch (error) {
    console.error('Screenshot Error', error);
  }
};
```

同时，重复生成对截图速度和性能的影响巨大，如果对图片格式没有限制且有性能要求，可以直接使用 `toSvg` 方法生成，在生成一次的前提下 iOS 生成的图片不会出现截图不完整的情况。

```ts{1,5}
import { toSvg } from 'html-to-image';

const screenshot = async (element: HTMLElement) => {
  try {
    const svgBase64 = await toSvg(element);
    // NOTE：
    // 也可以使用 save-svg-as-png 这一类的第三方库把 SVG 转换成 PNG 这一类的图片格式
    console.log('Screenshot Success', svgBase64);
  } catch (error) {
    console.error('Screenshot Error', error);
  }
};
```

### 参考资料

- [&lt;foreignObject&gt;](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject)
- [SVG &lt;foreignObject&gt; 简介与截图等应用](https://www.zhangxinxu.com/wordpress/2017/08/svg-foreignobject/)
