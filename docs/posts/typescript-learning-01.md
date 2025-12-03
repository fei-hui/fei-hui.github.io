---
title: Typescript 学习 —— 数据类型，交叉类型，联合类型
author: Fei-hui
template: post
keywords: Typescript
description: 用于记录学习 Typescript 过程中的笔记/踩坑，用以敦促自己变强
date: 2021/03/08 14:14
---

我在 2019 年底开始学习 Typescript 的知识，学习不算很快，期间整理了许多的笔记和代码片段，花了一段时间整理成了笔记以便日后自己复习使用。

### 基础数据类型

Javascript 一共有 6 种基础类型：`String` / `Number` / `Boolean` / `Null` / `Undefined` / `Symbol` ，与之对应 Typescript 中的 6 种基础类型声明： `string` / `number` / `boolean` / `null` / `undefined` / `symbol` 。

除此之外，Typescript 还额外新增了 `never` / `void 0` 这两种基础类型。

基础数据类型的类型声明适用的几条规则：

1. Typescript 在编译时会对代码做静态类型检查，多数情况下不支持隐式转换，即 `let yep: boolean = 1` 会报错
2. Typescript 中的基础类型声明的首字母不区分大小写，即 `let num: number = 1` 等同于 `let num: Number = 1` ，但是推荐小写形式
3. Typescript 允许变量有多种类型（即联合类型），通过 `|` 连接即可，如 `let yep: number | boolean  = 1`，但是不建议这么做
4. 类型声明不占用变量，因此 `let boolean: boolean = true` 是允许的，但是不建议这么用
5. 默认情况下，除了 `never` ，Typescript 可以把其他类型声明（包括引用数据类型）的变量赋值为 `null` / `undefined` / `void 0` 而不报错。但这肯定是错误的，建议在项目的 tsconfig.json 文件中设置 `"strictNullChecks": true` 屏蔽掉这种情况
6. 对于基础类型而言，`unknown` 与 `any` 的最终结果是一致的

```ts
// 字符串类型声明，单引号/双引号不影响类型推断
let str: string = 'Hello World';

// 数字类型声明
let num: number = 120;
// 这些值也是合法的数字类型
let nan: number = NaN;
let max: number = Infinity;
let min: number = -Infinity;

// 布尔类型声明
let not: boolean = false;
// Typescript 只对结果进行检查，!0 最后得到 true，因此不会报错
let yep: boolean = !0;

// symbol 类型声明
let key: symbol = Symbol('key');

// never 类型不能进行赋值
// 执行console.log(never === undefined)，执行结果为true
let never: never;
// 但即使 never === undefined ，赋值逻辑仍然会报错
never = undefined;

// 除了never，未开启 strictNullChecks 时，其他类型变量赋值为 null / undefined /void 0 不报错
let always: boolean = true;
let isNull: null = null;
// 不会报错
always = null;
isNull = undefined;
```

### 引用数据类型

Javascript 的引用数据类型有 2 种：`Array` / `Object` 等，与基础类型不一样的地方是，Typescript 有些地方并不能简单地与 Javascript 直接对应，部分的执行结果让人摸不着头脑。

在书写规则上，除了`Object` 以外，Typescript 其他的引用数据类型声明的首字母必须大写，如 `let list: array<number> = [1]` 会报错，必须写成 `let list: Array<number> = [1]`。原因是这些引用数据类型在本质上都是构造函数，Typescript 的底层会通过类似于 `list instanceof Array` 的逻辑进行类型比对。

其中比较有意思的一个点是：在所有的数据类型里，`Array` 是唯一的泛型类型，也是唯一有两种不同的写法：`Array<T>` 和 `T[]`。

与数组相关的类型声明还有元组 `Tuple` ，跟数组的差别主要体现在：元组的长度是固定已知的。因此使用场景也非常明确，适合用在有固定的标准/参数/配置的地方，比如经纬度坐标、屏幕分辨率等。

```ts
// 数组类型有 Array<T> 和 T[] 两种写法
let arr1: Array<number> = [1];
let arr2: number[] = [2];

// 未开启 strictNullChecks 时，赋值为 null / undefined / void 0 不报错
let arr3: number[] = null;
// 编译时不会报错，运行时报错
arr3.push(1);

// 元组类型
// 坐标表示
let coordinate: [number, number] = [114.256429, 22.724147];
```

在 Typescript 中关于对象的类型声明一共有三种形式：`Object` / `object` / `{}`，我一开始以为 `Object` 会像 `Array` 也是泛型类型，然而经过测试发现不仅不是泛型，还有个首字母小写形式的 `object` ，`Object` / `object` / `{}`三者之间的执行结果完全不同：

- 以 `Object` 作为类型声明时，变量值可以是任意值，如字符串/数字/数组/函数等，但是如果变量值不是对象，则无法使用其变量值特有的方法，如 `let list: Object = []` 不会报错，但执行 `list.push(1)` 会报错。造成这种情况的原因是因为在 Javascript 中，在当前对象的原型链上找不到属性/方法时，会向上一层对象进行查找，而 `Object.prototype` 是所有对象原型链查找的终点，也因此在 Typescript 中将类型声明成 `Object` 不会报错，但无法使用非对象的属性/方法

- 以 `object` 作为类型声明时，变量值只能是对象，其他值会报错。值得注意的是，`object` 声明的对象无法访问/添加对象上的任何属性/方法，实际效果类似于通过 `Object.create(null)` 创建的空对象，暂时不知道这么设计的原因

- `{}` 其实就是匿名形式的 type，因此支持通过 `&` 、`|` 操作符对类型声明进行扩展（ 即交叉类型和联合类型 ）

```ts
// 赋值给数字不会报错
let one: Object = 1;
// 也赋值给数组,但无法使用数组的 push 方法
let arr: Object = [];
// 会报错
arr.push(1);

// 赋值会报错
let two: object = 2;

// object 作为类型声明时，赋值给对象时不会报错
let obj1: object = {};
let obj2: object = { name: '王五' };
let Obj3: Object = {};

// 会报错
obj1.name = '张三';
obj1.toString();
obj2.name;

// 不会报错
Obj3.name = '李四';
Obj3.toString();

// {} 等同于匿名形式的 type
type UserType = { name: string };

let user: UserType = { name: '李四' };
let data: { name: string } = { name: '张三' };
```

### 交叉类型和联合类型

上文提到，Typescript 支持通过 `&` 、`|` 操作符对类型声明进行扩展，用&相连的多个类型是交叉类型，用|相连的多个类型是联合类型。

两者之间的区别主要体现在联合类型主要在做类型的合并，如 `Form4Type` 、`Form6Type` ；而交叉类型则是求同排斥，如 `Form3Type`、`Form5Type` 。也可以用数学上的合集和并集来分别理解联合类型和交叉类型。

```ts
type Form1Type = { name: string } & { gender: number };
// 等于 type Form1Type = { name: string; gender: number; }
type Form2Type = { name: string } | { gender: number };
// 等于 type Form2Type = { name?: string; gender?: number; }

let form1: Form1Type = { name: '王五' }; // 提示缺少gender参数
let form2: Form2Type = { name: '刘六' }; // 验证通过

type Form3Type = { name: string } & { name?: string; gender: number };
// 等于 type Form3Type = { name: string; gender: number; }
type Form4Type = { name: string } | { name?: string; gender: number };
// 等于 type Form4Type = { name?: string; gender: number; }

let form3: Form3Type = { gender: 1 }; // 提示缺少name参数
let form4: Form4Type = { gender: 1 }; // 验证通过

type Form5Type = { name: string } & { name?: number; gender: number };
// 等于 type Form5Type = { name: never; gender: number; }
type Form6Type = { name: string } | { name?: number; gender: number };
// 等于 type Form6Type = { name?: string | number; gender: number; }

let form5: Form5Type = { name: '张三', gender: 1 }; // 提示name的类型为never，不能进行赋值
let form6: Form6Type = { name: '张三', gender: 1 }; // 验证通过
```

上述的代码片段一般只会在面试题里面出现，如果这种代码出现在真实的项目代码里面，估计在代码评审的时候就直接被点名批评了。

不过也不是没有实用场景，以苹果的教育优惠举个例子：

假设原价购买苹果 12 需要 5000 元；如果通过教育优惠购买则可以享受一定折扣的优惠（比如打8折），但是需要提供学生证或者是教师证。经过产品经理的整理，转变为需求文档之后可能就变成了：原价购买无需其他材料，如需享受教育优惠，则需要提交个人资料以及学生证/教师证扫描件。

```ts
// 原价购买
type StandardPricing = {
  mode: 'standard';
};
// 教育优惠购买需要提供购买人姓名和相关证件
type EducationPricing = {
  mode: 'education';
  buyer_name: string;
  sic_or_tic: string;
};
// 通过 & 和 | 合并类型
type BuyiPhone12 = { price: number } & (StandardPricing | EducationPricing);

let standard: BuyiPhone12 = { mode: 'standard', price: 5000 };
let education: BuyiPhone12 = {
  mode: 'education',
  price: 4000,
  buyer_name: '张三',
  sic_or_tic: '证件',
};
```

### Type 和 Interface

在一开始学习 Typescript 的时候看到 `interface` ，我第一时间想到的是 Java 。Java 的 `interface` 是一种抽象类，把功能的定义和具体的实现进行分离，方便不同人员可以通过 `interface` 进行相互配合，类似于需求文档在开发中的作用。

```java
// 张三定义了用户中心的功能有三个：登录、注册、找回密码
interface UserCenterDao {
  void userLogin();
  void userRegister();
  void userResetPassword();
}

// 李四开发用户中心的功能就会提示需要实现三个功能
class UserCenter implements UserCenterDao {
  public void userLogin() {};
  public void userRegister() {};
  public void userResetPassword() {};
}
```

Typescript 对于 `interface` 的定义也是类似，都是声明一系列的抽象变量/方法，然后通过具体的代码去实现。

`interface` 整体的效果与用 `type` 声明的效果非常相似，即使是专属于 `interface` 的继承 `extends`，`type` 也可以通过 `&` 、`|` 操作符实现，两者之间也不是独立的，也可以互相进行调用。

因此在平时的实际开发中，不必太过纠结使用 `type` 还是 `interface` 进行类型的声明，特别纠结的时候 `type` 一把梭。

```ts
// 用 interface 定义一个学生的基础属性为姓名、性别、学校、年级、班级
interface Student {
  name: string;
  gender: '男' | '女';
  school: string;
  grade: string | number;
  class: number;
}

// 用 interface 继承学生的基础属性
// 并追加定义三好学生的标准为遵守校规、乐于助人，班级前三
interface MeritStudent extends Student {
  toeTheLine: boolean;
  helpingOther: boolean;
  topThreeInClass: boolean;
}

// 可以通过 type 将 interface 声明的类型声明到新声明上
type StudentType = Student;

// interface 虽然不能直接使用 type 声明的类型，但是可以通过继承间接使用
interface CollageStudent extends StudentType {}

// 然后声明相对应的逻辑去实现
let xiaoming: Student = {
  name: '小明',
  gender: '男',
  school: '清华幼儿园',
  grade: '大大班',
  class: 1,
};

let xiaowang: MeritStudent = {
  name: '小王',
  gender: '男',
  school: '清华幼儿园',
  grade: '大大班',
  class: 1,
  toeTheLine: true,
  helpingOther: true,
  topThreeInClass: true,
};

let xiaohong: StudentType = {
  name: '小红',
  gender: '女',
  school: '朝阳小学',
  grade: 1,
  class: 1,
};
```

说起 `type` 和 `interface` ，有一道非常经典的 Typescript 面试题：`type` 和 `interface` 的区别在哪里？

先说个人感受。我个人感觉 `type` 和 `interface` 的区别主要是在语义上，`type` 在官方文档的定义是类型别名，而 `interface` 的定义是接口。

下面的代码可以非常明显体现其两者在语义上的区别，其实两者在语法方面的区别并不算大。

```ts
// type 可以给类型定义别名
type StudentName = string;

// interface 可以像 Java 定义一个学生的抽象类
interface StudentInterface {
  addRecord: (subject: string, score: number, term: string) => void;
}

// 等同于 let name: string = '张三'
let name: StudentName = '张三';

// 构造函数 CollageStudent 获得抽象类 StudentInterface 的声明
class CollageStudent implements StudentInterface {
  public record = [];

  addRecord(subject, score, term) {
    this.record.push({ subject, score, term });
  }
}

// type 其实也定义类似的类型声明结构，但是从语义上来说并不是抽象类
type TeacherType = {
  subject: Array<string>;
};
// 构造函数也可以获得 type 声明的类型，语法上是可以实现的
// 但是从语义和规范的层面上来说不推荐这么写
class CollageTeacher implements TeacherType {
  subject: ['数学', '体育'];
}
```

至于标准答案，官方文档（ [点击此处](https://www.typescriptlang.org/docs/handbook/advanced-types.html#interfaces-vs-type-aliases) ）中给出了两者在语法上的具体区别。

![Type VS Interface](/assets/typescript-learning-01/type-vs-interface.png)
