---
title: Web 调用网络摄像头及各类错误处理
author: Fei-hui
template: post
keywords: Javascript, Typescript, 网络摄像头, 硬件调试
description: 记录在 Web 页面接入调试各类的网络摄像头遇到的问题
date: 2020/12/10
---

最近由于业务的原因，需要在 Web 页面接入调试各类的网络摄像头，遇到了很多匪夷所思的问题（ 说的就是读得出摄像头的品牌，读不出摄像头的分辨率 ），于是整理了这篇文章作为备忘录。

### 基础代码

```js
navigator.mediaDevices
  .getUserMedia({ audio: false, video: true })
  .then(async stream => {
    const video = document.getElementById('#video');

    // 兼容性监测
    if ('srcObject' in video) {
      video.srcObject = stream;
    } else {
      // 在支持srcObject的浏览器上，不再支持使用这种方式
      video.src = URL.createObjectURL(stream);
    }

    await video.play();
  });
```

### 兼容性

![getUserMedia 兼容性](/assets/web-call-camera-and-error-handling/compatibility.png)

从 [caniuse](https://caniuse.com/?search=getUserMedia) 的兼容性来看，目前 `getUserMedia` 的整体兼容性一般，IE 系列浏览器完全不支持，iOS 不仅需要 iOS 11 以上的版本，而且在 APP 的嵌入式页面也无法通过 api 进行调用。

### 开发遇到的问题

#### 1、浏览器控制台提示 `mediaDevices.getUserMedia is not a function`

由于受浏览器的限制，`navigator.mediaDevices.getUserMedia`在 `https` 协议下是可以正常使用的，而在 `http` 协议下只允许 `localhost` / `127.0.0.1` 这两个域名访问，因此在开发时应做好容灾处理，上线时则需要确认生产环境是否处于 `https` 协议下。

```js
const mediaDevices = navigator.mediaDevices || null;

if (mediaDevices === null) {
  console.warn(`请确定是否处于https协议环境下`);
  return;
}

mediaDevices
  .getUserMedia({ audio: false, video: true })
  .then(async stream => {});
```

#### 2、获取摄像头的硬件参数

我在项目开发中需要用到的硬件参数主要有两种：品牌，分辨率。获取摄像头的品牌名称相对来说比较简单，可直接通过 `mediaDevices.enumerateDevices()` 获取电脑上可使用的外设列表，通过 `kind` 字段过滤出摄像头。

```js
if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
  console.log('浏览器不支持 enumerateDevices 属性');
  return;
}

navigator.mediaDevices.enumerateDevices().then(devices => {
  const devicesList = devices.filter(device => device.kind === 'videoinput');
  // devicesList -> [{ kind: 'videoinput', name: 'FaceTime HD Camera (Built-in)', deviceId: xxx }]
  // 在devicesList获取到的deviceId可以用于切换摄像头
  // 具体方法：mediaDevices.getUserMedia({ audio: false, video: { deviceId } })
});
```

分辨率则不能直接通过官方的 api 获取到，从 MDN（ [点击跳转](https://developer.mozilla.org/zh-CN/docs/Web/API/MediaDevices/getUserMedia) ）上查到的理由是为了保护用户的个人隐私，而分辨率就在保护的范畴内（ 个人非常好奇分辨率为啥是隐私 ）。

> 由于隐私保护的原因，无法访问用户的摄像头和麦克风信息

但也并不是完全无法获取到，由于可以通过 `video` 标签在网页上播放摄像头中所录取到的内容，而 `video` 标签会默认将大小设置为与摄像头相同的大小，因此通过获取 `video` 的大小来获取摄像头的分辨率。

经过测试，获取到的值不受样式的影响，所以可以通过样式控制 `video` 的大小，但是不会影响到分辨率。

```js
const mediaDevices = navigator.mediaDevices || null;

if (mediaDevices === null) {
  console.warn(`请确定是否处于https协议环境下`);
  return;
}

mediaDevices.getUserMedia({ audio: false, video: true }).then(async stream => {
  const video = document.getElementById('#video');

  video.srcObject = stream;

  await video.play();

  // 1280,720
  console.log(video.videoWidth, video.videoHeight);
});
```

#### 3、无摄像头/无使用权限等错误的处理

`getUserMedia` 本身集成了几个比较常见的错误提示，比如常见的无摄像头、无使用权限等，通过 `catch` 能处理大部分类似的错误。

```js
const mediaDevices = navigator.mediaDevices || null;

if (mediaDevices === null) {
  console.warn(`请确定是否处于https协议环境下`);
  return;
}

mediaDevices
  .getUserMedia({ audio: false, video: true })
  .then(async stream => {
    const video = document.getElementById('#video');

    video.srcObject = stream;

    await video.play();
  })
  .catch(error => {
    const message = error.message || error;
    const response = {
      'permission denied': '浏览器禁止本页面使用摄像头，请开启相关的权限',
      'requested device not found': '未检测到摄像头',
    };

    alert(response[message.toLowerCase()] || '未知错误');
  });
```

#### 4、摄像头拔出检查

手机端由于摄像头是手机自带的，所以一般不需要对摄像头是否拔出进行检查。但在 PC 上有拔出摄像头数据线的情况发生，这种时候就需要对摄像头的状态进行监控。

最开始想到的是，`getUserMedia` 在摄像头拔出时可能会通过 `catch` 报错。然而经过多次的实验，`getUserMedia` 在摄像头拔出时，不会响应找不到摄像头的错误，想通过 `catch` 直接监控这种方法并不可行。

在几乎没有思路的时候，在 `getUserMedia` 文档上看到了这么一句话：

> `getUserMedia` 返回一个 `Promise` ， 这个 `Promise` 成功后的回调函数带一个 `MediaStream` 对象作为其参数。

`MediaStream` 是接收多媒体（ 包括音频、视频 ）内容流的一个对象，在谷歌浏览器（ 其他浏览器未测试 ）的控制台上打印之后，其属性值如下：

`id` 是 `MediaStream` 对象的唯一标识符，`active` 是当前内容流是否处于活动状态，下面几个字段则是谷歌浏览器提供的钩子。

![MediaStream](/assets/web-call-camera-and-error-handling/media-stream.png)

在摄像头拔出的一瞬间，`active` 会从 `true` 变更为 `false`，同时触发 `oninactive` 钩子，有了状态监听之后事情就简单了许多。代码经过测试后发现，对用户变更摄像头权限也有效。

```js
// 判断摄像头是否在线
let cameraIsOnline = false;

const loadWebCamera = () => {
  const mediaDevices = navigator.mediaDevices || null;

  if (mediaDevices === null) {
    console.warn(`请确定是否处于https协议环境下`);
    return;
  }

  mediaDevices
    .getUserMedia({ audio: false, video: true })
    .then(async stream => {
      const video = document.getElementById('#video');

      video.srcObject = stream;

      // 兼容性处理
      if (stream.oninactive === null) {
        // 监听流中断，流中断后将重新进行调用自身进行状态监测
        stream.oninactive = () => loadWebCamera();
      }

      await video.play();

      cameraIsOnline = true;
    })
    .catch(error => {
      const message = error.message || error;
      const response = {
        'permission denied': '浏览器禁止本页面使用摄像头，请开启相关的权限',
        'requested device not found': '未检测到摄像头',
        'could not start video source': '无法访问到摄像头，请重新插拔后重试',
      };

      cameraIsOnline = false;
      alert(response[message.toLowerCase()] || '未知错误');
    });
};
```

不过，兼容性也非常地捉急，也有很多字段都是提案阶段，开发阶段建议做好兼容性处理，防止生产环境出现问题。
