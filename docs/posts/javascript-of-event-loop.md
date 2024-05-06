---
title: Javascript 的事件循环
author: Fei-hui
template: post
keywords: Javascript, Typescript, 事件循环, EventLoop
description: 记录 Javascript 的事件循环、宏任务/微任务等一些内容
date: 2020/09/26
---

Javascript 是一门单线程的编程语言，设计为单线程的本意是为了解决多个线程同时操作同一个 DOM 节点导致的脏读取、不可重复读、幻读这几个问题而提出。

::: tip

Javascript 解决这几个问题的正确解应该是实现一套类似于 Java / MySQL 中的事务机制，但无奈设计初期只是将其作为一门运行在浏览器上的脚本，并没有想到其会成为所有浏览器认定的唯一编程语言，所以复杂的问题直接简单化地处理，将 Javascript 设计成了单线程机制。

:::

单线程解决了一个问题，但又带来了另外一个问题：当 Javascript 发起一个异步任务（ 如 `setTimeout` ）时，在等待异步操作返回结果的这段时间里，浏览器就会进入阻塞状态，无法执行任何逻辑。

于是又为了解决异步任务阻塞会导致浏览器假死这个问题，Javascript 又引入了一个新的机制：事件循环（ Event loop ）。

### 事件循环

从本质上来看，事件循环是 Javascript 底层处理同步/异步任务的一种机制。在不讨论宏任务/微任务、视图更新这些问题的前提下，事件循环会完成下面几步：

![事件循环原理](/assets/javascript-of-event-loop/event-loop-principle.jpg)

1. 任务会进入调用栈（ 先进后出 ）中执行，在任务执行过程中，解析器会根据语法规则判断是同步任务还是异步任务
2. 同步任务会由主线程执行并拿到执行结果，然后再继续执行同步任务后面的逻辑（ 阻塞 ）
3. 异步任务则会委托给 Web API 下的对应线程（ 如网络线程、定时器线程 ）进行处理，委托完成后会继续执行异步任务后面的逻辑，不会等待异步任务的执行结果（ 非阻塞 ）
4. 异步任务在执行完成之后，会注册为回调函数的形式到任务队列（ Event Queues ）等待主线程调用
5. 等待调用栈清空后，主线程会进入清闲状态，这个时候会开始执行任务队列（ 先进先出 ）的回调函数
6. 在任务队列的全部回调函数都清空后，便可以说完成了一次事件循环

在了解了事件循环的机制之后，就很容易理解下面的代码执行结果是 `Start → End → Hello World!` 的原因了。

```js
// 1. 同步任务，立即执行
console.log('Start');

// 2. 异步任务，委托到 Web API 等待执行
setTimeout(() => console.log('Hello World!'), 1000);
// 2. 创建异步任务成功，继续执行后续的代码

// 3. 同步任务，立即执行
console.log('End');
```

### 宏任务/微任务

Javascript 的异步任务分为两类：宏任务、微任务；微任务的优先级大于宏任务，微任务会在当前宏任务执行完成后执行（ 如果没有宏任务则直接执行 ）。

![宏任务 & 微任务](/assets/javascript-of-event-loop/macro-and-micro.jpg)

::: tip

**为什么要分成宏任务、微任务 ？**

在大部分的业务场景下，异步任务一般是相对耗时的任务。

如果没有划分异步任务的类型，当出现“某个晚执行的异步任务需要紧急插队执行，其他非紧急的异步任务延后执行”这种情况时，紧急的异步任务就必须等前面的异步任务都执行完成才能执行，这明显不符合我们的期望。

也就是说，宏任务、微任务是人为划分出来的概念，大部分情况下我们只需要知道哪些语法对应的是宏任务，哪些是微任务，了解宏任务、微任务的优先级即可。

:::

**宏任务（ Macro Task ）**：一个较大的、独立的任务单元

1. 视图渲染：布局、样式变更、媒体查询、DOM 事件
2. I/O 操作：`fs` ( Node.js )
3. 网络请求：`fetch` / `XMLHttpRequest`
4. 定时器任务：`setTimeout` / `setInterval` / `setImmediate` ( Node.js )

**微任务（ Micro Task ）**：期望尽快执行、较小的任务单元

1. `Promise.then` / `Promise.reject` / `Promise.finally`
2. `MutationObserver` / `PerformanceObserver` / `IntersectionObserver`
3. `process.nextTick` ( Node.js )

在了解宏任务与微任务的定义、优先级之后，可以看个面试题中很常见的题目：

```ts
// 1. 同步任务，立即执行
console.log('Start');

// 2. 异步任务（ 宏任务 1 ），委托到 Web API 等待执行
setTimeout(() => console.log('setTimeout 1'), 0);
// 2. 创建异步任务（ 宏任务 1 ）成功，继续执行后续的代码

// 3. 异步任务（ 宏任务 2 ），委托到 Web API 等待执行
setTimeout(() => console.log('setTimeout 2'), 0);
// 3. 创建异步任务（ 宏任务 2 ）成功，继续执行后续的代码

// 4. 创建一个 Promise 实例是同步任务，立即执行
const promise = new Promise(resolve => {
  console.log('new Promise');
  // 模拟一个异步操作
  requestAnimationFrame(resolve);
});

// 5. 异步任务（ 微任务 ），委托到 Web API 等待执行
promise
  .then(() => {
    // 微任务 1 会在宏任务 1 结束后立即执行
    console.log('promise.then 1');
  })
  .then(() => {
    // 会在微任务 1 执行结束后立即执行
    console.log('promise.then 2');
  });
// 5. 创建异步任务（ 微任务 ）成功，继续执行后续的代码

// 6. 同步任务，立即执行
console.log('End');
```

执行结果：

![代码执行结果](/assets/javascript-of-event-loop/macro-and-micro-result.png)

### 参考资料

- [搞清事件循环、宏任务、微任务](https://347830076.github.io/myBlog/javascript/%E6%90%9E%E6%B8%85%E4%BA%8B%E4%BB%B6%E5%BE%AA%E7%8E%AF%E5%AE%8F%E4%BB%BB%E5%8A%A1%E5%BE%AE%E4%BB%BB%E5%8A%A1.html)
- [深入理解js事件循环机制（浏览器篇）](https://lynnelv.github.io/js-event-loop-browser)
- [JavaScript中的Event Loop（事件循环）机制](https://segmentfault.com/a/1190000022805523)
