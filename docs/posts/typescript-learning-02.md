---
title: Typescript 学习 —— 函数重载, 泛型, 类型守卫, 抽象类
author: Fei-hui
template: post
keywords: Typescript, 函数重载, 泛型, 类型守卫, 抽象类
description: 关于 Typescript 函数重载、泛型、类型守卫、抽象类的学习笔记
date: 2021/05/27 14:14
---

这几个月尝试在几个比较简单的新项目里使用 Typescript 进行开发，逐渐掌握了一些基础的语法跟开发范式，但也记录了一些问题。最近一段时间整理了一些感觉比较重要的问题，加深对 Typescript 的理解。

### 函数重载

假设现在有一个需求，需要实现一个通过 `studentId` 查询学生信息的方法 `getStudent` ，支持单个查询和批量查询，这个方法有下列限制：

1. 当函数入参是 `string` 类型时，函数的返回值的是 `Student`
2. 当函数入参是 `string[]` 类型时，函数的返回值的是 `Student[]`

在不使用函数重载之前，我们只能使用联合类型标识返回值，但明显不符合期望。

```ts
type Student = {};

function getStudent(studentId: string | string[]): Student | Student[] {
  // 函数方法实现
}

// aStudent → Student | Student[]
const aStudent = getStudent('1');

// students → Student | Student[]
const students = getStudent(['1', '2']);
```

而 `Typescript` 函数重载的机制可以解决这个问题

```ts
type Student = {};

// 声明单个查询学生的类型 // [!code ++]
function getStudent(studentId: string): Student; // [!code ++]

// 声明批量查询学生的类型 // [!code ++]
function getStudent(studentId: string[]): Student[]; // [!code ++]

// 此时再声明函数的类型便可以触发 Typescript 的函数重载机制
function getStudent(studentId: string | string[]): Student | Student[] {
  // 函数方法实现
}

// aStudent → Student
const aStudent = getStudent('1');

// students → Student[]
const students = getStudent(['1', '2']);
```

### 泛型

作为微软的产品，Typescript 广泛借鉴了旗下编程语言 C# 的特性，泛型就是其中之一。

官方对于泛型的定义是**允许同一个函数接受不同类型参数的一种模板**。简单理解，泛型是一种动态的[类型守卫](#类型守卫)，根据传入的类型动态地收窄类型，常用于函数、类、接口等业务场景。

```ts
type VueConf = { id: number };
type ReactConf = { key: string };

// 既能约束入参，也能约束出参
function createConfig<T>(config: T): T {
  return config;
}

// vueConf → { id: number }
const vueConf = createConfig<VueConf>({ id: 1 });

// reactConf → { key: string }
const reactConf = createConfig<ReactConf>({ key: 'a' });
```

除了上述提到的工具函数，泛型在业务开发中也非常地广泛。以一段基于 axios 实现请求后端接口的业务代码为例，代码里定义了两个泛型：`RequestConfig` 和 `AxiosResponse` ，分别用于定义请求参数和返回参数的结构，代码中还运用了泛型嵌套 `Promise<AxiosResponse<T>>` ，方便对多层结构的复用。

```ts
import axios from 'axios';

// 请求参数的结构
interface RequestConfig<P> {
  /** 请求地址 */
  url: string;
  /** 请求方式 */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** 请求数据 */
  data: P;
}

// 返回参数的结构
interface AxiosResponse<T> {
  /** 响应状态 */
  code: number;
  /** 响应状态信息 */
  message?: string;
  /** 响应数据 */
  data: T;
}

const $axios = axios.create({ baseURL: 'https://demo.com' });

// 声明了两个泛型类型T和P
// T - 返回参数的泛型，默认值为 void，在无返回参数的时候不需要传类型声明
// P - 请求参数的泛型，默认值为 void，在无请求参数的时候不需要传类型声明
// 泛型支持嵌套，如 Promise<AxiosResponse<T>> 即表示 AxiosResponse<T> 的返回值在 Promise 中
async function createRequest<T = void, P = void>(
  conf: RequestConfig<P>
): Promise<AxiosResponse<T>> {
  try {
    // 假设 data 中是预想中的返回参数
    const { code, data: response } = await $axios({
      url: conf.url,
      data: conf.data || {},
      method: conf.method || 'GET',
    });

    // 正常响应
    if (code === 200) {
      return Promise.resolve(response);
    }

    // 错误响应
    return Promise.reject(response);
  } catch (e) {
    // 错误响应
    return Promise.reject(e);
  }
}

// 无参数时使用，无需约束泛型
await createRequest({ url: 'api/connect' });

/** 请求类型 */
interface RequestInterface {
  /** 对应天气的日期 */
  date: string;
}

/** 响应类型 */
interface ResponseInterface {
  /** 对应日期的天气 */
  weather: string;
}

// 有参数时使用，通过泛型约束提升代码质量
const { weather } = await createRequest<RequestInterface, ResponseInterface>({
  url: 'api/weather',
  data: { date: '2021-02-31' },
});
```

### 类型守卫

将多个类型收窄成较少类型的行为都可以理解成类型守卫。

以函数重载的代码为例，`Array.isArray` 将 `if` 语句里的 `studentId` 的类型收窄成了 `string[]` ，**只要出现了类型的收窄行为**都可以理解成是类型守卫。

```ts{11}
type Student = { id: string };

// 声明单个查询学生的类型
function getStudent(studentId: string): Student;

// 声明批量查询学生的类型
function getStudent(studentId: string[]): Student[];

// 查询学生信息，支持批量查询
function getStudent(studentId: string | string[]): Student | Student[] {
  if (Array.isArray(studentId)) {
    // 批量查询学生信息的逻辑
    return [{ id: '1' }, { id: '2' }];
  }

  // 单个查询学生信息的逻辑
  return { id: '1' };
}
```

如果我们也要实现类似于 `Array.isArray` 的类型收窄行为，则可以通过类型谓词函数 `is` 来实现，这种类型收窄也叫自定义守卫。

```ts{2,8,18}
// 判断是否为字符串
function isString<T>(data: T): data is string {
  // 返回值为 true 时会触发 Typescript 的类型谓词函数判断
  return typeof data === 'string';
}

// 判断是否为数字
function isNumber<T>(data: T): data is number {
  return typeof data === 'number';
}

class Student {
  // 标示是否为学生类
  public type = 'student';
}

// 自定义类型判断
function isStudent<T>(data: T): data is Student {
  return data.type === 'student';
}
```

### 抽象类

关于抽象类，我查了一下官方对于抽象类（[Abstract Classes](https://www.typescriptlang.org/docs/handbook/classes.html#abstract-classes)）的定义：

> Abstract classes are base classes from which other classes may be derived. They may not be instantiated directly. Unlike an interface, an abstract class may contain implementation details for its members. The abstract keyword is used to define abstract classes as well as abstract methods within an abstract class.
>
> 抽象类是可以派生出其他类的基类，抽象类不能直接实例化。与接口不同，抽象类可以包含其成员的实现细节。`abstract` 关键字用于定义抽象类以及抽象类中的抽象方法。

换而言之，抽象类既可以是类型声明，也可以是基类。这两种情况分别对应 Typescript 两个关键字：`implements` 、`extends`

1. `implements` 关键字：将抽象类看做类型声明，抽象类只能定义而不能实现
2. `extends` 关键字：将抽象类看做基类，抽象类既可以定义也可以实现，但是继承的派生类必须加上 `super()` 语句

::: code-group

```ts{20,23} [implements]
/** 性别枚举 */
enum PERSON_GENDER {
  /** 男 */
  MAN = '0',
  /** 女 */
  WOMAN = '1',
}

abstract class PersonAbstractClass {
  /** 用户 ID */
  public abstract id: number;

  /** 用户姓名 */
  public abstract name: string;

  /** 用户性别 */
  public abstract gender: PERSON_GENDER;

  /** 打招呼 */
  public abstract greet(): void;
}

class Person implements PersonAbstractClass {
  public id = -1;

  public name = '';

  public gender = PERSON_GENDER.MAN;

  constructor(id: number, name: string, gender: PERSON_GENDER) {
    this.id = id;
    this.name = name;
    this.gender = gender;
  }

  public greet(): void {
    console.log('Hello, My name is', this.name);
  }
}

const zs = new Person(1, 'ZhangSan', PERSON_GENDER.MAN);
const ls = new Person(2, 'LiSi', PERSON_GENDER.WOMAN);

zs.greet();
ls.greet();
```

```ts{25,32} [extends]
/** 性别枚举 */
enum PERSON_GENDER {
  /** 男 */
  MAN = '0',
  /** 女 */
  WOMAN = '1',
}

abstract class PersonAbstractClass {
  /** 用户 ID */
  public id: number;

  /** 用户姓名 */
  public abstract name: string;

  /** 用户性别 */
  public abstract gender: PERSON_GENDER;

  /** 打招呼 */
  public greet(): void { // [!code ++]
    console.log('Hello, My name is', this.name); // [!code ++]
  } // [!code ++]
}

class Person extends PersonAbstractClass {
  public id = -1;

  public name = '';

  public gender = PERSON_GENDER.MAN;

  constructor(id: number, name: string, gender: PERSON_GENDER) {
    super();

    this.id = id;
    this.name = name;
    this.gender = gender;
  }

  public greet(): void { // [!code --]
    console.log('Hello, My name is', this.name); // [!code --]
  } // [!code --]
}

const zs = new Person(1, 'ZhangSan', PERSON_GENDER.MAN);
const ls = new Person(2, 'LiSi', PERSON_GENDER.WOMAN);

zs.greet();
ls.greet();
```

:::

如果抽象类中只有属性/方法的定义，那么两者除了语义上的区别之外，其他并没有实质的区别，这一点可以通过构建后的最终产物确定。

::: code-group

```js [implements]
'use strict';
var PERSON_GENDER;
(function (PERSON_GENDER) {
  PERSON_GENDER['MAN'] = '0';
  PERSON_GENDER['WOMAN'] = '1';
})(PERSON_GENDER || (PERSON_GENDER = {}));
class PersonAbstractClass {}
class Person {
  constructor(id, name, gender) {
    this.id = -1;
    this.name = '';
    this.gender = PERSON_GENDER.MAN;
    this.id = id;
    this.name = name;
    this.gender = gender;
  }
  greet() {
    console.log('Hello, My name is', this.name);
  }
}
const zs = new Person(1, 'ZhangSan', PERSON_GENDER.MAN);
const ls = new Person(2, 'LiSi', PERSON_GENDER.WOMAN);
zs.greet();
ls.greet();
```

```js [extends]
'use strict';
var PERSON_GENDER;
(function (PERSON_GENDER) {
  PERSON_GENDER['MAN'] = '0';
  PERSON_GENDER['WOMAN'] = '1';
})(PERSON_GENDER || (PERSON_GENDER = {}));
class PersonAbstractClass {}
class Person extends PersonAbstractClass {
  constructor(id, name, gender) {
    super();
    this.id = -1;
    this.name = '';
    this.gender = PERSON_GENDER.MAN;
    this.id = id;
    this.name = name;
    this.gender = gender;
  }
  greet() {
    console.log('Hello, My name is', this.name);
  }
}
const zs = new Person(1, 'ZhangSan', PERSON_GENDER.MAN);
const ls = new Person(2, 'LiSi', PERSON_GENDER.WOMAN);
zs.greet();
ls.greet();
```

:::

::: warning

在抽象类中的某个属性是带有数字类型的枚举值时，继承这个抽象类的类属性可以使用其他数字初始化，而且这个类属性会被重置为 `number` 类型。

```ts
enum ENUM_VALUE {
  NUMBER = 1,
  STRING = '0',
  BOOLEAN = true,
}

abstract class DemoAbstractClass {
  // 在抽象类中的属性中声明 enum 为对应的枚举
  public abstract enumValue: ENUM_VALUE;
}

class Demo implements DemoAbstractClass {
  // 使用非枚举中的数字不会提示报错，且该属性的类型被重置为 number
  // 使用非数字类型的其他类型进行赋值，则会提示类型不符
  public enumValue = 2;

  constructor(enumValue: ENUM_VALUE) {
    // 会提示类型不符
    this.enumValue = enumValue;
  }
}
```

暂时不确定是否为 Typescript 的 BUG ，只能尽量避免这种代码书写情况。

:::

### 参考文章

- [Class](https://www.typescriptlang.org/docs/handbook/classes.html)
- [一文读懂 TypeScript 泛型及应用（7.8K字）](https://juejin.cn/post/6844904184894980104)
- [1.2W字 | 了不起的 TypeScript 入门教程](https://juejin.cn/post/6844904182843965453)
