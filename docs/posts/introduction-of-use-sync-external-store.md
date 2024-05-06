---
title: 新特性 useSyncExternalStore 的原理和应用
author: Fei-hui
template: post
keywords: Typescript, React, React Hooks, useSyncExternalStore
description: 研究 React 新特性 useSyncExternalStore 的实现原理和怎么在项目中使用
date: 2022/06/29
---

最近刷技术论坛的时候，看到有人说 React 已经发布了 18 版本，出于好奇去围观了又新增了哪些新特性，然后在这些新特性里看到 `useSyncExternalStore` 这个新的 hook 钩子。

从官方的描述来看，`useSyncExternalStore` 是专门提供给第三方 npm 包的开发者用的，专门用来让组件能够监听到组件外部的数据流。

### 如何使用

翻了翻官方给出的几个示例，从示例来看，`useSyncExternalStore` 是基于事件的发布订阅模式设计的，自然也就需要满足事件订阅发布的三要素：数据、监听、触发。

数据、监听分别对应了 `useSyncExternalStore` 的两个参数：`subscribe`、`getSnapshot`，而触发则是由第三方控制，通过三者的配合完成外部数据与 React 组件的集成。

::: code-group

```tsx [App.tsx]
import { useCounter, increment, decrement } from './counter';

/** 计数器 + 1 */
function Increment() {
  return <button onClick={increment}>+</button>;
}

/** 计数器 - 1 */
function Decrement() {
  return <button onClick={decrement}>-</button>;
}

function App() {
  const counter = useCounter();

  return (
    <section>
      <p>Counter: {counter}</p>
      <Increment />
      <Decrement />
    </section>
  );
}
```

```ts [counter.ts]
import { useSyncExternalStore } from 'react';

/** 计数数据 */
let counter = 0;

/** 数据变化时的回调函数 */
const listeners: (() => void)[] = [];

/** 订阅外部数据变化的回调函数 */
function subscribe(listener: () => void) {
  listeners.push(listener);

  // 取消订阅
  return () => listeners.filter(l => l !== listener);
}

/** 当回调函数触发时，获取外部数据的快照值 */
function getSnapshot() {
  return counter;
}

/** 服务端渲染下调用的外部数据快照值 */
function getServerSnapshot() {
  return counter;
}

/** 计数值 + 1 */
export function increment() {
  counter++;
  // 触发回调函数
  listeners.forEach(listener => listener());
}

/** 计数值 - 1 */
export function decrement() {
  counter--;
  listeners.forEach(listener => listener());
}

/** 获取全局计数数据 */
export function useCounter() {
  const counter = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return counter;
}
```

:::

### 源码解析

从 `useSyncExternalStore` 实现的源码来看，React 主要做了 3 方面的工作：

1. `subscribe` 订阅方法传入更新视图的回调方法，外部调用这个回调方法就可以更新 React 的视图
2. `getSnapshot` 的处理逻辑与 `useState` 类似，都是在使用时调用获得最新的值，通过 `Object.is` 方法判断是否需要更新视图
3. 创建依赖收集，用于保证 `subscribe` 方法更新时，订阅方法始终是最新的

```js
/**
 * 包装视图更新方法，传入 subscribe 订阅方法
 */
function subscribeToStore(fiber, inst, subscribe) {
  var handleStoreChange = function () {
    // 如果两次的值不同，则强制进行更新
    if (checkIfSnapshotChanged(inst)) {
      forceStoreRerender(fiber);
    }
  };

  // 传入到 subscribe 订阅方法，使其能够调动 React 的视图更新
  return subscribe(handleStoreChange);
}

/**
 * 更新 fiber 节点上的快照值
 */
function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
  inst.value = nextSnapshot;
  inst.getSnapshot = getSnapshot;
  if (checkIfSnapshotChanged(inst)) {
    forceStoreRerender(fiber);
  }
}

/**
 * 基于 Object.is 方法对比前后两次的值是否相同
 */
function checkIfSnapshotChanged(inst) {
  var prevValue = inst.value;
  var latestGetSnapshot = inst.getSnapshot;

  try {
    var nextValue = latestGetSnapshot();
    return !objectIs(prevValue, nextValue);
  } catch (error) {
    return true;
  }
}

/**
 * 强制重渲染
 */
function forceStoreRerender(fiber) {
  // 通知 React-Scheduler 调度进行更新
  scheduleUpdateOnFiber(fiber, SyncLane, NoTimestamp);
}

function updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  var hook = updateWorkInProgressHook();
  var fiber = currentlyRenderingFiber$1;

  var nextSnapshot = getSnapshot();

  var prevSnapshot = hook.memoizedState;
  var snapshotChanged = !objectIs(prevSnapshot, nextSnapshot);

  // 如果快照值不同，则将当前 Fiber 上的 memoizedState 的值更新为最新的值
  // 同时流转当前 Fiber 节点到 Root 节点的状态为更新状态，等待调度更新
  if (snapshotChanged) {
    hook.memoizedState = nextSnapshot;
    markWorkInProgressReceivedUpdate();
  }

  var inst = hook.queue;

  // 利用 React 的依赖收集机制，当 subscribe 方法更新时，能够保证 React 内部的订阅方法也是最新的
  updateEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [
    subscribe,
  ]);

  // 如果两次的快照值不同且不是初始化阶段
  if (
    snapshotChanged ||
    inst.getSnapshot !== getSnapshot ||
    (!workInProgressHook && workInProgressHook.memoizedState.tag & HasEffect)
  ) {
    // 消极更新策略（ 即惰性更新 ），避免不必要的组件重新渲染
    fiber.flags |= Passive;

    // 创建依赖收集
    pushEffect(
      HasEffect | Passive$1,
      updateStoreInstance.bind(null, fiber, inst, nextSnapshot, getSnapshot),
      undefined,
      null
    );
  }

  return nextSnapshot;
}
```

因为 `useSyncExternalStore` 使用 `Object.is` 方法判断是否需要更新视图，当 store 是数组/对象这类引用类型时，必须更新数组/对象的引用，才能保证视图的更新。

```ts
/** 计数数据 */
let counter = {
  value: 0,
};

/** 当回调函数触发时，获取外部数据的快照值 */
function getSnapshot() {
  return counter;
}

/** 计数值 + 1 */
export function increment() {
  // 必须更新数组/对象的引用
  counter = { value: counter.value + 1 };
  listeners.forEach(listener => listener());
}

/** 计数值 - 1 */
export function decrement() {
  counter = { value: counter.value - 1 };
  listeners.forEach(listener => listener());
}
```

同时，`getSnapshot` 的返回值也必须是基础类型或者引用类型，React 内部不支持 `Set` / `Map` 这一类的构造方法，传入会导致报错。

### 实际应用

尽管官方说这个钩子是给第三方 npm 开源库的开发者用的，但有一些业务场景确实非常适合用 `useSyncExternalStore` 来实现，比如 `Toast` 提示、`Modal` 弹窗这一类需要使用到静态方法的业务。

::: code-group

```tsx [App.tsx]
import { useState } from 'react';

// 引入 Toast 组件
import Toast from './toast';

function App() {
  const [count, setCount] = useState(1);

  return (
    <button
      onClick={() => {
        // 调用 Toast 提示
        Toast.show(`Toast-${count}`);

        setCount(pre => pre + 1);
      }}
    >
      提示
    </button>
  );
}
```

```tsx [Toast.tsx]
import { useSyncExternalStore } from 'react';
import { createRoot, Root } from 'react-dom/client';

/** 渲染实例 */
let root: Root | null = null;

/** Toast 挂载的节点 */
let toastElement: HTMLDivElement | null = null;

/** Toast 实例列表 */
let allToastInstances: Record<'id' | 'content', string | number>[] = [];

/** 回调函数 */
const listeners: (() => void)[] = [];

/** 注册 Toast 的事件监听函数 */
function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => listeners.filter(l => l !== listener);
}

/** Toast 实例快照 */
function getSnapshot() {
  return allToastInstances;
}

/** Toast 组件 */
function Toast() {
  const allToasts = useSyncExternalStore(subscribe, getSnapshot, () => []);
  return (
    <ul>
      {allToasts.map(toast => (
        <li key={toast.id}>{toast.content}</li>
      ))}
    </ul>
  );
}

/** 弹出 Toast 提示 */
Toast.show = (content: string | number) => {
  // 生成唯一值
  const id = `${Date.now()}-${Math.random().toString(16).substring(2)}`;

  // 如果没有生成挂载点，则先生成挂载点
  if (root === null || toastElement === null) {
    toastElement = document.createElement('div');
    document.body.appendChild(toastElement);

    // 在挂载点上渲染 Toast 组件
    root = createRoot(toastElement);
    root.render(<Toast />);
  }

  // 生成新的 Toast 提示列表
  allToastInstances = allToastInstances.concat({ id, content });
  listeners.forEach(listener => listener());

  // 模拟 2 秒后关闭
  setTimeout(() => {
    // 移除指定的 Toast 提示
    allToastInstances = allToastInstances.filter(conf => conf.id !== id);
    listeners.forEach(listener => listener());

    // 如果 Toast 消息为空时，移除挂载点
    if (allToastInstances.length === 0) {
      root && root.unmount();
      toastElement && document.body.removeChild(toastElement);
      root = null;
      toastElement = null;
    }
  }, 2000);
};

export default Toast;
```

:::

### 参考资料

- [React 18：还学得动吗？](https://zhuanlan.zhihu.com/p/491089782)
- [useSyncExternalStore](https://legacy.reactjs.org/docs/hooks-reference.html#usesyncexternalstore)
