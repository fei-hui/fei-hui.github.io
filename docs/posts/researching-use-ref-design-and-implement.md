---
title: 浅入研究 useRef 的设计思路和内部实现
author: Fei-hui
template: post
keywords: Typescript, Javascript, React, React Hooks, useRef, useState
description: 结合解读 React 的源码和运行时的数据，记录一下研究 useRef 的设计思路和内部实现的过程和结论
date: 2022/07/16
---

在我开发过的 React 项目中，`useRef` 这个钩子的使用频率非常高，但对其底层是如何实现的了解不多。正好最近在阅读 React 源码，打算结合 React 的运行时和源码，综合分析一下 `useRef` 这个钩子的设计思路和内部实现。

要深入认识一个技术框架，了解其运行时是非常重要的一环；运行时不仅会包含其底层的设计思路，还能了解到底层的设计思路是如何在代码中落地的。

::: info

比较有意思的是，React 底层为了实现最大程度上的复用，将 `useRef` 和 `useState` 的存储位置设计成了同一个字段，所以分析 `useRef` 还需要结合 `useState` 一起分析。

:::

首先搭建一个使用 `useState` 和 `useRef` 的最小运行时：

```tsx
import { render } from 'react-dom';
import { useRef, useState } from 'react';

function App() {
  useRef(0);
  useState(1);
}

render(<App />, document.querySelector('#root'));
```

`App` 组件的代码会被 `React.createElement` 方法转换成名为 `Fiber` 的链表结构，然后被 `ReactDOM` 存储在 `ReactCurrentDispatcher` 这个内部变量上。

```js{10,11,12,24}
var ReactCurrentDispatcher = {
  type: () => {
    useRef(0);
    useState(1);
  },
  memoizedState: {
    queue: null,
    baseState: null,
    baseQueue: null,
    memoizedState: {
      current: 0,
    },
    next: {
      queue: {
        pending: null,
        interleaved: null,
        lanes: 0,
        dispatch: () => {},
        lastRenderedReducer: () => {},
        lastRenderedState: 1,
      },
      baseState: 1,
      baseQueue: null,
      memoizedState: 1,
      next: null,
    },
  },
};
```

观察这个 `Fiber` 链表结构，我们发现 `useRef` 和 `useState` 都将值存储到了 `memoizedState` 这个字段上，并且两段逻辑通过 `next` 字段串联（ 以此保证 hook 的逻辑可以从组件顶部一直向下执行 ）。不同的是，`useRef` 比 `useState` 多包裹了一层对象，而 `useState` 的 `queue` 字段的值则进行了赋值。

这也对应了 `useRef` 和 `useState` 两者在 mount 阶段的实例化逻辑。

::: code-group

```js [mountRef]
function mountRef(initialValue) {
  var hook = mountWorkInProgressHook();

  {
    // 创建一个对象引用
    var _ref2 = {
      current: initialValue,
    };

    // 存储到 memoizedState 字段上
    hook.memoizedState = _ref2;

    return _ref2;
  }
}
```

```js [mountState]
function mountState(initialState) {
  var hook = mountWorkInProgressHook();

  // 传入值为函数时则在运行时才实例化
  if (typeof initialState === 'function') {
    initialState = initialState();
  }

  // 后续用于更新视图的队列信息
  var queue = {
    pending: null,
    interleaved: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState,
  };

  // 将队列信息存储到 queue 字段上
  hook.queue = queue;

  // 将 useState(state) 的 state 存储到 memoizedState 字段上
  hook.memoizedState = hook.baseState = initialState;

  // dispatch 会将需要更新视图的队列信息推送给 React 的 Dispatcher 用于触发后续更新视图
  var dispatch = (queue.dispatch = dispatchSetState.bind(
    null,
    currentlyRenderingFiber$1,
    queue
  ));

  return [hook.memoizedState, dispatch];
}
```

:::

通过运行时和解读对应的源码，大致地了解 React 是如何在代码层面上实现的 `useRef` ，但我也遇到了一个困惑：为什么 `useRef` 要多包裹一层对象 ？

在回答这个问题之前，首先得明确 `useRef` 的 2 个特性：

1. 通过 `useRef` 声明的 `ref` 值不会引起视图更新
2. 视图更新不会影响到 `ref` 值， `ref` 值手动修改才会发生变化

结合前面的运行时分析，我们知道 `useRef` 和 `useState` 的值都存储在 `memoizedState` 这个字段上，那为什么 `useRef` 的值发生变化时不会触发视图更新，而 `useState` 则会触发更新呢 ？

原因在于 `Object.is` ！

```js
function dispatchSetState(fiber, queue, action) {
  // ... 其他代码

  var currentState = queue.lastRenderedState;
  var eagerState = lastRenderedReducer(currentState, action);

  update.eagerState = eagerState;
  update.hasEagerState = true;

  // React 通过 Object.is 方法判断状态值是否有更新
  if (objectIs(eagerState, currentState)) {
    return;
  }

  // 如果有更新则通知 react-scheduler 更新 Fiber 内的数据
  const eventTime = requestEventTime();
  scheduleUpdateOnFiber(fiber, lane, eventTime);
}
```

React 通过 `Object.is` 方法判断 `Fiber` 上的 `memoizedState` 字段是否发生了更新，而 `useRef` 创建一个不变的 `ref` 对象引用，修改值只是修改 `ref` 对象里的 `current` 的值，并不会改变 `ref` 对象的引用地址，自然无法触发视图的更新。

```js
function updateRef(initialValue) {
  var hook = updateWorkInProgressHook();
  // 更新阶段 useRef 仍然返回 memoizedState 字段，对应的值改变了自然就就改了
  // 官方的视图刷新不会影响返回的值
  return hook.memoizedState;
}
```

### 参考资料

- [Referencing Values with Refs](https://beta.reactjs.org/learn/referencing-values-with-refs)
- [How to useRef to Fix React Performance Issues](https://betterprogramming.pub/how-to-useref-to-fix-react-performance-issues-4d92a8120c09)
