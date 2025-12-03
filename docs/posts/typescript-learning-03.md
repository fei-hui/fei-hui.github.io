---
title: Typescript 学习 —— 类型操作符
author: Fei-hui
template: post
keywords: Typescript,类型操作符
description: Typescript 类型操作符相关的学习笔记
date: 2021/07/04 14:14
---

最近因为要解决项目里一些工具方法的类型问题，接触了一些关于类型编程（类型体操）相关的逻辑。在解决问题的过程中，发现自己对于类型操作符理解得比较笼统，因此记录以备日后温故。

### keyof 操作符

`keyof` 操作符支持将一个数组类型/对象类型作为参数，对应的返回值也不同。

1. 对象类型：返回对象上的所有键名组成的联合类型，效果等同于 `Object.keys(object)`
2. 数组类型：返回数组原型链上的所有方法名组成的联合类型，效果等同于 `Object.getOwnPropertyNames(Array.prototype)`

```ts
type KeyOf<T> = keyof T;

type ArrKeys = KeyOf<[]>; // type ArrKeys = "concat" | "fill" | "filter" | ...;
type ObjKeys = KeyOf<{ id: number; name: string }>; // type ObjKeys = 'id' | 'name';
```

### typeof 操作符

`typeof` 操作符可以根据代码的上下文推导出变量的类型，也就是说 `typeof` 操作符不能对类型使用，只能对变量值使用。效果与 `Object.prototype.toString.call(typeValue)` 差不多，但 `typeof` 操作符更详细，可以推导出引用类型子元素的类型。

<!-- prettier-ignore-start -->
```ts
// ========================== 基础类型 ==========================
const str = 'Hello World';
const num = 1;
const bool = true;
const none = null;
const undef = undefined;
const symbol = Symbol('Hello World');

type StrType = typeof str;       // type StrType    = string;
type NumType = typeof num;       // type NumType    = number;
type BoolType = typeof bool;     // type BoolType   = boolean;
type NoneType = typeof none;     // type NoneType   = null;
type UndefType = typeof undef;   // type UndefType  = undefined;
type SymbolType = typeof symbol; // type SymbolType = typeof symbol;

// ========================== 引用类型 ==========================
const arr = ['1', '2'];
const obj = { name: 'Fei-hui', age: 18 };
const set = new Set<string>();
const map = new Map<string, string>();
const date = new Date();

type ArrType = typeof arr;   // type ArrType  = string[];
type ObjType = typeof obj;   // type ObjType  = { name: string; age: number };
type SetType = typeof set;   // type SetType  = Set<string>;
type MapType = typeof map;   // type MapType  = Map<string, string>;
type DateType = typeof date; // type DateType = Date;
```
<!-- prettier-ignore-end -->

### extends 操作符

我个人在实际的开发中，经常用 `extends` 操作符来约束泛型参数的类型，来检测两个类型中的特定几个字段是否一致。

```ts
interface Person {
  id: number;
  name: string;
}

interface Officer {
  key: string;
  age: number;
  name: string;
}

// 教师和学生继承 Person 这个类型
interface Student extends Person {
  score: number;
}
interface Teacher extends Person {
  class: number;
}

// 此时在泛型中约束 T 继承于 Person 类型，约束传入数据的类型必须符合 Person 的约束
function initPerson<T extends Person>(person: T) {
  return person;
}

// 可以正常通过
const student = initPerson<Student>({ id: 1, name: 'student', score: 95 });
const teacher = initPerson<Teacher>({ id: 2, name: 'teacher', class: 5 });

// 会提示类型 Officer 不满足约束 Person
const officer = initPerson<Officer>({ key: '3', name: 'wang-wu', age: 20 });
```

除此之外，如果 `D extends B` 中的类型推导通过，Typescript 会继续执行 `D extends B` 后面的语句；同时 Typescript 也提供了 Javascript 的三元运算符，可以通过 `D extends B ? T : F` 便可以实现类型判断，这种类型判断对应的是 Javascript 的 `if/else` 语句。

```ts
type NumberLike<T> = T extends number ? true : false;

type ValidNumber = StringLike<12>; // type ValidNumber = true;
type InvalidNumber = NumberLike<''>; // type InvalidNumber = false;
```

### infer 关键字

在 Typescript 里，`infer` 关键字的作用是提取指定变量的类型，类似于 lodash 中的 `pick` 工具函数，从对象里取出对应键的值，大部分情况下用于函数的入参/返回值的类型提取。

```ts
// 可以利用函数解构提取全部的入参的类型，结果会处理成元组
type AllParamsType<T> = T extends (...args: infer R) => any ? R : never;

// 提取第一个入参的类型
type FirstParamType<T> = T extends (arg: infer R) => any ? R : never;

// 提取第二个入参的类型，以此类推可以提取第 n 个入参的类型
type SecondParamType<T> = T extends (arg1: any, arg2: infer R) => any
  ? R
  : never;

// 提取 Promise 返回值的类型
type AwaitPromiseType<T> = T extends Promise<infer R> ? R : never;

// 提取函数的函数
type ReturnValueType<T> = T extends (arg: any) => infer R ? R : never;

// 模拟 Promise 的返回值
const P = Promise.resolve(true);

type VoidLike = ReturnValueType<(str: string) => void>; // type VoidLike = void;
type StringLike = FirstParamType<(str: string) => void>; // type StringLike = string;
type NumberLike = SecondParamType<(str: string, num: number) => void>; // type NumberLike = number;
type BooleanLike = AwaitPromiseType<typeof P>; // type BooleanLike = boolean;
type ParamTupleLike = AllParamsType<(str: string, num: number) => void>; // type ParamTupleLike = [string, number];
```

### 参考文章

- [Creating Types from Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
