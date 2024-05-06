---
title: 如何用 CSS 画五角星
author: Fei-hui
template: post
keywords: CSS
description: 如何用 CSS 画正五角星的 2 种方式：border 和 clip-path
date: 2021/04/20
---

最近出去面试，面到了某一家主营低代码页面搭建的互联网公司，其中有道面试题是如何用 CSS 画五角星。我个人的 CSS 水平不怎么高，没有完整地回答出这个问题，于是回来查漏补缺地记录一下。

面试题里给了一个类名为 `star` 的 DOM 节点，以下的方案都基于这个 DOM 节点实现。

```html
<div class="star"></div>
```

### clip-path

在面试的时候，我想到的方案是 `clip-path` 属性，但我没怎么在项目中使用过这个属性，不太清楚怎么使用，面试官也一再追问实现的细节，然后这题就被 OVER 了 :zany_face:。

如果翻译 `clip-path` 这个单词，会翻译成剪切路径，这个名词来源于 Photoshop 这一类的设计软件。在 Photoshop 里，剪切路径用于定义一个图像区域的可视部分，非路径区域内的部分将被隐藏。在 CSS 中也是如此，`clip-path` 支持多种形式的裁剪节点的可显示区域，比如：圆形、矩形、多边形等。

而五角星就是个多边形，所以可以将五角星的每个顶点（ 对应 x, y 上的坐标点，支持百分比 ）作为参数，传入到 `clip-path` 的 `polygon` 函数来画出一个五角星。

```css
.star {
  display: inline-block;
  width: 200px;
  height: 200px;
  background-color: gold;
  clip-path: polygon(
    50% 0%,
    61% 35%,
    98% 35%,
    68% 57%,
    79% 91%,
    50% 70%,
    21% 91%,
    32% 57%,
    2% 35%,
    39% 35%
  );
}
```

最终效果：![clip-path pentagram](/assets/how-to-draw-pentagram-in-css/clip-path-pentagram.png)

### 多个三角形拼接

除了 `clip-path` 属性，还可以通过 CSS 画三角形的逻辑，将多个三角形拼接成一个五角星。

![pentagram](/assets/how-to-draw-pentagram-in-css/pentagram.png)

```css
.star {
  position: relative;
  margin: 80px 0;
  border-style: solid;
  border-width: 0 100px 70px 100px;
  border-color: transparent transparent gold transparent;
  transform: rotate(35deg);
}

.star:before {
  position: absolute;
  content: '';
  top: -45px;
  left: -65px;
  border-style: solid;
  border-width: 0 30px 80px 30px;
  border-color: transparent transparent gold transparent;
  transform: rotate(-35deg);
}

.star:after {
  position: absolute;
  content: '';
  top: 3px;
  left: -105px;
  border-style: solid;
  border-width: 0 100px 70px 100px;
  border-color: transparent transparent gold transparent;
  transform: rotate(-70deg);
}
```

### 参考资料

- [clip-path - CSS：层叠样式表 | MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/clip-path)
